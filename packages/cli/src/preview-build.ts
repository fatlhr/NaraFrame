import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { CompiledDraft, Issue } from "@naraframe/core";
import { type RenderedDraft, renderDraft } from "@naraframe/renderer-remotion";

const artifactNames = [
  "preview.mp4",
  "contact-sheet.png",
  "frames.json",
  "report.json",
] as const;

type ArtifactName = (typeof artifactNames)[number];

export interface CheckedFrame {
  frame: number;
  sourceFrame: number;
  sceneId: string;
  reasons: string[];
}

interface ArtifactRecord {
  path: ArtifactName;
  bytes: number;
  sha256: string;
  mediaType: string;
}

interface RuntimeMetadata {
  node: string;
  os: {
    platform: string;
    release: string;
    architecture: string;
  };
  remotion: string;
  browser: {
    executable: string;
    version: string;
  };
  ffmpeg: {
    executable: string;
    version: string;
  };
}

interface PreviewMetadata {
  schemaVersion: 1;
  buildId: string;
  sourceRevision: string;
  assemblyKey: string;
  mode: "draft";
  scope: CompiledDraft["scope"];
  timelineScope: CompiledDraft["timelineScope"];
  label: CompiledDraft["label"];
  profile: { id: string; version: string };
  runtime: RuntimeMetadata;
  render: {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    codec: "h264";
    audio: "none";
    muted: true;
  };
  checkedFrames: CheckedFrame[];
  startedAt: string;
  completedAt: string;
  status: "success";
  failure: null;
}

interface PreviewManifest extends PreviewMetadata {
  artifacts: Record<ArtifactName, ArtifactRecord>;
}

export interface PublishedPreviewBuild {
  buildId: string;
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
  rendered: RenderedDraft;
}

export interface PreviewBuildOptions {
  projectRoot: string;
  draft: CompiledDraft;
  issues: readonly Issue[];
  onProgress?: (progress: number) => void;
  failureInjection?: "before-pointer";
}

export interface IntegrityOptions {
  buildDirectory: string;
  expectedBuildId: string;
  expectedDraft: CompiledDraft;
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
}

export interface PromotionOptions {
  stagedBuildDirectory: string;
  previewDirectory: string;
  buildId: string;
  draft: CompiledDraft;
  failureInjection?: "before-pointer";
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const sha256Buffer = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

const sha256File = async (path: string): Promise<string> =>
  sha256Buffer(await readFile(path));

const execute = async (
  executable: string,
  args: readonly string[],
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      const result = {
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      };
      if (code === 0) {
        resolvePromise(result);
        return;
      }
      reject(
        new Error(
          `${executable} exited with code ${code}: ${result.stderr.trim()}`,
        ),
      );
    });
  });

const commandVersion = async (
  executable: string,
  args: readonly string[],
): Promise<string> => {
  const result = await execute(executable, args);
  return (result.stdout || result.stderr).split("\n")[0]?.trim() ?? "unknown";
};

const ffmpegExecutable = (): string =>
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

const ffprobeExecutable = (): string =>
  process.env.NARAFRAME_FFPROBE_EXECUTABLE ??
  join(dirname(ffmpegExecutable()), "ffprobe");

const frameSourceNumber = (draft: CompiledDraft, frame: number): number =>
  draft.scope.type === "scene" ? draft.scope.sourceStartFrame + frame : frame;

