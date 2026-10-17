import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CompiledDraft,
  CompiledDraftSchema,
  checkRecipeTrust,
  type Issue,
  loadPlanProject,
  readRecipeTrust,
  recipeCodeHash,
} from "@naraframe/core";
import { bundle } from "@remotion/bundler";
import {
  makeCancelSignal,
  openBrowser,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { VERSION as remotionVersion } from "remotion";
import { encodeAudioWhenMuxing } from "./audio-encoding.js";
import { FONT_RENDER_FAILURE } from "./remotion/typography.js";
import {
  type VisualPreflightReport,
  visualPreflightProperty,
} from "./remotion/visual-preflight.js";

/**
 * Frames are captured one browser tab at a time. With Remotion's default of
 * several parallel tabs, a machine under CPU load occasionally captured a
 * frame before its tab had finished painting (a repeated top band, or missing
 * elements) and still reported success. Serial capture removed it in testing
 * at a cost of a few seconds per draft.
 */
export const RENDER_CONCURRENCY = 1;

/** The part of Remotion's browser handle that releasing it needs. */
export interface ReleasableBrowser {
  close(options: { silent: boolean }): Promise<void>;
  runner: { forgetEventLoop(): void };
}

/**
 * Chrome is started with piped stdout and stderr, and Remotion keeps those
 * pipes referenced by the event loop. Chrome hands the same descriptors to
 * helpers it starts outside its own process group (its crash handler and the
 * Google updater wake-up), and those can outlive Chrome by minutes. Until the
 * last holder exits, the pipes stay open and the command stays alive even
 * though it has already printed its result. Closing the browser ourselves and
 * then dropping the pipes from the event loop lets the command end when its
 * own work is done; the helpers are left to exit on their own.
 */
export const releaseBrowser = async (
  browser: ReleasableBrowser,
): Promise<void> => {
  try {
    await browser.close({ silent: true });
  } catch {
    // Closing runs after the render has already succeeded or failed; a browser
    // that is already gone must not replace that outcome.
  }
  try {
    browser.runner.forgetEventLoop();
  } catch {
    // The transport socket is already gone after close; the process and its
    // pipes were unreferenced before that step ran.
  }
};

const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const resolveBrowserExecutable = async (
  requested?: string,
): Promise<string> => {
  const browserExecutable =
    requested ?? process.env.NARAFRAME_BROWSER_EXECUTABLE ?? macChrome;
  try {
    await access(browserExecutable);
    return browserExecutable;
  } catch {
    throw new Error(
      `Browser executable not found at ${browserExecutable}. Set NARAFRAME_BROWSER_EXECUTABLE to an installed Chrome or Chromium binary.`,
    );
  }
};

const resolveEntryPoint = async (): Promise<string> => {
  const compiledEntry = fileURLToPath(
    new URL("./remotion/entry.js", import.meta.url),
  );
  try {
    await access(compiledEntry);
    return compiledEntry;
  } catch {
    return fileURLToPath(new URL("./remotion/entry.tsx", import.meta.url));
  }
};

/**
 * For a draft with recipe scenes, re-reads the project's recipes, confirms
 * the code on disk is the code that was compiled and that the owner trusts
 * it, then writes a wrapper entry that registers those modules before the
 * normal entry. The CLI checks trust first; this is the renderer's own guard.
 */
export const prepareRecipeEntry = async (
  draft: CompiledDraft,
  projectRoot: string,
  baseEntry: string,
): Promise<{ entry: string; directory: string } | null> => {
  const used = new Map<string, string>();
  for (const scene of draft.scenes) {
    if (scene.visual.type === "recipe") {
      used.set(scene.visual.recipe, scene.visual.codeSha256);
    }
  }
  if (used.size === 0) return null;
  const loaded = await loadPlanProject(projectRoot);
  if (!loaded.ok) {
    throw new Error(
      `Recipe project could not be re-read before rendering: ${loaded.issues.map((issue) => issue.code).join(", ")}.`,
    );
  }
  const untrusted = checkRecipeTrust(draft, await readRecipeTrust(projectRoot));
  if (untrusted.length > 0) {
    throw new Error(untrusted.map((issue) => issue.message).join(" "));
  }
  const imports: string[] = [];
  const entries: string[] = [];
  // Bundle a private copy holding only the listed files, written from the
  // very bytes hashed here. The resolver can then reach nothing unlisted, and
  // a file edited after the check cannot be what runs.
  const directory = await mkdtemp(join(tmpdir(), "naraframe-recipes-"));
  try {
    for (const [index, [id, codeSha256]] of [...used].entries()) {
      const recipe = loaded.value.source.recipes?.find(
        (item) => item.id === id,
      );
      if (!recipe) {
        throw new Error(`Recipe ${id} is no longer declared; compile again.`);
      }
      const staged: Array<{ path: string; sha256: string; bytes: Buffer }> = [];
      for (const file of recipe.files) {
        const bytes = await readFile(resolve(projectRoot, file.path));
        staged.push({
          path: file.path,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          bytes,
        });
      }
      const stagedHash = recipeCodeHash(
        staged.map(({ path, sha256 }) => ({ path, sha256 })),
      );
      if (stagedHash !== codeSha256) {
        throw new Error(
          `Recipe ${id} changed on disk after it was compiled; compile and preview again.`,
        );
      }
      for (const file of staged) {
        const target = join(directory, file.path);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, file.bytes, { flag: "wx" });
      }
      const file = join(directory, recipe.path, recipe.entry);
      imports.push(`import * as recipe${index} from ${JSON.stringify(file)};`);
      entries.push(`${JSON.stringify(id)}: recipe${index}`);
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  const extension = extname(baseEntry);
  const registry = join(
    dirname(baseEntry),
    `recipe-registry${extension === ".tsx" ? ".ts" : extension}`,
  );
  const entry = join(directory, "entry.tsx");
  await writeFile(
    entry,
    [
      `import { registerRecipes } from ${JSON.stringify(registry)};`,
      ...imports,
      `registerRecipes({ ${entries.join(", ")} });`,
      `import ${JSON.stringify(baseEntry)};`,
      "",
    ].join("\n"),
  );
  return { entry, directory };
};

export interface RenderDraftRequest {
  draft: CompiledDraft;
  projectRoot: string;
  outputPath?: string;
  browserExecutable?: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface RenderedDraft {
  outputPath: string;
  durationInFrames: number;
  width: number;
  height: number;
  fps: number;
  browserExecutable: string;
  remotionVersion: string;
  visualPreflight: VisualPreflightReport;
}

export class VisualPreflightError extends Error {
  readonly issues: Issue[];

  constructor(issues: Issue[]) {
    super("Visual preflight rejected the draft before rendering.");
    this.name = "VisualPreflightError";
    this.issues = issues;
  }
}

/** Reads the font families out of a render failure raised in the browser. */
const fontFailureFrom = (error: unknown): string | null => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const marker = message.indexOf(FONT_RENDER_FAILURE);
  if (marker === -1) return null;
  const rest = message.slice(marker + FONT_RENDER_FAILURE.length).trim();
  // Remotion wraps the message; keep the first line, which carries the faces.
  return rest.split("\n")[0]?.trim() || "unknown family";
};

export const isVisualPreflightError = (
  error: unknown,
): error is VisualPreflightError =>
  error instanceof Error &&
  error.name === "VisualPreflightError" &&
  Array.isArray((error as VisualPreflightError).issues);

const preflightFromComposition = (composition: {
  props: Record<string, unknown>;
}): { draft: CompiledDraft; report: VisualPreflightReport } => {
  const candidate = { ...composition.props };
  const report = candidate[visualPreflightProperty] as
    | VisualPreflightReport
    | undefined;
  delete candidate[visualPreflightProperty];
  const draft = CompiledDraftSchema.parse(candidate);
  if (
    !report ||
    !Array.isArray(report.issues) ||
    !Array.isArray(report.frames)
  ) {
    throw new Error("Renderer did not return visual preflight metadata.");
  }
  return { draft, report };
};

export const renderDraft = async ({
  draft,
  projectRoot,
  outputPath = resolve(
    projectRoot,
    "preview",
    draft.scope.type === "scene"
      ? `dev-preview-${draft.scope.sceneId}.mp4`
      : "dev-preview.mp4",
  ),
  browserExecutable: requestedBrowser,
  onProgress,
  signal,
}: RenderDraftRequest): Promise<RenderedDraft> => {
  const interrupted = (): Error => {
    const error = new Error("Draft rendering was interrupted.");
    error.name = "AbortError";
    return error;
  };
  if (signal?.aborted) {
    throw interrupted();
  }
  const browserExecutable = await resolveBrowserExecutable(requestedBrowser);
  await mkdir(dirname(outputPath), { recursive: true });

  const baseEntry = await resolveEntryPoint();
  const packageRoot = fileURLToPath(new URL("../", import.meta.url));
  const recipeEntry = await prepareRecipeEntry(draft, projectRoot, baseEntry);
  const require = createRequire(import.meta.url);
  const runtimeModules = Object.fromEntries(
    ["react", "react-dom", "remotion"].map((name) => [
      name,
      dirname(require.resolve(`${name}/package.json`)),
    ]),
  );
  let serveUrl: string;
  try {
    serveUrl = await bundle({
      entryPoint: recipeEntry?.entry ?? baseEntry,
      // The wrapper registers recipes, then imports the entry that calls
      // registerRoot; Remotion only scans the wrapper's own text for it.
      ...(recipeEntry ? { ignoreRegisterRootWarning: true } : {}),
      publicDir: resolve(projectRoot),
      rootDir: packageRoot,
      webpackOverride: (configuration) => ({
        ...configuration,
        resolve: {
          ...configuration.resolve,
          extensionAlias: {
            ...configuration.resolve?.extensionAlias,
            ".js": [".tsx", ".ts", ".js"],
          },
          // Recipe code lives in the project, outside this package: give it
          // the renderer's single copies of react and remotion.
          ...(recipeEntry
            ? {
                modules: [join(packageRoot, "node_modules"), "node_modules"],
                alias: {
                  ...(configuration.resolve?.alias as Record<string, string>),
                  ...runtimeModules,
                },
              }
            : {}),
        },
      }),
    });
  } finally {
    if (recipeEntry) {
      await rm(recipeEntry.directory, { recursive: true, force: true });
    }
  }
  if (signal?.aborted) {
    throw interrupted();
  }
  // Each browser is opened here and closed here whether its step finishes,
  // fails or is interrupted, so no handle on it outlives the command.
  const selectBrowser = await openBrowser("chrome", {
    browserExecutable,
    logLevel: "warn",
  });
  let composition: Awaited<ReturnType<typeof selectComposition>>;
  try {
    composition = await selectComposition({
      serveUrl,
      id: "NaraFrameDraft",
      inputProps: draft,
      puppeteerInstance: selectBrowser,
      browserExecutable,
      logLevel: "warn",
    });
  } finally {
    await releaseBrowser(selectBrowser);
  }
  const preflight = preflightFromComposition(composition);
  const blockingIssues = preflight.report.issues.filter(
    (issue) => issue.severity === "error",
  );
  if (blockingIssues.length > 0) {
    throw new VisualPreflightError(blockingIssues);
  }

  if (signal?.aborted) {
    throw interrupted();
  }
  const browser = await openBrowser("chrome", {
    browserExecutable,
    forceDeviceScaleFactor: 1,
    logLevel: "warn",
  });
  try {
    const cancellation = makeCancelSignal();
    const onAbort = () => cancellation.cancel();
    signal?.addEventListener("abort", onAbort, { once: true });
    const hasNarration = Boolean(
      preflight.draft.narration || preflight.draft.soundtrack,
    );
    // Remotion requires a .mkv/.mov filename when mixing PCM. Our stitcher
    // encodes that PCM directly into MP4, then publishes it at the requested path.
    let audioRenderDirectory: string | null = null;
    try {
      if (hasNarration) {
        audioRenderDirectory = await mkdtemp(
          join(dirname(outputPath), ".audio-render-"),
        );
      }
      await renderMedia({
        serveUrl,
        composition,
        inputProps: preflight.draft,
        outputLocation: audioRenderDirectory
          ? join(audioRenderDirectory, "render.mkv")
          : outputPath,
        puppeteerInstance: browser,
        browserExecutable,
        codec: "h264",
        muted: !hasNarration,
        // Remotion's AAC/ADTS intermediate loses priming timestamps on copy.
        // Keep the mix lossless and encode once into the final MP4 instead.
        ...(hasNarration
          ? {
              audioCodec: "pcm-16" as const,
              ffmpegOverride: encodeAudioWhenMuxing,
            }
          : {}),
        overwrite: true,
        concurrency: RENDER_CONCURRENCY,
        logLevel: "warn",
        cancelSignal: cancellation.cancelSignal,
        onProgress: ({ progress }) => onProgress?.(progress),
      });
      if (audioRenderDirectory) {
        await rename(join(audioRenderDirectory, "render.mkv"), outputPath);
      }
    } catch (error) {
      if (signal?.aborted) {
        throw interrupted();
      }
      const families = fontFailureFrom(error);
      if (families) {
        // A face that never became usable in the frame context is a source
        // problem with a fix the author can act on, not an opaque renderer
        // fault, so it is reported as one instead of a redacted system error.
        throw new VisualPreflightError([
          {
            code: "FONT_NOT_LOADED",
            severity: "error",
            responsible: "user",
            artifact: "profile.lock.json",
            path: "/assets",
            message: `The render context could not use the bundled font(s): ${families}.`,
            suggestion:
              "Check that each declared font asset is a valid font file whose hash matches, then preview again.",
          },
        ]);
      }
      throw error;
    } finally {
      signal?.removeEventListener("abort", onAbort);
      if (audioRenderDirectory) {
        await rm(audioRenderDirectory, { recursive: true, force: true });
      }
    }

    return {
      outputPath,
      durationInFrames: composition.durationInFrames,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      browserExecutable,
      remotionVersion,
      visualPreflight: preflight.report,
    };
  } finally {
    await releaseBrowser(browser);
  }
};
