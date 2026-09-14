import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const sampleRoot = join(repositoryRoot, "samples", "krakatau-draft");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const ffmpeg =
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";
const ffprobe =
  process.env.NARAFRAME_FFPROBE_EXECUTABLE ?? "/opt/homebrew/bin/ffprobe";
const sandboxProfile =
  '(version 1) (allow default) (deny network-outbound (require-not (remote ip "localhost:*")))';
const temporaryRoots: string[] = [];
const activeProcesses = new Set<ChildProcess>();
const processTimeoutMs = 120_000;

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface CommandEvent {
  success: boolean;
  readiness: string;
  sourceRevision: string | null;
  buildId: string | null;
  artifacts: Record<string, string>;
  issues: Array<{ code: string; path: string }>;
  data: Record<string, unknown>;
}

interface CurrentPointer {
  buildId: string;
  manifest: string;
  manifestSha256: string;
}

interface ArtifactRecord {
  path: string;
  bytes: number;
  sha256: string;
}

interface PreviewManifest {
  sourceRevision: string;
  render: {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    audio: string;
    muted: boolean;
  };
  artifacts: Record<string, ArtifactRecord>;
}

const runProcess = async (
  executable: string,
  args: readonly string[],
  cwd = repositoryRoot,
): Promise<ProcessResult> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, {
      cwd,
      detached: true,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeProcesses.add(child);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      action();
    };
    const timer = setTimeout(() => {
      terminateProcess(child, "SIGTERM");
      finish(() =>
        reject(
          new Error(
            `${executable} exceeded the ${processTimeoutMs}ms subprocess limit.`,
          ),
        ),
      );
    }, processTimeoutMs);
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", (error) => finish(() => reject(error)));
    child.once("close", (code) => {
      terminateProcess(child, "SIGTERM");
      activeProcesses.delete(child);
      finish(() =>
        resolvePromise({
          code: code ?? 2,
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
        }),
      );
    });
  });

const terminateProcess = (
  child: ChildProcess,
  signal: NodeJS.Signals,
): void => {
  if (child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to the direct child when its process group no longer exists.
    }
  }
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill(signal);
};

const stopActiveProcesses = async (): Promise<void> => {
  await Promise.all(
    [...activeProcesses].map(
      (child) =>
        new Promise<void>((resolvePromise) => {
          let fallbackTimer: NodeJS.Timeout | undefined;
          const finish = () => {
            clearTimeout(forceTimer);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            resolvePromise();
          };
          const forceTimer = setTimeout(() => {
            terminateProcess(child, "SIGKILL");
            fallbackTimer = setTimeout(finish, 1_000);
          }, 5_000);
          child.once("close", finish);
          terminateProcess(child, "SIGTERM");
        }),
    ),
  );
  activeProcesses.clear();
};

const runCli = async (
  project: string,
  args: readonly string[],
  sandboxed = false,
): Promise<{ result: ProcessResult; event: CommandEvent }> => {
  const commandArgs = [cliEntry, ...args, project, "--json"];
  const result = sandboxed
    ? await runProcess("/usr/bin/sandbox-exec", [
        "-p",
        sandboxProfile,
        process.execPath,
        ...commandArgs,
      ])
    : await runProcess(process.execPath, commandArgs);
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  expect(lines, result.stderr).toHaveLength(1);
  return {
    result,
    event: JSON.parse(lines[0] ?? "{}") as CommandEvent,
  };
};

const sha256File = async (path: string): Promise<string> =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

const readCurrentBuild = async (
  project: string,
): Promise<{
  pointer: CurrentPointer;
  buildDirectory: string;
  manifest: PreviewManifest;
}> => {
  const pointerPath = join(project, "preview", "current.json");
  const pointer = JSON.parse(
    await readFile(pointerPath, "utf8"),
  ) as CurrentPointer;
  const manifestPath = join(project, "preview", pointer.manifest);
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as PreviewManifest;
  return {
    pointer,
    buildDirectory: join(project, "preview", "builds", pointer.buildId),
    manifest,
  };
};

const assertPublishedBuild = async (
  project: string,
): Promise<Awaited<ReturnType<typeof readCurrentBuild>>> => {
  const build = await readCurrentBuild(project);
  expect(
    await sha256File(join(project, "preview", build.pointer.manifest)),
  ).toBe(build.pointer.manifestSha256);
  expect(build.manifest.render).toEqual({
    width: 540,
    height: 960,
    fps: 30,
    durationInFrames: 450,
    codec: "h264",
    audio: "none",
    muted: true,
  });
  expect(Object.keys(build.manifest.artifacts).sort()).toEqual([
    "contact-sheet.png",
    "frames.json",
    "preview.mp4",
    "report.json",
  ]);
  for (const record of Object.values(build.manifest.artifacts)) {
    const artifactPath = join(build.buildDirectory, record.path);
    await expect(access(artifactPath)).resolves.toBeUndefined();
    expect((await readFile(artifactPath)).byteLength).toBe(record.bytes);
    expect(await sha256File(artifactPath)).toBe(record.sha256);
  }
  return build;
};

