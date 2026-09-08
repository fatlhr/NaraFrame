import { access, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CompiledDraft } from "@naraframe/core";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const resolveBrowserExecutable = async (
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

export interface RenderDraftRequest {
  draft: CompiledDraft;
  projectRoot: string;
  outputPath?: string;
  browserExecutable?: string;
  onProgress?: (progress: number) => void;
}

export interface RenderedDraft {
  outputPath: string;
  durationInFrames: number;
  width: number;
  height: number;
  fps: number;
}

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
}: RenderDraftRequest): Promise<RenderedDraft> => {
  const browserExecutable = await resolveBrowserExecutable(requestedBrowser);
  await mkdir(dirname(outputPath), { recursive: true });

  const entryPoint = await resolveEntryPoint();
  const packageRoot = fileURLToPath(new URL("../", import.meta.url));
  const serveUrl = await bundle({
    entryPoint,
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
      },
    }),
  });
  const composition = await selectComposition({
    serveUrl,
    id: "NaraFrameDraft",
    inputProps: draft,
    browserExecutable,
    logLevel: "warn",
  });

  await renderMedia({
    serveUrl,
    composition,
    inputProps: draft,
    outputLocation: outputPath,
    browserExecutable,
    codec: "h264",
    muted: true,
    overwrite: true,
    logLevel: "warn",
    onProgress: ({ progress }) => onProgress?.(progress),
  });

  return {
    outputPath,
    durationInFrames: composition.durationInFrames,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
  };
};