export const selectCheckedFrames = (
  draft: CompiledDraft,
  issues: readonly Issue[],
): CheckedFrame[] => {
  const selected = new Map<number, CheckedFrame>();
  const add = (frame: number, sceneId: string, reason: string) => {
    const boundedFrame = Math.max(0, Math.min(draft.totalFrames - 1, frame));
    const existing = selected.get(boundedFrame);
    if (existing) {
      if (!existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
      }
      return;
    }
    selected.set(boundedFrame, {
      frame: boundedFrame,
      sourceFrame: frameSourceNumber(draft, boundedFrame),
      sceneId,
      reasons: [reason],
    });
  };

  for (const scene of draft.scenes) {
    add(
      scene.startFrame + Math.floor((scene.endFrame - scene.startFrame) / 2),
      scene.id,
      "scene-representative",
    );
    for (const beat of scene.beats) {
      add(
        scene.startFrame +
          beat.startFrame +
          Math.floor(beat.durationInFrames / 2),
        scene.id,
        `semantic-beat:${beat.action}:${beat.id}`,
      );
    }
  }

  const warnings = issues.filter((issue) => issue.severity === "warning");
  for (const warning of warnings) {
    const sourceIndex = Number(/^\/scenes\/(\d+)/.exec(warning.path)?.[1]);
    const scene =
      draft.scope.type === "project"
        ? draft.scenes[sourceIndex]
        : draft.scenes[0];
    if (scene) {
      add(
        scene.startFrame + Math.floor((scene.endFrame - scene.startFrame) / 2),
        scene.id,
        `warning:${warning.code}`,
      );
    }
  }

  return [...selected.values()]
    .map((frame) => ({ ...frame, reasons: frame.reasons.sort() }))
    .sort((left, right) => left.frame - right.frame);
};

const createContactSheet = async (
  videoPath: string,
  outputPath: string,
  frames: readonly CheckedFrame[],
  executable: string,
): Promise<void> => {
  const selection = frames.map(({ frame }) => `eq(n\\,${frame})`).join("+");
  const rows = Math.ceil(frames.length / 3);
  const filter = [
    `select='${selection}'`,
    "scale=164:292:force_original_aspect_ratio=decrease",
    "pad=164:292:(ow-iw)/2:(oh-ih)/2:color=black",
    `tile=3x${rows}:padding=12:margin=12:color=0x111111`,
  ].join(",");
  await execute(executable, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    videoPath,
    "-vf",
    filter,
    "-fps_mode",
    "vfr",
    "-frames:v",
    "1",
    "-y",
    outputPath,
  ]);
};

const artifactRecord = async (
  directory: string,
  path: ArtifactName,
  mediaType: string,
): Promise<ArtifactRecord> => {
  const artifactPath = join(directory, path);
  const details = await stat(artifactPath);
  return {
    path,
    bytes: details.size,
    sha256: await sha256File(artifactPath),
    mediaType,
  };
};

const hasPngSignature = (value: Buffer): boolean =>
  value
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

const hasMp4Signature = (value: Buffer): boolean =>
  value.length >= 12 && value.subarray(4, 8).toString("ascii") === "ftyp";

