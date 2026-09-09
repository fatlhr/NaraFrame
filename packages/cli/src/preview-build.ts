import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
  contactSheet: ContactSheetLayout;
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
  ffmpegExecutable?: string;
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
  decode?: (path: string) => Promise<void>;
  contactSheetProbe?: (path: string) => Promise<Record<string, unknown>>;
  contactSheetDecode?: (path: string) => Promise<void>;
}

export interface PromotionOptions {
  stagedBuildDirectory: string;
  previewDirectory: string;
  buildId: string;
  draft: CompiledDraft;
  failureInjection?: "before-pointer";
  ffmpegExecutable?: string;
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
  decode?: (path: string) => Promise<void>;
  contactSheetProbe?: (path: string) => Promise<Record<string, unknown>>;
  contactSheetDecode?: (path: string) => Promise<void>;
}

export interface MediaValidationOptions {
  path: string;
  draft: CompiledDraft;
  ffmpegExecutable?: string;
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
  decode?: (path: string) => Promise<void>;
}

export interface ContactSheetLayout {
  columns: 3;
  rows: number;
  cellWidth: 164;
  cellHeight: 292;
  padding: 12;
  margin: 12;
  width: 540;
  height: number;
}

export const withPublishedOutputPath = (
  rendered: RenderedDraft,
  buildDirectory: string,
): RenderedDraft => ({
  ...rendered,
  outputPath: join(buildDirectory, "preview.mp4"),
});

interface ContactSheetValidationOptions {
  path: string;
  layout: ContactSheetLayout;
  ffmpegExecutable?: string;
  ffprobeExecutable?: string;
  probe?: (path: string) => Promise<Record<string, unknown>>;
  decode?: (path: string) => Promise<void>;
}

export interface PreviewOutputRoots {
  project: string;
  attempts: string;
  preview: string;
  builds: string;
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

const isContainedPath = (root: string, candidate: string): boolean => {
  const result = relative(root, candidate);
  return (
    result === "" ||
    (!result.startsWith(`..${sep}`) && result !== ".." && !isAbsolute(result))
  );
};

const validateOutputAncestor = async (
  realProjectRoot: string,
  candidate: string,
  displayPath: string,
  details: Awaited<ReturnType<typeof lstat>>,
): Promise<string> => {
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new Error(
      `Unsafe output path ${displayPath}: every output ancestor must be a real directory, not a symlink or file.`,
    );
  }
  const resolved = await realpath(candidate);
  if (!isContainedPath(realProjectRoot, resolved)) {
    throw new Error(
      `Unsafe output path ${displayPath}: resolved directory escapes the project root.`,
    );
  }
  return resolved;
};

const validateExistingOutputAncestors = async (
  realProjectRoot: string,
  segments: readonly string[],
): Promise<void> => {
  let current = realProjectRoot;
  for (const segment of segments) {
    const candidate = join(current, segment);
    const details = await lstat(candidate).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      return undefined;
    });
    if (!details) {
      return;
    }
    current = await validateOutputAncestor(
      realProjectRoot,
      candidate,
      segments.join("/"),
      details,
    );
  }
};

const resolveSafeOutputDirectory = async (
  realProjectRoot: string,
  segments: readonly string[],
): Promise<string> => {
  let current = realProjectRoot;
  for (const segment of segments) {
    const candidate = join(current, segment);
    let details = await lstat(candidate).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      return undefined;
    });
    if (!details) {
      await mkdir(candidate).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          throw error;
        }
      });
      details = await lstat(candidate);
    }
    current = await validateOutputAncestor(
      realProjectRoot,
      candidate,
      segments.join("/"),
      details,
    );
  }
  return current;
};

export const preparePreviewOutputRoots = async (
  projectRoot: string,
): Promise<PreviewOutputRoots> => {
  const project = await realpath(resolve(projectRoot));
  await Promise.all([
    validateExistingOutputAncestors(project, [".naraframe", "attempts"]),
    validateExistingOutputAncestors(project, ["preview", "builds"]),
  ]);
  const attempts = await resolveSafeOutputDirectory(project, [
    ".naraframe",
    "attempts",
  ]);
  const builds = await resolveSafeOutputDirectory(project, [
    "preview",
    "builds",
  ]);
  const preview = dirname(builds);
  const [attemptDetails, buildDetails] = await Promise.all([
    stat(attempts),
    stat(builds),
  ]);
  if (attemptDetails.dev !== buildDetails.dev) {
    throw new Error(
      "Preview attempts and builds must be directories on the same filesystem.",
    );
  }
  return { project, attempts, preview, builds };
};

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