const selectedFrames = async (buildDirectory: string): Promise<number[]> => {
  const framesDocument = JSON.parse(
    await readFile(join(buildDirectory, "frames.json"), "utf8"),
  ) as { frames: Array<{ frame: number }> };
  const frames = framesDocument.frames.map(({ frame }) => frame);
  return [
    ...new Set([
      frames[0],
      frames[Math.floor(frames.length / 2)],
      frames.at(-1),
    ]),
  ].filter((frame): frame is number => frame !== undefined);
};

const losslessFrameHashes = async (
  buildDirectory: string,
  frames: readonly number[],
): Promise<string[]> => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "naraframe-frames-"));
  temporaryRoots.push(outputDirectory);
  const hashes: string[] = [];
  for (const frame of frames) {
    const output = join(outputDirectory, `frame-${frame}.png`);
    const extracted = await runProcess(ffmpeg, [
      "-v",
      "error",
      "-i",
      join(buildDirectory, "preview.mp4"),
      "-vf",
      `select=eq(n\\,${frame})`,
      "-frames:v",
      "1",
      output,
    ]);
    expect(extracted.code, extracted.stderr).toBe(0);
    hashes.push(await sha256File(output));
  }
  return hashes;
};

afterEach(async () => {
  await stopActiveProcesses();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("M0 owner flow", () => {
  it("validates, renders offline, revises, rerenders, and recovers from invalid motion", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-owner-flow-"));
    temporaryRoots.push(root);
    const project = join(root, "krakatau-draft");
    await mkdir(project, { recursive: true });
    await Promise.all([
      cp(join(sampleRoot, "assets"), join(project, "assets"), {
        recursive: true,
      }),
      ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
        cp(join(sampleRoot, file), join(project, file)),
      ),
    ]);

    const scenesPath = join(project, "scenes.json");
    const scenes = JSON.parse(await readFile(scenesPath, "utf8")) as {
      scenes: Array<{
        durationMs: number;
        visual: { text?: string };
        beats: Array<{ action: string }>;
      }>;
    };
    [3000, 6000, 3000, 3000].forEach((durationMs, index) => {
      const scene = scenes.scenes[index];
      if (scene) scene.durationMs = durationMs;
    });
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);

    const validation = await runCli(project, ["validate", "--stage", "plan"]);
    expect(validation.result.code, validation.result.stderr).toBe(0);
    expect(validation.event).toMatchObject({
      success: true,
      readiness: "draft-only",
      data: { totalFrames: 450 },
    });

    const networkProbe = await runProcess("/usr/bin/sandbox-exec", [
      "-p",
      sandboxProfile,
      process.execPath,
      "--input-type=module",
      "-e",
      'import net from "node:net"; const probe=(host)=>new Promise((resolve)=>{const socket=net.connect(80,host);const timer=setTimeout(()=>{socket.destroy();resolve("TIMEOUT")},2000);socket.on("connect",()=>{clearTimeout(timer);socket.destroy();resolve("CONNECTED")});socket.on("error",(error)=>{clearTimeout(timer);resolve(error.code ?? "UNKNOWN")})});const server=net.createServer((socket)=>socket.end("ok"));server.listen(0,"127.0.0.1",async()=>{const address=server.address();const local=await new Promise((resolve)=>{const socket=net.connect(address.port,"127.0.0.1");socket.on("data",()=>{socket.destroy();resolve("allowed")});socket.on("error",(error)=>resolve(error.code ?? "UNKNOWN"))});server.close();const external=await probe("93.184.216.34");console.log(JSON.stringify({local,external}))});',
    ]);
    expect(networkProbe.code, networkProbe.stderr).toBe(0);
    const networkEvidence = JSON.parse(networkProbe.stdout) as {
      local: string;
      external: string;
    };
    expect(networkEvidence.local).toBe("allowed");
    expect(["EPERM", "EACCES"]).toContain(networkEvidence.external);

    const firstPreview = await runCli(project, ["preview", "--draft"], true);
    expect(firstPreview.result.code, firstPreview.result.stderr).toBe(0);
    expect(firstPreview.event).toMatchObject({
      success: true,
      readiness: "draft-only",
      buildId: expect.any(String),
    });
    const firstBuild = await assertPublishedBuild(project);

    const probe = await runProcess(ffprobe, [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      join(firstBuild.buildDirectory, "preview.mp4"),
    ]);
    expect(probe.code, probe.stderr).toBe(0);
    const media = JSON.parse(probe.stdout) as {
      streams: Array<{ codec_name?: string; width?: number; height?: number }>;
      format: { duration?: string };
    };
    expect(media.streams).toEqual([
      expect.objectContaining({ codec_name: "h264", width: 540, height: 960 }),
    ]);
    expect(Number(media.format.duration)).toBeCloseTo(15, 2);
    const decoded = await runProcess(ffmpeg, [
      "-v",
      "error",
      "-i",
      join(firstBuild.buildDirectory, "preview.mp4"),
      "-f",
      "null",
      "-",
    ]);
    expect(decoded.code, decoded.stderr).toBe(0);

    const frames = await selectedFrames(firstBuild.buildDirectory);
    expect(frames.length).toBeGreaterThanOrEqual(3);
    const firstHashes = await losslessFrameHashes(
      firstBuild.buildDirectory,
      frames,
    );

    const repeatedPreview = await runCli(project, ["preview", "--draft"], true);
    expect(repeatedPreview.result.code, repeatedPreview.result.stderr).toBe(0);
    const repeatedBuild = await assertPublishedBuild(project);
    expect(repeatedBuild.pointer.buildId).not.toBe(firstBuild.pointer.buildId);
    expect(repeatedBuild.manifest.sourceRevision).toBe(
      firstBuild.manifest.sourceRevision,
    );
    expect(
      await losslessFrameHashes(repeatedBuild.buildDirectory, frames),
    ).toEqual(firstHashes);

    const closingScene = scenes.scenes.at(-1);
    if (!closingScene) throw new Error("Expected a closing scene.");
    closingScene.visual.text =
      "Dampaknya melampaui Selat Sunda.\nJejaknya terbaca di laut, atmosfer, dan iklim dunia.";
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);
    const stale = await runCli(project, ["status"]);
    expect(stale.result.code, stale.result.stderr).toBe(0);
    expect(stale.event.data).toMatchObject({ previewState: "stale" });
    expect(stale.event.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PREVIEW_STALE" }),
      ]),
    );

    const revisedPreview = await runCli(project, ["preview", "--draft"]);
    expect(revisedPreview.result.code, revisedPreview.result.stderr).toBe(0);
    const revisedBuild = await assertPublishedBuild(project);
    expect(revisedBuild.pointer.buildId).not.toBe(
      repeatedBuild.pointer.buildId,
    );
    expect(revisedBuild.manifest.sourceRevision).not.toBe(
      repeatedBuild.manifest.sourceRevision,
    );
    await expect(
      access(join(project, "preview", "builds", firstBuild.pointer.buildId)),
    ).resolves.toBeUndefined();

    const firstBeat = scenes.scenes[0]?.beats[0];
    if (!firstBeat) throw new Error("Expected the hook reveal beat.");
    firstBeat.action = "bounce";
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);
    const invalid = await runCli(project, ["validate", "--stage", "plan"]);
    expect(invalid.result.code, invalid.result.stderr).toBe(1);
    expect(invalid.event).toMatchObject({
      success: false,
      readiness: "invalid",
      issues: [
        expect.objectContaining({
          code: "SCHEMA_INVALID",
          path: "/scenes/0/beats/0/action",
        }),
      ],
    });

    firstBeat.action = "reveal";
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);
    const recovered = await runCli(project, ["validate", "--stage", "plan"]);
    expect(recovered.result.code, recovered.result.stderr).toBe(0);
    expect(recovered.event.success).toBe(true);

    const evidence = {
      recordedAt: new Date().toISOString(),
      network: {
        loopback: networkEvidence.local,
        externalEgress: networkEvidence.external,
      },
      media: {
        codec: media.streams[0]?.codec_name,
        width: media.streams[0]?.width,
        height: media.streams[0]?.height,
        fps: 30,
        durationSeconds: Number(media.format.duration),
        audio: "none",
        fullDecode: "passed",
      },
      builds: {
        first: firstBuild.pointer.buildId,
        repeated: repeatedBuild.pointer.buildId,
        revised: revisedBuild.pointer.buildId,
      },
      sourceRevisions: {
        first: firstBuild.manifest.sourceRevision,
        repeated: repeatedBuild.manifest.sourceRevision,
        revised: revisedBuild.manifest.sourceRevision,
      },
      selectedFrames: frames,
      selectedFrameHashes: firstHashes,
      firstManifestSha256: firstBuild.pointer.manifestSha256,
      firstArtifactHashes: Object.fromEntries(
        Object.entries(firstBuild.manifest.artifacts).map(([name, record]) => [
          name,
          record.sha256,
        ]),
      ),
      invalidActionRecovery: "passed",
      sampledReviewLimit:
        "Frame hashes prove selected-frame repeatability on this pinned machine; they do not prove every frame is aesthetically safe.",
    };
    console.info("M0.8 evidence", JSON.stringify(evidence));

    const evidenceParent = process.env.NARAFRAME_EVIDENCE_PARENT;
    if (evidenceParent) {
      await mkdir(resolve(evidenceParent), { recursive: true });
      const evidenceRoot = await mkdtemp(
        join(resolve(evidenceParent), "m0-8-exit-"),
      );
      await Promise.all([
        cp(firstBuild.buildDirectory, join(evidenceRoot, "first"), {
          recursive: true,
        }),
        cp(repeatedBuild.buildDirectory, join(evidenceRoot, "repeated"), {
          recursive: true,
        }),
        cp(revisedBuild.buildDirectory, join(evidenceRoot, "revised"), {
          recursive: true,
        }),
      ]);
      await writeFile(
        join(evidenceRoot, "evidence.json"),
        `${JSON.stringify(evidence, null, 2)}\n`,
      );
    }
  });
});