const parseJsonObject = async (
  path: string,
): Promise<Record<string, unknown>> => {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${path} must contain one JSON object.`);
  }
  return parsed as Record<string, unknown>;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const validTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const assertCompleteMetadata = (
  metadata: Record<string, unknown>,
  expectedBuildId: string,
  draft: CompiledDraft,
): void => {
  const runtime = metadata.runtime;
  const runtimeOs = isObject(runtime) ? runtime.os : undefined;
  const browser = isObject(runtime) ? runtime.browser : undefined;
  const ffmpeg = isObject(runtime) ? runtime.ffmpeg : undefined;
  const render = metadata.render;
  const profile = metadata.profile;
  const scopeMatches =
    JSON.stringify(metadata.scope) === JSON.stringify(draft.scope);
  if (
    metadata.schemaVersion !== 1 ||
    metadata.buildId !== expectedBuildId ||
    metadata.sourceRevision !== draft.sourceRevision ||
    metadata.assemblyKey !== draft.assemblyKey ||
    metadata.mode !== draft.mode ||
    !scopeMatches ||
    metadata.timelineScope !== draft.timelineScope ||
    metadata.label !== draft.label ||
    metadata.status !== "success" ||
    metadata.failure !== null ||
    !validTimestamp(metadata.startedAt) ||
    !validTimestamp(metadata.completedAt) ||
    !isObject(profile) ||
    profile.id !== draft.profile.id ||
    profile.version !== draft.profile.version ||
    !isObject(runtime) ||
    typeof runtime.node !== "string" ||
    typeof runtime.remotion !== "string" ||
    !isObject(runtimeOs) ||
    typeof runtimeOs.platform !== "string" ||
    typeof runtimeOs.release !== "string" ||
    typeof runtimeOs.architecture !== "string" ||
    !isObject(browser) ||
    typeof browser.executable !== "string" ||
    typeof browser.version !== "string" ||
    !isObject(ffmpeg) ||
    typeof ffmpeg.executable !== "string" ||
    typeof ffmpeg.version !== "string" ||
    !isObject(render) ||
    render.width !== draft.width ||
    render.height !== draft.height ||
    render.fps !== draft.fps ||
    render.durationInFrames !== draft.totalFrames ||
    render.codec !== "h264" ||
    render.audio !== "none" ||
    render.muted !== true ||
    !Array.isArray(metadata.checkedFrames) ||
    metadata.checkedFrames.length === 0
  ) {
    throw new Error(
      "Build metadata is incomplete or does not match the compiled draft.",
    );
  }
};

const probePreview = async (
  path: string,
  executable: string,
): Promise<Record<string, unknown>> => {
  const result = await execute(executable, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=codec_name,width,height,avg_frame_rate",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    path,
  ]);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

const validateProbe = (
  probe: Record<string, unknown>,
  draft: CompiledDraft,
): void => {
  const streams = Array.isArray(probe.streams) ? probe.streams : [];
  const stream = streams[0] as Record<string, unknown> | undefined;
  if (
    stream?.codec_name !== "h264" ||
    stream.width !== draft.width ||
    stream.height !== draft.height ||
    stream.avg_frame_rate !== `${draft.fps}/1`
  ) {
    throw new Error(
      "preview.mp4 does not match the expected H.264 render signature.",
    );
  }
  const format = probe.format as Record<string, unknown> | undefined;
  const duration = Number(format?.duration);
  const expectedDuration = draft.totalFrames / draft.fps;
  if (
    !Number.isFinite(duration) ||
    Math.abs(duration - expectedDuration) > 1 / draft.fps
  ) {
    throw new Error("preview.mp4 duration does not match the compiled draft.");
  }
};

export const validatePreviewBuildIntegrity = async ({
  buildDirectory,
  expectedBuildId,
  expectedDraft,
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
}: IntegrityOptions): Promise<string> => {
  const manifestPath = join(buildDirectory, "manifest.json");
  const manifest = await parseJsonObject(manifestPath);
  assertCompleteMetadata(manifest, expectedBuildId, expectedDraft);

  const artifacts = manifest.artifacts as
    | Record<string, ArtifactRecord>
    | undefined;
  for (const name of artifactNames) {
    const record = artifacts?.[name];
    if (!record || record.path !== name || record.bytes <= 0) {
      throw new Error(`manifest.json is missing a complete ${name} record.`);
    }
    const artifactPath = join(buildDirectory, name);
    const details = await stat(artifactPath);
    const actualHash = await sha256File(artifactPath);
    if (details.size !== record.bytes || actualHash !== record.sha256) {
      throw new Error(`${name} failed its declared size/hash integrity check.`);
    }
  }

  const mp4 = await readFile(join(buildDirectory, "preview.mp4"));
  if (!hasMp4Signature(mp4)) {
    throw new Error("preview.mp4 has an invalid file signature.");
  }
  const contactSheet = await readFile(
    join(buildDirectory, "contact-sheet.png"),
  );
  if (!hasPngSignature(contactSheet)) {
    throw new Error("contact-sheet.png has an invalid PNG signature.");
  }

  const frames = await parseJsonObject(join(buildDirectory, "frames.json"));
  const checkedFrames = Array.isArray(frames.frames) ? frames.frames : [];
  if (
    frames.buildId !== expectedBuildId ||
    frames.sourceRevision !== expectedDraft.sourceRevision ||
    frames.assemblyKey !== expectedDraft.assemblyKey ||
    JSON.stringify(frames.scope) !== JSON.stringify(expectedDraft.scope) ||
    frames.timelineScope !== expectedDraft.timelineScope ||
    checkedFrames.length === 0
  ) {
    throw new Error("frames.json is incomplete or belongs to another build.");
  }
  for (const frame of checkedFrames) {
    const value = frame as Record<string, unknown>;
    if (
      !Number.isInteger(value.frame) ||
      Number(value.frame) < 0 ||
      Number(value.frame) >= expectedDraft.totalFrames ||
      !Array.isArray(value.reasons) ||
      value.reasons.length === 0
    ) {
      throw new Error("frames.json contains an invalid checked frame.");
    }
  }

  const report = await parseJsonObject(join(buildDirectory, "report.json"));
  assertCompleteMetadata(report, expectedBuildId, expectedDraft);
  if (
    JSON.stringify(report.checkedFrames) !== JSON.stringify(checkedFrames) ||
    JSON.stringify(manifest.checkedFrames) !== JSON.stringify(checkedFrames)
  ) {
    throw new Error("report.json is incomplete or belongs to another build.");
  }

  const previewPath = join(buildDirectory, "preview.mp4");
  validateProbe(
    probe
      ? await probe(previewPath)
      : await probePreview(previewPath, requestedFfprobe),
    expectedDraft,
  );
  return sha256File(manifestPath);
};

const replacePointerAtomically = async (
  previewDirectory: string,
  pointer: Record<string, unknown>,
): Promise<string> => {
  const pointerPath = join(previewDirectory, "current.json");
  const temporaryPath = join(
    previewDirectory,
    `.current-${randomUUID()}.json.tmp`,
  );
  await writeFile(temporaryPath, json(pointer), { flag: "wx" });
  const handle = await open(temporaryPath, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporaryPath, pointerPath);
  return pointerPath;
};

export const promotePreviewBuild = async ({
  stagedBuildDirectory,
  previewDirectory,
  buildId,
  draft,
  failureInjection,
  ffprobeExecutable: requestedFfprobe,
  probe,
}: PromotionOptions): Promise<{
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
}> => {
  const buildsDirectory = join(previewDirectory, "builds");
  const buildDirectory = join(buildsDirectory, buildId);
  await mkdir(buildsDirectory, { recursive: true });
  const manifestSha256 = await validatePreviewBuildIntegrity({
    buildDirectory: stagedBuildDirectory,
    expectedBuildId: buildId,
    expectedDraft: draft,
    ...(requestedFfprobe ? { ffprobeExecutable: requestedFfprobe } : {}),
    ...(probe ? { probe } : {}),
  });
  await rename(stagedBuildDirectory, buildDirectory);

  if (
    failureInjection === "before-pointer" ||
    process.env.NARAFRAME_TEST_FAIL_PREVIEW_PUBLISH === "before-pointer"
  ) {
    throw new Error(
      "Injected preview publication failure before pointer promotion.",
    );
  }

  const currentPointer = await replacePointerAtomically(previewDirectory, {
    schemaVersion: 1,
    buildId,
    manifest: `builds/${buildId}/manifest.json`,
    manifestSha256,
    promotedAt: new Date().toISOString(),
  });
  return { buildDirectory, currentPointer, manifestSha256 };
};

export const publishPreviewBuild = async ({
  projectRoot,
  draft,
  issues,
  onProgress,
  failureInjection,
}: PreviewBuildOptions): Promise<PublishedPreviewBuild> => {
  const startedAt = new Date().toISOString();
  const attemptId = randomUUID();
  const buildId = `${draft.assemblyKey.slice(0, 12)}-${attemptId.slice(0, 12)}`;
  const attemptDirectory = resolve(
    projectRoot,
    ".naraframe",
    "attempts",
    attemptId,
  );
  const stagedBuildDirectory = join(attemptDirectory, "build");
  const previewDirectory = resolve(projectRoot, "preview");
  await mkdir(stagedBuildDirectory, { recursive: true });
  await writeFile(join(attemptDirectory, "compiled.json"), json(draft), {
    flag: "wx",
  });

  const outputPath = join(stagedBuildDirectory, "preview.mp4");
  const rendered = await renderDraft({
    draft,
    projectRoot,
    outputPath,
    ...(onProgress ? { onProgress } : {}),
  });
  const frames = selectCheckedFrames(draft, issues);
  const ffmpeg = ffmpegExecutable();
  const ffprobe = ffprobeExecutable();
  await access(ffmpeg);
  await access(ffprobe);
  await createContactSheet(
    outputPath,
    join(stagedBuildDirectory, "contact-sheet.png"),
    frames,
    ffmpeg,
  );

  const completedAt = new Date().toISOString();
  const runtime: RuntimeMetadata = {
    node: process.version,
    os: { platform: platform(), release: release(), architecture: arch() },
    remotion: rendered.remotionVersion,
    browser: {
      executable: rendered.browserExecutable,
      version: await commandVersion(rendered.browserExecutable, ["--version"]),
    },
    ffmpeg: {
      executable: ffmpeg,
      version: await commandVersion(ffmpeg, ["-version"]),
    },
  };
  const metadata: PreviewMetadata = {
    schemaVersion: 1,
    buildId,
    sourceRevision: draft.sourceRevision,
    assemblyKey: draft.assemblyKey,
    mode: "draft",
    scope: draft.scope,
    timelineScope: draft.timelineScope,
    label: draft.label,
    profile: { id: draft.profile.id, version: draft.profile.version },
    runtime,
    render: {
      width: rendered.width,
      height: rendered.height,
      fps: rendered.fps,
      durationInFrames: rendered.durationInFrames,
      codec: "h264",
      audio: "none",
      muted: true,
    },
    checkedFrames: frames,
    startedAt,
    completedAt,
    status: "success",
    failure: null,
  };
  await writeFile(
    join(stagedBuildDirectory, "frames.json"),
    json({
      schemaVersion: 1,
      buildId,
      sourceRevision: draft.sourceRevision,
      assemblyKey: draft.assemblyKey,
      scope: draft.scope,
      timelineScope: draft.timelineScope,
      frames,
    }),
    { flag: "wx" },
  );
  await writeFile(join(stagedBuildDirectory, "report.json"), json(metadata), {
    flag: "wx",
  });
  const records = await Promise.all([
    artifactRecord(stagedBuildDirectory, "preview.mp4", "video/mp4"),
    artifactRecord(stagedBuildDirectory, "contact-sheet.png", "image/png"),
    artifactRecord(stagedBuildDirectory, "frames.json", "application/json"),
    artifactRecord(stagedBuildDirectory, "report.json", "application/json"),
  ]);
  const artifacts = Object.fromEntries(
    records.map((record) => [record.path, record]),
  ) as Record<ArtifactName, ArtifactRecord>;
  const manifest: PreviewManifest = { ...metadata, artifacts };
  await writeFile(join(stagedBuildDirectory, "manifest.json"), json(manifest), {
    flag: "wx",
  });

  const promoted = await promotePreviewBuild({
    stagedBuildDirectory,
    previewDirectory,
    buildId,
    draft,
    ...(failureInjection ? { failureInjection } : {}),
    ffprobeExecutable: ffprobe,
  });
  await rm(attemptDirectory, { recursive: true, force: true });

  return {
    buildId,
    ...promoted,
    rendered,
  };
};