export const contactSheetLayoutFor = (
  frameCount: number,
): ContactSheetLayout => {
  const rows = Math.ceil(frameCount / 3);
  return {
    columns: 3,
    rows,
    cellWidth: 164,
    cellHeight: 292,
    padding: 12,
    margin: 12,
    width: 540,
    height: rows * 292 + Math.max(0, rows - 1) * 12 + 24,
  };
};

const createContactSheet = async (
  videoPath: string,
  outputPath: string,
  frames: readonly CheckedFrame[],
  layout: ContactSheetLayout,
  executable: string,
): Promise<void> => {
  const selection = frames.map(({ frame }) => `eq(n\\,${frame})`).join("+");
  const filter = [
    `select='${selection}'`,
    `scale=${layout.cellWidth}:${layout.cellHeight}:force_original_aspect_ratio=decrease`,
    `pad=${layout.cellWidth}:${layout.cellHeight}:(ow-iw)/2:(oh-ih)/2:color=black`,
    `tile=${layout.columns}x${layout.rows}:padding=${layout.padding}:margin=${layout.margin}:color=0x111111`,
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

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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
  const expectedContactSheet = Array.isArray(metadata.checkedFrames)
    ? contactSheetLayoutFor(metadata.checkedFrames.length)
    : undefined;
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
    !nonEmptyString(runtime.node) ||
    !nonEmptyString(runtime.remotion) ||
    !isObject(runtimeOs) ||
    !nonEmptyString(runtimeOs.platform) ||
    !nonEmptyString(runtimeOs.release) ||
    !nonEmptyString(runtimeOs.architecture) ||
    !isObject(browser) ||
    !nonEmptyString(browser.executable) ||
    !nonEmptyString(browser.version) ||
    !isObject(ffmpeg) ||
    !nonEmptyString(ffmpeg.executable) ||
    !nonEmptyString(ffmpeg.version) ||
    !isObject(render) ||
    render.width !== draft.width ||
    render.height !== draft.height ||
    render.fps !== draft.fps ||
    render.durationInFrames !== draft.totalFrames ||
    render.codec !== "h264" ||
    render.audio !== "none" ||
    render.muted !== true ||
    JSON.stringify(metadata.contactSheet) !==
      JSON.stringify(expectedContactSheet) ||
    !Array.isArray(metadata.checkedFrames) ||
    metadata.checkedFrames.length === 0
  ) {
    throw new Error(
      "Build metadata is incomplete or does not match the compiled draft.",
    );
  }
  if (Date.parse(metadata.completedAt) < Date.parse(metadata.startedAt)) {
    throw new Error("Build completion timestamp precedes its start timestamp.");
  }
};

