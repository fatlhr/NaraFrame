import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type CliProcessHost, runCli, runCliProcess } from "@naraframe/cli";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FrameIntegrityError,
  frameIntegrityIssue,
} from "../../src/frame-integrity.js";
import * as previewBuild from "../../src/preview-build.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

const sha256 = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

/**
 * A throwaway copy of the sample's source files. Any test that runs `preview`
 * must use one: previewing writes builds and a pointer into the project, and
 * the sample directory is tracked, so running it there leaves artifacts that
 * a later run can legitimately reuse instead of rendering — which silently
 * disarms a test that mocks the renderer.
 */
const copySourceOnly = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-contract-source-"));
  temporaryRoots.push(root);
  const project = join(root, "project");
  await mkdir(project, { recursive: true });
  await Promise.all([
    cp(join(sampleRoot, "assets"), join(project, "assets"), {
      recursive: true,
    }),
    ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
      cp(join(sampleRoot, file), join(project, file)),
    ),
  ]);
  return project;
};

const copyPublishedSample = async (sceneId?: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-status-contract-"));
  temporaryRoots.push(root);
  const project = join(root, "project");
  await mkdir(project, { recursive: true });
  await Promise.all([
    cp(join(sampleRoot, "assets"), join(project, "assets"), {
      recursive: true,
    }),
    ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
      cp(join(sampleRoot, file), join(project, file)),
    ),
  ]);

  const loaded = await loadPlanProject(project);
  if (!loaded.ok) {
    throw new Error(
      `Could not load fixture source: ${JSON.stringify(loaded.issues)}`,
    );
  }
  const compiled = compileDraft(
    loaded.value.source,
    sceneId ? { type: "scene", sceneId } : { type: "project" },
  );
  if (!compiled.ok) {
    throw new Error(
      `Could not compile fixture source: ${JSON.stringify(compiled.issues)}`,
    );
  }

  const draft = compiled.value;
  const buildId = `${draft.assemblyKey.slice(0, 12)}-f1a7e-0001`;
  const buildDirectory = join(project, "preview", "builds", buildId);
  await mkdir(buildDirectory, { recursive: true });
  const checkedFrames = previewBuild.selectCheckedFrames(draft, []);
  const contactSheet = previewBuild.contactSheetLayoutFor(checkedFrames.length);
  const metadata = {
    schemaVersion: 1,
    buildId,
    sourceRevision: draft.sourceRevision,
    assemblyKey: draft.assemblyKey,
    mode: "draft",
    scope: draft.scope,
    timelineScope: draft.timelineScope,
    label: draft.label,
    profile: { id: draft.profile.id, version: draft.profile.version },
    runtime: {
      node: process.version,
      os: { platform: "test", release: "test", architecture: "test" },
      remotion: "test",
      browser: { executable: "test", version: "test" },
      ffmpeg: { executable: "test", version: "test" },
    },
    render: {
      width: draft.width,
      height: draft.height,
      fps: draft.fps,
      durationInFrames: draft.totalFrames,
      codec: "h264",
      audio: "none",
      muted: true,
    },
    contactSheet,
    checkedFrames,
    startedAt: "2026-09-13T00:00:00.000Z",
    completedAt: "2026-09-13T00:00:01.000Z",
    status: "success",
    failure: null,
  };
  const frames = `${JSON.stringify(
    {
      schemaVersion: 1,
      buildId,
      sourceRevision: draft.sourceRevision,
      assemblyKey: draft.assemblyKey,
      scope: draft.scope,
      timelineScope: draft.timelineScope,
      contactSheet,
      frames: checkedFrames,
    },
    null,
    2,
  )}\n`;
  const report = `${JSON.stringify(metadata, null, 2)}\n`;
  const preview = "fixture-preview\n";
  const sheet = "fixture-contact-sheet\n";
  const artifacts = {
    "preview.mp4": {
      path: "preview.mp4",
      bytes: Buffer.byteLength(preview),
      sha256: sha256(preview),
      mediaType: "video/mp4",
    },
    "contact-sheet.png": {
      path: "contact-sheet.png",
      bytes: Buffer.byteLength(sheet),
      sha256: sha256(sheet),
      mediaType: "image/png",
    },
    "frames.json": {
      path: "frames.json",
      bytes: Buffer.byteLength(frames),
      sha256: sha256(frames),
      mediaType: "application/json",
    },
    "report.json": {
      path: "report.json",
      bytes: Buffer.byteLength(report),
      sha256: sha256(report),
      mediaType: "application/json",
    },
  };
  const manifest = `${JSON.stringify({ ...metadata, artifacts }, null, 2)}\n`;
  await Promise.all([
    writeFile(join(buildDirectory, "preview.mp4"), preview),
    writeFile(join(buildDirectory, "contact-sheet.png"), sheet),
    writeFile(join(buildDirectory, "frames.json"), frames),
    writeFile(join(buildDirectory, "report.json"), report),
    writeFile(join(buildDirectory, "manifest.json"), manifest),
  ]);
  await writeFile(
    join(project, "preview", "current.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      buildId,
      manifest: `builds/${buildId}/manifest.json`,
      manifestSha256: sha256(manifest),
      promotedAt: "2026-09-13T00:00:01.000Z",
    })}\n`,
  );
  return project;
};

const captureJsonResult = async (
  args: readonly string[],
  options?: { signal?: AbortSignal },
): Promise<{ exitCode: number; events: unknown[]; stderr: string[] }> => {
  const writes: string[] = [];
  const stderr: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(value);
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(((value: string) => {
    stderr.push(value);
    return true;
  }) as typeof process.stderr.write);
  vi.spyOn(console, "error").mockImplementation((...values: unknown[]) => {
    stderr.push(values.map(String).join(" "));
  });

  const exitCode = await runCli(args, options);
  return {
    exitCode,
    events: writes.map((value) => JSON.parse(value)),
    stderr,
  };
};

const captureInterruptedPublicResult = async (
  args: readonly string[],
): Promise<{ exitCode: number; events: unknown[] }> => {
  const emitter = new EventEmitter();
  const originalExit = ((code?: number | string | null) => {
    throw new Error(`Unexpected process exit ${code}.`);
  }) as CliProcessHost["exit"];
  const host = Object.assign(emitter, {
    exit: originalExit,
    exitCode: undefined as number | string | null | undefined,
  }) as CliProcessHost;
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(value);
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  const exitCode = await runCliProcess(args, {
    host,
    execute: async (commandArgs, options) => {
      const execution = runCli(commandArgs, options);
      emitter.emit("SIGINT");
      return execution;
    },
  });
  return { exitCode, events: writes.map((value) => JSON.parse(value)) };
};

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("public CLI command contract", () => {
  it("words a usage error in plain terms without internal milestone names", async () => {
    const usage = await captureJsonResult(["--help", "--json"]);
    expect(usage.exitCode).toBe(3);
    const issue = (
      usage.events[0] as { issues: Array<{ code: string; suggestion: string }> }
    ).issues[0];
    expect(issue.code).toBe("CLI_USAGE");
    expect(issue.suggestion).toMatch(/usage list/);
    expect(JSON.stringify(usage)).not.toMatch(/\bM0\b|advertised/);
    const plain = await captureJsonResult(["profile", "list", "x", "--json"]);
    expect(plain.exitCode).toBe(3);
  });

  it("prints nothing but the result to stderr with --json, and the issues without it", async () => {
    const json = await captureJsonResult(["profile", "list", "x", "--json"]);
    expect(json.exitCode).toBe(3);
    expect(json.stderr).toEqual([]);
    expect((json.events[0] as { issues: unknown[] }).issues).toHaveLength(1);
    const text = await captureJsonResult(["profile", "list", "x"]);
    expect(text.exitCode).toBe(3);
    expect(text.stderr.join("\n")).toContain("ERROR CLI_USAGE");
  });

  it("recognizes prepared audio staging and exports its passive package schema", async () => {
    const usage = await captureJsonResult(["audio", "stage", "--json"]);
    expect(usage.exitCode).toBe(3);
    expect(usage.events).toEqual([
      expect.objectContaining({ command: "audio", success: false }),
    ]);
    const schema = await captureJsonResult(["schema", "--json"]);
    expect(schema.exitCode).toBe(0);
    expect(JSON.stringify(schema.events)).toContain("PreparedTimingPackage");
  });
  it("reports missing browser and FFmpeg tools without attempting downloads", async () => {
    vi.stubEnv(
      "NARAFRAME_BROWSER_EXECUTABLE",
      "/definitely-missing/naraframe-browser",
    );
    vi.stubEnv(
      "NARAFRAME_FFMPEG_EXECUTABLE",
      "/definitely-missing/naraframe-ffmpeg",
    );
    vi.stubEnv(
      "NARAFRAME_FFPROBE_EXECUTABLE",
      "/definitely-missing/naraframe-ffprobe",
    );

    const result = await captureJsonResult(["doctor", "--json"]);

    expect(result.exitCode).toBe(2);
    expect(result.events).toEqual([
      expect.objectContaining({
        command: "doctor",
        status: "failed",
        success: false,
        readiness: "not-ready",
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "BROWSER_NOT_PROVISIONED" }),
          expect.objectContaining({ code: "FFMPEG_NOT_AVAILABLE" }),
        ]),
        data: expect.objectContaining({
          downloadsPerformed: false,
          renderPerformed: false,
        }),
      }),
    ]);
  });

  it("redacts unexpected renderer details from JSON and stderr failures", async () => {
    const secret = "nf-secret-token-value";
    vi.spyOn(previewBuild, "publishPreviewBuild").mockRejectedValue(
      new Error(`Renderer failed with ${secret} at /private/owner/path`),
    );

    const result = await captureJsonResult([
      "preview",
      await copySourceOnly(),
      "--draft",
      "--json",
    ]);
    const publicOutput = JSON.stringify({
      events: result.events,
      stderr: result.stderr,
    });

    expect(result.exitCode).toBe(2);
    expect(result.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "failed",
        success: false,
        issues: [
          expect.objectContaining({
            code: "SYSTEM_ERROR",
            details: { errorName: "Error" },
          }),
        ],
      }),
    ]);
    expect(publicOutput).not.toContain(secret);
    expect(publicOutput).not.toContain("/private/owner/path");
  });

  it("reports a frame integrity failure with its own code and frames", async () => {
    vi.spyOn(previewBuild, "publishPreviewBuild").mockRejectedValue(
      new FrameIntegrityError([
        frameIntegrityIssue("preview.mp4", [
          { frame: 14, dp: 30, dn: 31, dpn: 1 },
          { frame: 106, dp: 28, dn: 29, dpn: 2 },
        ]),
      ]),
    );

    const result = await captureJsonResult([
      "preview",
      await copySourceOnly(),
      "--draft",
      "--json",
    ]);

    expect(result.exitCode).toBe(2);
    expect(result.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "failed",
        success: false,
        readiness: "not-ready",
        issues: [
          expect.objectContaining({
            code: "RENDER_FRAME_INTEGRITY",
            responsible: "system",
            message: expect.stringContaining("frame 14, 106"),
          }),
        ],
      }),
    ]);
  });

  it("writes exactly one versioned result event for schema and plan validation", async () => {
    const schema = await captureJsonResult(["schema", "--json"]);
    expect(schema.exitCode).toBe(0);
    expect(schema.events).toHaveLength(1);
    expect(schema.events[0]).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "schema",
      success: true,
    });

    vi.restoreAllMocks();
    const outline = await captureJsonResult(["outline", sampleRoot, "--json"]);
    expect(outline.exitCode).toBe(0);
    expect(outline.events).toHaveLength(1);
    expect(outline.events[0]).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "outline",
      success: true,
      data: { outline: { project: { id: expect.any(String) } } },
    });

    vi.restoreAllMocks();
    const validation = await captureJsonResult([
      "validate",
      sampleRoot,
      "--stage",
      "plan",
      "--json",
    ]);
    expect(validation.exitCode).toBe(0);
    expect(validation.events).toHaveLength(1);
    expect(validation.events[0]).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "validate",
      success: true,
      readiness: "draft-only",
      mode: "draft",
    });
  });

  it("uses stable result events for usage, source, and cancellation failures", async () => {
    const usage = await captureJsonResult([
      "preview",
      sampleRoot,
      "unexpected-second-project",
      "--draft",
      "--json",
    ]);
    expect(usage.exitCode).toBe(3);
    expect(usage.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "failed",
        success: false,
        issues: [expect.objectContaining({ code: "CLI_USAGE" })],
      }),
    ]);

    vi.restoreAllMocks();
    const source = await captureJsonResult([
      "preview",
      sampleRoot,
      "--draft",
      "--scene",
      "not-a-scene",
      "--json",
    ]);
    expect(source.exitCode).toBe(1);
    expect(source.events).toHaveLength(1);
    expect(source.events[0]).toMatchObject({
      command: "preview",
      status: "failed",
      success: false,
      readiness: "invalid",
    });

    const controller = new AbortController();
    controller.abort();
    vi.restoreAllMocks();
    const interrupted = await captureJsonResult(
      ["preview", await copySourceOnly(), "--draft", "--json"],
      { signal: controller.signal },
    );
    expect(interrupted.exitCode).toBe(130);
    expect(interrupted.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "interrupted",
        success: false,
        issues: [expect.objectContaining({ code: "COMMAND_INTERRUPTED" })],
      }),
    ]);
  });

  it.each([
    ["doctor", "--json"],
    ["status", sampleRoot, "--json"],
    ["outline", sampleRoot, "--json"],
    ["validate", sampleRoot, "--stage", "plan", "--json"],
  ])(
    "emits an interrupted public JSON result when SIGINT arrives during %s",
    async (...args: string[]) => {
      const interrupted = await captureInterruptedPublicResult(args);

      expect(interrupted.exitCode).toBe(130);
      expect(interrupted.events).toEqual([
        expect.objectContaining({
          status: "interrupted",
          success: false,
          issues: [expect.objectContaining({ code: "COMMAND_INTERRUPTED" })],
        }),
      ]);
    },
  );

  it("keeps the public JSON preview event successful after pointer rename dispatch", async () => {
    const emitter = new EventEmitter();
    const delegatedExitCodes: Array<number | string | null | undefined> = [];
    const originalExit = ((code?: number | string | null) => {
      delegatedExitCodes.push(code);
      throw new Error("The original exit must not run after preview commit.");
    }) as CliProcessHost["exit"];
    const host = Object.assign(emitter, {
      exit: originalExit,
      exitCode: undefined as number | string | null | undefined,
    }) as CliProcessHost;
    const writes: string[] = [];
    let releaseRename: (() => void) | undefined;
    const renameReleased = new Promise<void>((resolvePromise) => {
      releaseRename = resolvePromise;
    });
    let signalRenameStarted: (() => void) | undefined;
    const renameStarted = new Promise<void>((resolvePromise) => {
      signalRenameStarted = resolvePromise;
    });
    vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
      writes.push(value);
      return true;
    }) as typeof process.stdout.write);
    vi.spyOn(process.stderr, "write").mockImplementation(
      (() => true) as typeof process.stderr.write,
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(previewBuild, "publishPreviewBuild").mockImplementation(
      async (options) => {
        const { onPointerRenameDispatched } = options;
        if (!onPointerRenameDispatched) {
          throw new Error("Preview rename callback was not forwarded.");
        }
        onPointerRenameDispatched();
        signalRenameStarted?.();
        emitter.emit("SIGTERM");
        await renameReleased;
        return {
          buildId: "committed-preview",
          buildDirectory: "/fixture/preview/builds/committed-preview",
          currentPointer: "/fixture/preview/current.json",
          manifestSha256: "a".repeat(64),
          issues: [],
          rendered: {
            outputPath: "/fixture/preview/builds/committed-preview/preview.mp4",
            durationInFrames: options.draft.totalFrames,
            width: options.draft.width,
            height: options.draft.height,
            fps: options.draft.fps,
            browserExecutable: "/fixture/chrome",
            remotionVersion: "4.0.521",
            visualPreflight: { checkedFrames: [], issues: [] },
          },
        };
      },
    );

    const execution = runCliProcess(
      ["preview", await copySourceOnly(), "--draft", "--json"],
      { host },
    );
    await renameStarted;
    releaseRename?.();
    const exitCode = await execution;

    expect(exitCode).toBe(0);
    expect(delegatedExitCodes).toEqual([]);
    expect(host.exitCode).toBeUndefined();
    expect(writes.map((value) => JSON.parse(value))).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "completed",
        success: true,
        buildId: "committed-preview",
      }),
    ]);
  });

  it("reports a pointer rename failure after the dispatch boundary as a system failure", async () => {
    const emitter = new EventEmitter();
    const originalExit = ((code?: number | string | null) => {
      throw new Error(`Unexpected process exit ${code}.`);
    }) as CliProcessHost["exit"];
    const host = Object.assign(emitter, {
      exit: originalExit,
      exitCode: undefined as number | string | null | undefined,
    }) as CliProcessHost;
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
      writes.push(value);
      return true;
    }) as typeof process.stdout.write);
    vi.spyOn(process.stderr, "write").mockImplementation(
      (() => true) as typeof process.stderr.write,
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(previewBuild, "publishPreviewBuild").mockImplementation(
      async ({ onPointerRenameDispatched }) => {
        if (!onPointerRenameDispatched) {
          throw new Error("Preview rename callback was not forwarded.");
        }
        onPointerRenameDispatched();
        emitter.emit("SIGINT");
        throw new Error("Synthetic pointer rename failure.");
      },
    );

    await expect(
      runCliProcess(["preview", await copySourceOnly(), "--draft", "--json"], {
        host,
      }),
    ).resolves.toBe(2);
    expect(writes.map((value) => JSON.parse(value))).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "failed",
        success: false,
        issues: [expect.objectContaining({ code: "SYSTEM_ERROR" })],
      }),
    ]);
  });

  it("creates a project through JSON mode and reports an absent valid preview", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-command-contract-"));
    temporaryRoots.push(root);
    const destination = join(root, "created");
    vi.restoreAllMocks();
    const created = await captureJsonResult([
      "create",
      destination,
      "--profile",
      "current-issues",
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    expect(created.events).toEqual([
      expect.objectContaining({
        command: "create",
        success: true,
        data: expect.objectContaining({ projectRoot: destination }),
      }),
    ]);

    const sourceOnly = join(root, "source-only");
    await Promise.all([
      cp(join(sampleRoot, "assets"), join(sourceOnly, "assets"), {
        recursive: true,
      }),
      ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
        cp(join(sampleRoot, file), join(sourceOnly, file)),
      ),
    ]);
    vi.restoreAllMocks();
    const status = await captureJsonResult(["status", sourceOnly, "--json"]);
    expect(status.exitCode).toBe(0);
    expect(status.events).toEqual([
      expect.objectContaining({
        command: "status",
        success: true,
        buildId: null,
        data: expect.objectContaining({ previewState: "absent" }),
      }),
    ]);

    await mkdir(join(sourceOnly, "preview"));
    await writeFile(join(sourceOnly, "preview", "current.json"), "not-json\n");
    vi.restoreAllMocks();
    const corruptStatus = await captureJsonResult([
      "status",
      sourceOnly,
      "--json",
    ]);
    expect(corruptStatus.exitCode).toBe(2);
    expect(corruptStatus.events).toEqual([
      expect.objectContaining({
        command: "status",
        success: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "PREVIEW_METADATA_INVALID" }),
        ]),
      }),
    ]);
  });

  it("rejects corrupt preview publication data before returning authoritative paths", async () => {
    const publishedProject = await copyPublishedSample("context");
    const publishedStatus = await captureJsonResult([
      "status",
      publishedProject,
      "--json",
    ]);
    expect(publishedStatus.exitCode).toBe(0);
    expect(publishedStatus.events).toEqual([
      expect.objectContaining({
        success: true,
        scope: {
          type: "scene",
          sceneId: "context",
          sourceStartFrame: 120,
          sourceEndFrame: 300,
        },
        artifacts: expect.objectContaining({ previewMp4: expect.any(String) }),
      }),
    ]);

    vi.restoreAllMocks();
    const pointerHashProject = await copyPublishedSample();
    const pointerPath = join(pointerHashProject, "preview", "current.json");
    const pointer = JSON.parse(await readFile(pointerPath, "utf8")) as Record<
      string,
      unknown
    >;
    await writeFile(
      pointerPath,
      `${JSON.stringify({ ...pointer, manifestSha256: "0".repeat(64) })}\n`,
    );
    const pointerHash = await captureJsonResult([
      "status",
      pointerHashProject,
      "--json",
    ]);

    const invalidScopeProject = await copyPublishedSample();
    const invalidScopePointerPath = join(
      invalidScopeProject,
      "preview",
      "current.json",
    );
    const invalidScopePointer = JSON.parse(
      await readFile(invalidScopePointerPath, "utf8"),
    ) as { manifest: string } & Record<string, unknown>;
    const invalidScopeManifestPath = join(
      invalidScopeProject,
      "preview",
      invalidScopePointer.manifest,
    );
    const invalidScopeManifest = JSON.parse(
      await readFile(invalidScopeManifestPath, "utf8"),
    ) as Record<string, unknown>;
    const reportPath = join(
      invalidScopeProject,
      "preview",
      "builds",
      String(invalidScopeManifest.buildId),
      "report.json",
    );
    const report = JSON.parse(await readFile(reportPath, "utf8")) as Record<
      string,
      unknown
    >;
    const invalidScope = { type: "not-a-preview-scope" };
    const updatedReport = `${JSON.stringify({ ...report, scope: invalidScope }, null, 2)}\n`;
    await writeFile(reportPath, updatedReport);
    const artifacts = invalidScopeManifest.artifacts as Record<
      string,
      Record<string, unknown>
    >;
    artifacts["report.json"] = {
      ...artifacts["report.json"],
      bytes: Buffer.byteLength(updatedReport),
      sha256: sha256(updatedReport),
    };
    const updatedManifest = `${JSON.stringify(
      { ...invalidScopeManifest, scope: invalidScope, artifacts },
      null,
      2,
    )}\n`;
    await writeFile(invalidScopeManifestPath, updatedManifest);
    await writeFile(
      invalidScopePointerPath,
      `${JSON.stringify({
        ...invalidScopePointer,
        manifestSha256: sha256(updatedManifest),
      })}\n`,
    );
    vi.restoreAllMocks();
    const invalidScopeResult = await captureJsonResult([
      "status",
      invalidScopeProject,
      "--json",
    ]);

    const symlinkProject = await copyPublishedSample();
    const symlinkPointer = join(symlinkProject, "preview", "current.json");
    const external = await mkdtemp(
      join(tmpdir(), "naraframe-status-external-"),
    );
    temporaryRoots.push(external);
    await writeFile(join(external, "current.json"), "{}\n");
    await rm(symlinkPointer);
    await symlink(join(external, "current.json"), symlinkPointer);
    vi.restoreAllMocks();
    const symlinkResult = await captureJsonResult([
      "status",
      symlinkProject,
      "--json",
    ]);

    const artifactProject = await copyPublishedSample();
    const artifactPointer = JSON.parse(
      await readFile(join(artifactProject, "preview", "current.json"), "utf8"),
    ) as { buildId: string };
    await writeFile(
      join(
        artifactProject,
        "preview",
        "builds",
        artifactPointer.buildId,
        "frames.json",
      ),
      "tampered\n",
    );
    vi.restoreAllMocks();
    const artifactResult = await captureJsonResult([
      "status",
      artifactProject,
      "--json",
    ]);

    for (const result of [
      pointerHash,
      invalidScopeResult,
      symlinkResult,
      artifactResult,
    ]) {
      expect(result.exitCode).toBe(2);
      expect(result.events).toEqual([
        expect.objectContaining({
          command: "status",
          success: false,
          artifacts: {},
          issues: expect.arrayContaining([
            expect.objectContaining({ code: "PREVIEW_METADATA_INVALID" }),
          ]),
        }),
      ]);
    }
  });

  it("retains the published source revision when valid source edits make a preview stale", async () => {
    const project = await copyPublishedSample();
    const initial = await captureJsonResult(["status", project, "--json"]);
    const initialEvent = initial.events[0] as {
      sourceRevision: string;
      data: { previewSourceRevision?: string };
    };
    expect(initial.exitCode).toBe(0);
    expect(initialEvent.data.previewSourceRevision).toBe(
      initialEvent.sourceRevision,
    );

    const scenesPath = join(project, "scenes.json");
    const scenes = JSON.parse(await readFile(scenesPath, "utf8")) as {
      scenes: Array<{ visual: { text?: string } }>;
    };
    const firstScene = scenes.scenes.at(0);
    if (!firstScene) throw new Error("Expected the sample to contain a scene.");
    firstScene.visual.text = "Satu letusan.\nSuaranya berubah.";
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);

    vi.restoreAllMocks();
    const stale = await captureJsonResult(["status", project, "--json"]);
    expect(stale.exitCode).toBe(0);
    expect(stale.events).toEqual([
      expect.objectContaining({
        sourceRevision: expect.any(String),
        data: expect.objectContaining({
          previewState: "stale",
          previewSourceRevision: initialEvent.sourceRevision,
        }),
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "PREVIEW_STALE" }),
        ]),
      }),
    ]);
    expect(
      (stale.events[0] as { sourceRevision: string }).sourceRevision,
    ).not.toBe(initialEvent.sourceRevision);
  });
});
