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
import { afterEach, describe, expect, it, vi } from "vitest";
import * as previewBuild from "../../src/preview-build.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

const sha256 = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

const copyPublishedSample = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-status-contract-"));
  temporaryRoots.push(root);
  const project = join(root, "project");
  await cp(sampleRoot, project, { recursive: true });
  return project;
};

const captureJsonResult = async (
  args: readonly string[],
  options?: { signal?: AbortSignal },
): Promise<{ exitCode: number; events: unknown[] }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(value);
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  const exitCode = await runCli(args, options);
  return {
    exitCode,
    events: writes.map((value) => JSON.parse(value)),
  };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("public CLI command contract", () => {
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
    const usage = await captureJsonResult(["preview", sampleRoot, "--json"]);
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
      ["preview", sampleRoot, "--draft", "--json"],
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
          rendered: {
            outputPath: "/fixture/preview/builds/committed-preview/preview.mp4",
            durationInFrames: options.draft.totalFrames,
            width: options.draft.width,
            height: options.draft.height,
            fps: options.draft.fps,
            browserExecutable: "/fixture/chrome",
            remotionVersion: "4.0.521",
          },
        };
      },
    );

    const execution = runCliProcess(
      ["preview", sampleRoot, "--draft", "--json"],
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
      runCliProcess(["preview", sampleRoot, "--draft", "--json"], { host }),
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
        issues: [expect.objectContaining({ code: "PREVIEW_METADATA_INVALID" })],
      }),
    ]);
  });

  it("rejects corrupt preview publication data before returning authoritative paths", async () => {
    const scopedProject = await copyPublishedSample();
    const scopedPointerPath = join(scopedProject, "preview", "current.json");
    const scopedBuildId = "a22c2924f0ff-db361629-f95";
    const scopedManifest = await readFile(
      join(scopedProject, "preview", "builds", scopedBuildId, "manifest.json"),
    );
    await writeFile(
      scopedPointerPath,
      `${JSON.stringify({
        schemaVersion: 1,
        buildId: scopedBuildId,
        manifest: `builds/${scopedBuildId}/manifest.json`,
        manifestSha256: sha256(scopedManifest),
        promotedAt: "2026-09-13T00:00:00.000Z",
      })}\n`,
    );
    const scopedStatus = await captureJsonResult([
      "status",
      scopedProject,
      "--json",
    ]);
    expect(scopedStatus.exitCode).toBe(0);
    expect(scopedStatus.events).toEqual([
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
          issues: [
            expect.objectContaining({ code: "PREVIEW_METADATA_INVALID" }),
          ],
        }),
      ]);
    }
  });
});