const probePreview = async (
  path: string,
  executable: string,
): Promise<Record<string, unknown>> => {
  const result = await execute(executable, [
    "-v",
    "error",
    "-show_entries",
    "stream=index,codec_type,codec_name,width,height,avg_frame_rate",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    path,
  ]);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

const decodePreview = async (
  path: string,
  executable: string,
): Promise<void> => {
  await execute(executable, [
    "-v",
    "error",
    "-xerror",
    "-err_detect",
    "explode",
    "-i",
    path,
    "-map",
    "0:v:0",
    "-an",
    "-f",
    "null",
    "-",
  ]);
};

const probeContactSheet = async (
  path: string,
  executable: string,
): Promise<Record<string, unknown>> => {
  const result = await execute(executable, [
    "-v",
    "error",
    "-show_entries",
    "stream=index,codec_type,codec_name,width,height",
    "-of",
    "json",
    path,
  ]);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

const decodeContactSheet = async (
  path: string,
  executable: string,
): Promise<void> => {
  await execute(executable, [
    "-v",
    "error",
    "-xerror",
    "-err_detect",
    "explode",
    "-i",
    path,
    "-map",
    "0:v:0",
    "-f",
    "null",
    "-",
  ]);
};

const validateProbe = (
  probe: Record<string, unknown>,
  draft: CompiledDraft,
): { codec: "h264"; audio: "none" } => {
  const streams = (Array.isArray(probe.streams) ? probe.streams : []).filter(
    isObject,
  );
  const videoStreams = streams.filter(
    (stream) => stream.codec_type === "video",
  );
  const audioStreams = streams.filter(
    (stream) => stream.codec_type === "audio",
  );
  const stream = videoStreams[0];
  if (
    videoStreams.length !== 1 ||
    stream?.codec_name !== "h264" ||
    stream.width !== draft.width ||
    stream.height !== draft.height ||
    stream.avg_frame_rate !== `${draft.fps}/1`
  ) {
    throw new Error(
      "preview.mp4 does not match the expected H.264 render signature.",
    );
  }
  if (audioStreams.length > 0) {
    throw new Error(
      "Silent draft preview.mp4 unexpectedly contains an audio stream.",
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
  return { codec: "h264", audio: "none" };
};

export const validatePreviewMedia = async ({
  path,
  draft,
  ffmpegExecutable: requestedFfmpeg = ffmpegExecutable(),
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
  decode,
}: MediaValidationOptions): Promise<{ codec: "h264"; audio: "none" }> => {
  const mp4 = await readFile(path);
  if (!hasMp4Signature(mp4)) {
    throw new Error("preview.mp4 has an invalid file signature.");
  }
  const verified = validateProbe(
    probe ? await probe(path) : await probePreview(path, requestedFfprobe),
    draft,
  );
  if (decode) {
    await decode(path);
  } else {
    await decodePreview(path, requestedFfmpeg);
  }
  return verified;
};

const validateContactSheet = async ({
  path,
  layout,
  ffmpegExecutable: requestedFfmpeg = ffmpegExecutable(),
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
  decode,
}: ContactSheetValidationOptions): Promise<void> => {
  const png = await readFile(path);
  if (!hasPngSignature(png)) {
    throw new Error("contact-sheet.png has an invalid PNG signature.");
  }
  const result = probe
    ? await probe(path)
    : await probeContactSheet(path, requestedFfprobe);
  const streams = (Array.isArray(result.streams) ? result.streams : []).filter(
    isObject,
  );
  const stream = streams[0];
  if (
    streams.length !== 1 ||
    stream?.codec_type !== "video" ||
    stream.codec_name !== "png" ||
    stream.width !== layout.width ||
    stream.height !== layout.height
  ) {
    throw new Error(
      "contact-sheet.png does not match the expected PNG layout dimensions.",
    );
  }
  if (decode) {
    await decode(path);
  } else {
    await decodeContactSheet(path, requestedFfmpeg);
  }
};

const assertRequiredFrameCoverage = (
  draft: CompiledDraft,
  frames: readonly unknown[],
): void => {
  const expected = selectCheckedFrames(draft, []);
  for (const required of expected) {
    const covered = frames.some((candidate) => {
      if (!isObject(candidate)) {
        return false;
      }
      const reasons = candidate.reasons;
      return (
        candidate.frame === required.frame &&
        candidate.sourceFrame === required.sourceFrame &&
        candidate.sceneId === required.sceneId &&
        Array.isArray(reasons) &&
        required.reasons.every((reason) => reasons.includes(reason))
      );
    });
    if (!covered) {
      throw new Error(
        `frames.json is missing required representative coverage for ${required.sceneId} at frame ${required.frame}: ${required.reasons.join(", ")}.`,
      );
    }
  }
};

const sharedMetadataKeys = [
  "schemaVersion",
  "buildId",
  "sourceRevision",
  "assemblyKey",
  "mode",
  "scope",
  "timelineScope",
  "label",
  "profile",
  "runtime",
  "render",
  "contactSheet",
  "checkedFrames",
  "startedAt",
  "completedAt",
  "status",
  "failure",
] as const;

const assertSharedMetadataMatches = (
  manifest: Record<string, unknown>,
  report: Record<string, unknown>,
): void => {
  for (const key of sharedMetadataKeys) {
    if (JSON.stringify(manifest[key]) !== JSON.stringify(report[key])) {
      throw new Error(
        `report.json and manifest.json disagree on shared ${key}.`,
      );
    }
  }
};

export const validatePreviewBuildIntegrity = async ({
  buildDirectory,
  expectedBuildId,
  expectedDraft,
  ffmpegExecutable: requestedFfmpeg = ffmpegExecutable(),
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
  decode,
  contactSheetProbe: requestedContactSheetProbe,
  contactSheetDecode: requestedContactSheetDecode,
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

  const frames = await parseJsonObject(join(buildDirectory, "frames.json"));
  const checkedFrames = Array.isArray(frames.frames) ? frames.frames : [];
  const expectedContactSheet = contactSheetLayoutFor(checkedFrames.length);
  if (
    frames.schemaVersion !== 1 ||
    frames.buildId !== expectedBuildId ||
    frames.sourceRevision !== expectedDraft.sourceRevision ||
    frames.assemblyKey !== expectedDraft.assemblyKey ||
    JSON.stringify(frames.scope) !== JSON.stringify(expectedDraft.scope) ||
    frames.timelineScope !== expectedDraft.timelineScope ||
    JSON.stringify(frames.contactSheet) !==
      JSON.stringify(expectedContactSheet) ||
    checkedFrames.length === 0
  ) {
    throw new Error("frames.json is incomplete or belongs to another build.");
  }
  for (const frame of checkedFrames) {
    if (!isObject(frame)) {
      throw new Error("frames.json contains an invalid checked frame.");
    }
    const value = frame;
    const frameNumber = Number(value.frame);
    const expectedScene = expectedDraft.scenes.find(
      (scene) =>
        frameNumber >= scene.startFrame && frameNumber < scene.endFrame,
    );
    if (
      !Number.isInteger(value.frame) ||
      frameNumber < 0 ||
      frameNumber >= expectedDraft.totalFrames ||
      !Number.isInteger(value.sourceFrame) ||
      value.sourceFrame !== frameSourceNumber(expectedDraft, frameNumber) ||
      !nonEmptyString(value.sceneId) ||
      value.sceneId !== expectedScene?.id ||
      !Array.isArray(value.reasons) ||
      value.reasons.length === 0 ||
      !value.reasons.every(nonEmptyString)
    ) {
      throw new Error("frames.json contains an invalid checked frame.");
    }
  }
  assertRequiredFrameCoverage(expectedDraft, checkedFrames);

  const report = await parseJsonObject(join(buildDirectory, "report.json"));
  assertCompleteMetadata(report, expectedBuildId, expectedDraft);
  assertSharedMetadataMatches(manifest, report);
  if (
    JSON.stringify(report.checkedFrames) !== JSON.stringify(checkedFrames) ||
    JSON.stringify(manifest.checkedFrames) !== JSON.stringify(checkedFrames)
  ) {
    throw new Error("report.json is incomplete or belongs to another build.");
  }

  await validateContactSheet({
    path: join(buildDirectory, "contact-sheet.png"),
    layout: expectedContactSheet,
    ffmpegExecutable: requestedFfmpeg,
    ffprobeExecutable: requestedFfprobe,
    ...(requestedContactSheetProbe
      ? { probe: requestedContactSheetProbe }
      : {}),
    ...(requestedContactSheetDecode
      ? { decode: requestedContactSheetDecode }
      : {}),
  });
  await validatePreviewMedia({
    path: join(buildDirectory, "preview.mp4"),
    draft: expectedDraft,
    ffmpegExecutable: requestedFfmpeg,
    ffprobeExecutable: requestedFfprobe,
    ...(probe ? { probe } : {}),
    ...(decode ? { decode } : {}),
  });
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

const assertBuildDestinationAbsent = async (
  buildDirectory: string,
): Promise<void> => {
  try {
    await lstat(buildDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
  throw new Error(
    `Immutable preview build destination already exists: ${buildDirectory}.`,
  );
};

export const promotePreviewBuild = async ({
  stagedBuildDirectory,
  previewDirectory,
  buildId,
  draft,
  failureInjection,
  ffmpegExecutable: requestedFfmpeg,
  ffprobeExecutable: requestedFfprobe,
  probe,
  decode,
  contactSheetProbe: requestedContactSheetProbe,
  contactSheetDecode: requestedContactSheetDecode,
}: PromotionOptions): Promise<{
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
}> => {
  const buildsDirectory = join(previewDirectory, "builds");
  const buildDirectory = join(buildsDirectory, buildId);
  await assertBuildDestinationAbsent(buildDirectory);
  const manifestSha256 = await validatePreviewBuildIntegrity({
    buildDirectory: stagedBuildDirectory,
    expectedBuildId: buildId,
    expectedDraft: draft,
    ...(requestedFfmpeg ? { ffmpegExecutable: requestedFfmpeg } : {}),
    ...(requestedFfprobe ? { ffprobeExecutable: requestedFfprobe } : {}),
    ...(probe ? { probe } : {}),
    ...(decode ? { decode } : {}),
    ...(requestedContactSheetProbe
      ? { contactSheetProbe: requestedContactSheetProbe }
      : {}),
    ...(requestedContactSheetDecode
      ? { contactSheetDecode: requestedContactSheetDecode }
      : {}),
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
  const outputRoots = await preparePreviewOutputRoots(projectRoot);
  const attemptDirectory = join(outputRoots.attempts, attemptId);
  const stagedBuildDirectory = join(attemptDirectory, "build");
  const previewDirectory = outputRoots.preview;
  await mkdir(stagedBuildDirectory, { recursive: true });
  await writeFile(join(attemptDirectory, "compiled.json"), json(draft), {
    flag: "wx",
  });

  const outputPath = join(stagedBuildDirectory, "preview.mp4");
  const rendered = await renderDraft({
    draft,
    projectRoot: outputRoots.project,
    outputPath,
    ...(onProgress ? { onProgress } : {}),
  });
  const frames = selectCheckedFrames(draft, issues);
  const contactSheet = contactSheetLayoutFor(frames.length);
  const ffmpeg = ffmpegExecutable();
  const ffprobe = ffprobeExecutable();
  await access(ffmpeg);
  await access(ffprobe);
  await createContactSheet(
    outputPath,
    join(stagedBuildDirectory, "contact-sheet.png"),
    frames,
    contactSheet,
    ffmpeg,
  );

  const verifiedMedia = await validatePreviewMedia({
    path: outputPath,
    draft,
    ffmpegExecutable: ffmpeg,
    ffprobeExecutable: ffprobe,
  });
  await validateContactSheet({
    path: join(stagedBuildDirectory, "contact-sheet.png"),
    layout: contactSheet,
    ffmpegExecutable: ffmpeg,
    ffprobeExecutable: ffprobe,
  });
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
  await writeFile(
    join(stagedBuildDirectory, "frames.json"),
    json({
      schemaVersion: 1,
      buildId,
      sourceRevision: draft.sourceRevision,
      assemblyKey: draft.assemblyKey,
      scope: draft.scope,
      timelineScope: draft.timelineScope,
      contactSheet,
      frames,
    }),
    { flag: "wx" },
  );
  const preparedArtifactRecords = await Promise.all([
    artifactRecord(stagedBuildDirectory, "preview.mp4", "video/mp4"),
    artifactRecord(stagedBuildDirectory, "contact-sheet.png", "image/png"),
    artifactRecord(stagedBuildDirectory, "frames.json", "application/json"),
  ]);
  const completedAt = new Date().toISOString();
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
      codec: verifiedMedia.codec,
      audio: verifiedMedia.audio,
      muted: true,
    },
    contactSheet,
    checkedFrames: frames,
    startedAt,
    completedAt,
    status: "success",
    failure: null,
  };
  await writeFile(join(stagedBuildDirectory, "report.json"), json(metadata), {
    flag: "wx",
  });
  const records = [
    ...preparedArtifactRecords,
    await artifactRecord(
      stagedBuildDirectory,
      "report.json",
      "application/json",
    ),
  ];
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
    ffmpegExecutable: ffmpeg,
    ffprobeExecutable: ffprobe,
  });
  await rm(attemptDirectory, { recursive: true, force: true });

  return {
    buildId,
    ...promoted,
    rendered: withPublishedOutputPath(rendered, promoted.buildDirectory),
  };
};
