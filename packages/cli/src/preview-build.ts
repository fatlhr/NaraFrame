import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  copyFile,
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  type CompiledDraft,
  computeReadabilityMetrics,
  computeVarietyMetrics,
  type Issue,
  type ReadabilityMetrics,
  type VarietyMetrics,
} from "@naraframe/core";
import {
  type RenderedDraft,
  renderDraft,
  rendererRemotionVersion,
  resolveBrowserExecutable,
} from "@naraframe/renderer-remotion";
import {
  assertFrameIntegrity,
  type FrameIntegrityRecord,
} from "./frame-integrity.js";

const artifactNames = [
  "preview.mp4",
  "contact-sheet.png",
  "frames.json",
  "report.json",
] as const;

/**
 * A grid of the checked frames for reading at a glance. Builds made before it
 * existed simply have no record of it, so it is never required.
 */
const storyboardName = "storyboard.png" as const;

type ArtifactName = (typeof artifactNames)[number] | typeof storyboardName;

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
    audio: "none" | "aac";
    muted: boolean;
  };
  contactSheet: ContactSheetLayout;
  checkedFrames: CheckedFrame[];
  visualPreflight: {
    issues: Issue[];
    checkedFrames: Array<{
      frame: number;
      sceneId: string;
      reasons: string[];
    }>;
  };
  /** M0.10.5: the reviewable evidence a build is safe to publish, measured
   * from the final compiled draft rather than a screenshot. */
  varietyMetrics: VarietyMetrics;
  readability: ReadabilityMetrics;
  /** Set on builds whose frames were scanned for incomplete captures. */
  frameIntegrity?: FrameIntegrityRecord;
  startedAt: string;
  completedAt: string;
  status: "success";
  failure: null;
  /** Set when the pixels were reused from an earlier build instead of rendered. */
  reusedFromBuildId?: string;
}

interface PreviewManifest extends PreviewMetadata {
  artifacts: Record<(typeof artifactNames)[number], ArtifactRecord> &
    Partial<Record<typeof storyboardName, ArtifactRecord>>;
}

export interface PublishedPreviewBuild {
  buildId: string;
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
  /** Whether the build carries a storyboard.png next to the contact sheet. */
  storyboard: boolean;
  rendered: RenderedDraft;
  issues: Issue[];
}

export interface PreviewBuildOptions {
  projectRoot: string;
  draft: CompiledDraft;
  issues: readonly Issue[];
  onProgress?: (progress: number) => void;
  failureInjection?: "before-pointer";
  signal?: AbortSignal;
  onPointerRenameDispatched?: () => void;
  /** Test seams: stand in for the renderer and the frame integrity scan. */
  render?: typeof renderDraft;
  frameIntegrity?: (path: string) => Promise<FrameIntegrityRecord>;
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
  signal?: AbortSignal;
  onPointerPrepared?: () => void | Promise<void>;
  onPointerRenameDispatched?: () => void;
  pointerOpener?: typeof open;
  pointerRenamer?: (from: string, to: string) => Promise<void>;
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
  layout: { width: number; height: number };
  name?: string;
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

export const json = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    const error = new Error("Preview publication was interrupted.");
    error.name = "AbortError";
    throw error;
  }
};

const sha256Buffer = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

export const sha256File = async (path: string): Promise<string> =>
  sha256Buffer(await readFile(path));

export const execute = async (
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

export const commandVersion = async (
  executable: string,
  args: readonly string[],
): Promise<string> => {
  const result = await execute(executable, args);
  return (result.stdout || result.stderr).split("\n")[0]?.trim() ?? "unknown";
};

export const ffmpegExecutable = (): string =>
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

export const ffprobeExecutable = (): string =>
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

export const validateExistingOutputAncestors = async (
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

export const resolveSafeOutputDirectory = async (
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
  draft.scope.type === "scene" && draft.scope.sourceStartFrame !== null
    ? draft.scope.sourceStartFrame + frame
    : frame;

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
    add(scene.startFrame, scene.id, "scene-entry");
    add(
      scene.startFrame + Math.floor((scene.endFrame - scene.startFrame) * 0.25),
      scene.id,
      "scene-settled",
    );
    add(
      scene.startFrame + Math.floor((scene.endFrame - scene.startFrame) / 2),
      scene.id,
      "scene-representative",
    );
    add(scene.endFrame - 1, scene.id, "scene-final");
    // A beat may end exactly where its scene ends; its settled frame is then
    // the scene's last frame, not the next scene's first.
    const withinScene = (frame: number) => Math.min(scene.endFrame - 1, frame);
    for (const beat of scene.beats) {
      add(
        withinScene(
          scene.startFrame +
            beat.startFrame +
            Math.floor(beat.durationInFrames / 2),
        ),
        scene.id,
        `semantic-beat:${beat.action}:${beat.id}`,
      );
      add(
        withinScene(scene.startFrame + beat.startFrame + beat.durationInFrames),
        scene.id,
        `semantic-beat-settled:${beat.action}:${beat.id}`,
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

export interface StoryboardLayout {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  padding: number;
  margin: number;
  width: number;
  height: number;
}

/** Height of the frame inside a storyboard cell; the strip below holds the label. */
const STORYBOARD_FRAME_HEIGHT = 480;
const STORYBOARD_LABEL_STRIP = 24;

/**
 * Four columns of half-size draft frames, so a frame is read at 270 px wide.
 * Each cell has a strip under the frame for its time label, so the label never
 * covers the headline or the caption area of the frame itself.
 */
export const storyboardLayoutFor = (frameCount: number): StoryboardLayout => {
  const columns = Math.min(4, Math.max(1, frameCount));
  const rows = Math.ceil(frameCount / columns);
  const cellWidth = 270;
  const cellHeight = STORYBOARD_FRAME_HEIGHT + STORYBOARD_LABEL_STRIP;
  const padding = 12;
  const margin = 12;
  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    padding,
    margin,
    width: columns * cellWidth + (columns - 1) * padding + 2 * margin,
    height: rows * cellHeight + (rows - 1) * padding + 2 * margin,
  };
};

const labelFont = async (): Promise<string | null> => {
  for (const candidate of [
    process.env.NARAFRAME_FONT_FILE,
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ]) {
    if (!candidate) continue;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
};

/**
 * Tiles the checked frames into storyboard.png, each cell labelled with its
 * time in the video when a font is at hand. The storyboard is a convenience:
 * if it cannot be made, the build is published without it.
 */
const createStoryboard = async (
  videoPath: string,
  outputPath: string,
  frames: readonly CheckedFrame[],
  executable: string,
): Promise<StoryboardLayout | null> => {
  const layout = storyboardLayoutFor(frames.length);
  const selection = frames.map(({ frame }) => `eq(n\\,${frame})`).join("+");
  const base = [
    `select='${selection}'`,
    `scale=${layout.cellWidth}:${STORYBOARD_FRAME_HEIGHT}:force_original_aspect_ratio=decrease`,
    `pad=${layout.cellWidth}:${STORYBOARD_FRAME_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black`,
    `pad=${layout.cellWidth}:${layout.cellHeight}:0:0:color=0x111111`,
  ];
  const tile = `tile=${layout.columns}x${layout.rows}:padding=${layout.padding}:margin=${layout.margin}:color=0x111111`;
  const font = await labelFont();
  const attempts = [
    ...(font
      ? [
          [
            ...base,
            `drawtext=fontfile='${font.replaceAll("'", "")}':text='%{pts\\:hms}':x=8:y=${STORYBOARD_FRAME_HEIGHT + 4}:fontsize=16:fontcolor=white`,
            tile,
          ],
        ]
      : []),
    [...base, tile],
  ];
  for (const chain of attempts) {
    try {
      await execute(executable, [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        videoPath,
        "-vf",
        chain.join(","),
        "-fps_mode",
        "vfr",
        "-frames:v",
        "1",
        "-y",
        outputPath,
      ]);
      return layout;
    } catch {
      await rm(outputPath, { force: true });
    }
  }
  return null;
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

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

const isValidPreviewScope = (
  scope: unknown,
): scope is Record<string, unknown> => {
  if (!isObject(scope)) return false;
  if (scope.type === "project") {
    return Object.keys(scope).length === 1;
  }
  if (
    scope.type !== "scene" ||
    Object.keys(scope).length !== 4 ||
    !nonEmptyString(scope.sceneId)
  ) {
    return false;
  }
  // Both null: an earlier block has no audio yet, so the global offset is unknown.
  if (scope.sourceStartFrame === null && scope.sourceEndFrame === null) {
    return true;
  }
  return (
    Number.isInteger(scope.sourceStartFrame) &&
    (scope.sourceStartFrame as number) >= 0 &&
    Number.isInteger(scope.sourceEndFrame) &&
    (scope.sourceEndFrame as number) > (scope.sourceStartFrame as number)
  );
};

const assertMetadataShape = (
  metadata: Record<string, unknown>,
  expectedBuildId: string,
): void => {
  const runtime = metadata.runtime;
  const runtimeOs = isObject(runtime) ? runtime.os : undefined;
  const browser = isObject(runtime) ? runtime.browser : undefined;
  const ffmpeg = isObject(runtime) ? runtime.ffmpeg : undefined;
  const render = metadata.render;
  const profile = metadata.profile;
  const checkedFrames = metadata.checkedFrames;
  const expectedContactSheet = Array.isArray(checkedFrames)
    ? contactSheetLayoutFor(checkedFrames.length)
    : undefined;
  if (
    metadata.schemaVersion !== 1 ||
    metadata.buildId !== expectedBuildId ||
    !isSha256(metadata.sourceRevision) ||
    !isSha256(metadata.assemblyKey) ||
    metadata.mode !== "draft" ||
    !isValidPreviewScope(metadata.scope) ||
    (metadata.scope.type === "project"
      ? metadata.timelineScope !== "project"
      : metadata.timelineScope !== "local") ||
    !(
      metadata.label === "DRAFT • NO AUDIO" ||
      metadata.label === "DRAFT • WITH AUDIO"
    ) ||
    metadata.status !== "success" ||
    metadata.failure !== null ||
    !validTimestamp(metadata.startedAt) ||
    !validTimestamp(metadata.completedAt) ||
    !isObject(profile) ||
    !nonEmptyString(profile.id) ||
    !nonEmptyString(profile.version) ||
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
    !Number.isInteger(render.width) ||
    (render.width as number) <= 0 ||
    !Number.isInteger(render.height) ||
    (render.height as number) <= 0 ||
    !Number.isInteger(render.fps) ||
    (render.fps as number) <= 0 ||
    !Number.isInteger(render.durationInFrames) ||
    (render.durationInFrames as number) <= 0 ||
    render.codec !== "h264" ||
    !(render.audio === "none" || render.audio === "aac") ||
    metadata.label !==
      (render.audio === "aac" ? "DRAFT • WITH AUDIO" : "DRAFT • NO AUDIO") ||
    typeof render.muted !== "boolean" ||
    JSON.stringify(metadata.contactSheet) !==
      JSON.stringify(expectedContactSheet) ||
    !Array.isArray(checkedFrames) ||
    checkedFrames.length === 0
  ) {
    throw new Error(
      "Build metadata is incomplete or has an invalid draft shape.",
    );
  }
  if (Date.parse(metadata.completedAt) < Date.parse(metadata.startedAt)) {
    throw new Error("Build completion timestamp precedes its start timestamp.");
  }
};

// Narration and a soundtrack both put one AAC stream in the preview, so the
// probe and the metadata checks must agree on this single predicate.
export const carriesAudio = (draft: CompiledDraft): boolean =>
  Boolean(draft.narration || draft.soundtrack);

const assertCompleteMetadata = (
  metadata: Record<string, unknown>,
  expectedBuildId: string,
  draft: CompiledDraft,
): void => {
  assertMetadataShape(metadata, expectedBuildId);
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
    (metadata.profile as Record<string, unknown>).id !== draft.profile.id ||
    (metadata.profile as Record<string, unknown>).version !==
      draft.profile.version ||
    (metadata.render as Record<string, unknown>).width !== draft.width ||
    (metadata.render as Record<string, unknown>).height !== draft.height ||
    (metadata.render as Record<string, unknown>).fps !== draft.fps ||
    (metadata.render as Record<string, unknown>).durationInFrames !==
      draft.totalFrames ||
    (metadata.render as Record<string, unknown>).audio !==
      (carriesAudio(draft) ? "aac" : "none") ||
    (metadata.render as Record<string, unknown>).muted !==
      !carriesAudio(draft) ||
    JSON.stringify(metadata.contactSheet) !==
      JSON.stringify(expectedContactSheet) ||
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
    "-show_entries",
    "stream=index,codec_type,codec_name,width,height,avg_frame_rate,duration",
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
): { codec: "h264"; audio: "none" | "aac" } => {
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
  const hasNarration = carriesAudio(draft);
  if (hasNarration) {
    if (audioStreams.length !== 1 || audioStreams[0]?.codec_name !== "aac") {
      throw new Error(
        "Narrated preview.mp4 must contain exactly one AAC audio stream.",
      );
    }
  } else if (audioStreams.length > 0) {
    throw new Error(
      "Silent draft preview.mp4 unexpectedly contains an audio stream.",
    );
  }
  const format = probe.format as Record<string, unknown> | undefined;
  const expectedDuration = draft.totalFrames / draft.fps;
  const duration = Number(format?.duration);
  // For narrated, the container duration follows the longer audio stream
  // (AAC priming adds ~45ms). Check the video stream's own duration instead.
  const videoDuration = Number(
    (videoStreams[0] as Record<string, unknown>)?.duration,
  );
  const actualDuration = hasNarration
    ? Number.isFinite(videoDuration)
      ? videoDuration
      : duration
    : duration;
  const tolerance = hasNarration ? 0.1 : 1 / draft.fps;
  if (
    !Number.isFinite(actualDuration) ||
    Math.abs(actualDuration - expectedDuration) > tolerance
  ) {
    throw new Error("preview.mp4 duration does not match the compiled draft.");
  }
  return { codec: "h264", audio: hasNarration ? "aac" : "none" };
};

export const validatePreviewMedia = async ({
  path,
  draft,
  ffmpegExecutable: requestedFfmpeg = ffmpegExecutable(),
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
  decode,
}: MediaValidationOptions): Promise<{
  codec: "h264";
  audio: "none" | "aac";
}> => {
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
  name = "contact-sheet.png",
  ffmpegExecutable: requestedFfmpeg = ffmpegExecutable(),
  ffprobeExecutable: requestedFfprobe = ffprobeExecutable(),
  probe,
  decode,
}: ContactSheetValidationOptions): Promise<void> => {
  const png = await readFile(path);
  if (!hasPngSignature(png)) {
    throw new Error(`${name} has an invalid PNG signature.`);
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
      `${name} does not match the expected PNG layout dimensions.`,
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

const assertCheckedFrameShape = (frame: unknown): void => {
  if (!isObject(frame)) {
    throw new Error("frames.json contains an invalid checked frame.");
  }
  if (
    !Number.isInteger(frame.frame) ||
    (frame.frame as number) < 0 ||
    !Number.isInteger(frame.sourceFrame) ||
    (frame.sourceFrame as number) < 0 ||
    !nonEmptyString(frame.sceneId) ||
    !Array.isArray(frame.reasons) ||
    frame.reasons.length === 0 ||
    !frame.reasons.every(nonEmptyString)
  ) {
    throw new Error("frames.json contains an invalid checked frame.");
  }
};

const assertArtifactRecords = (manifest: Record<string, unknown>): void => {
  if (!isObject(manifest.artifacts)) {
    throw new Error("manifest.json is missing artifact metadata.");
  }
  for (const name of artifactNames) {
    const record = manifest.artifacts[name];
    if (
      !isObject(record) ||
      record.path !== name ||
      !Number.isInteger(record.bytes) ||
      (record.bytes as number) <= 0 ||
      !isSha256(record.sha256) ||
      !nonEmptyString(record.mediaType)
    ) {
      throw new Error(`manifest.json is missing a complete ${name} record.`);
    }
  }
};

export const validatePublishedPreviewMetadata = ({
  manifest,
  report,
  frames,
  expectedBuildId,
}: {
  manifest: Record<string, unknown>;
  report: Record<string, unknown>;
  frames: Record<string, unknown>;
  expectedBuildId: string;
}): void => {
  assertMetadataShape(manifest, expectedBuildId);
  assertArtifactRecords(manifest);
  assertMetadataShape(report, expectedBuildId);
  assertSharedMetadataMatches(manifest, report);

  const checkedFrames = Array.isArray(frames.frames) ? frames.frames : [];
  if (
    frames.schemaVersion !== 1 ||
    frames.buildId !== expectedBuildId ||
    frames.sourceRevision !== manifest.sourceRevision ||
    frames.assemblyKey !== manifest.assemblyKey ||
    JSON.stringify(frames.scope) !== JSON.stringify(manifest.scope) ||
    frames.timelineScope !== manifest.timelineScope ||
    JSON.stringify(frames.contactSheet) !==
      JSON.stringify(manifest.contactSheet) ||
    JSON.stringify(checkedFrames) !== JSON.stringify(manifest.checkedFrames) ||
    checkedFrames.length === 0
  ) {
    throw new Error("frames.json is incomplete or belongs to another build.");
  }
  for (const frame of checkedFrames) assertCheckedFrameShape(frame);
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

  // Optional: builds made before the storyboard existed have no record of it.
  const storyboardRecord = artifacts?.[storyboardName];
  if (storyboardRecord) {
    const artifactPath = join(buildDirectory, storyboardName);
    const details = await stat(artifactPath);
    if (
      storyboardRecord.path !== storyboardName ||
      details.size !== storyboardRecord.bytes ||
      (await sha256File(artifactPath)) !== storyboardRecord.sha256
    ) {
      throw new Error(
        `${storyboardName} failed its declared size/hash integrity check.`,
      );
    }
  }

  const frames = await parseJsonObject(join(buildDirectory, "frames.json"));
  const checkedFrames = Array.isArray(frames.frames) ? frames.frames : [];
  const report = await parseJsonObject(join(buildDirectory, "report.json"));
  validatePublishedPreviewMetadata({
    manifest,
    report,
    frames,
    expectedBuildId,
  });
  assertCompleteMetadata(manifest, expectedBuildId, expectedDraft);
  assertCompleteMetadata(report, expectedBuildId, expectedDraft);
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
  for (const value of checkedFrames) {
    if (!isObject(value)) {
      throw new Error("frames.json contains an invalid checked frame.");
    }
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
  if (storyboardRecord) {
    await validateContactSheet({
      path: join(buildDirectory, storyboardName),
      layout: storyboardLayoutFor(checkedFrames.length),
      name: storyboardName,
      ffmpegExecutable: requestedFfmpeg,
      ffprobeExecutable: requestedFfprobe,
      ...(requestedContactSheetProbe
        ? { probe: requestedContactSheetProbe }
        : {}),
      ...(requestedContactSheetDecode
        ? { decode: requestedContactSheetDecode }
        : {}),
    });
  }
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
  signal?: AbortSignal,
  onPointerPrepared?: () => void | Promise<void>,
  onPointerRenameDispatched?: () => void,
  pointerOpener: typeof open = open,
  pointerRenamer: (from: string, to: string) => Promise<void> = rename,
): Promise<string> => {
  const pointerPath = join(previewDirectory, "current.json");
  const temporaryPath = join(
    previewDirectory,
    `.current-${randomUUID()}.json.tmp`,
  );
  try {
    await writeFile(temporaryPath, json(pointer), { flag: "wx" });
    throwIfAborted(signal);
    const handle = await pointerOpener(temporaryPath, "r");
    try {
      throwIfAborted(signal);
      await handle.sync();
      throwIfAborted(signal);
    } finally {
      await handle.close();
    }
    throwIfAborted(signal);
    await onPointerPrepared?.();
    throwIfAborted(signal);
    onPointerRenameDispatched?.();
    await pointerRenamer(temporaryPath, pointerPath);
    return pointerPath;
  } finally {
    await rm(temporaryPath, { force: true });
  }
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
  signal,
  onPointerPrepared,
  onPointerRenameDispatched,
  pointerOpener,
  pointerRenamer,
}: PromotionOptions): Promise<{
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
}> => {
  throwIfAborted(signal);
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
  throwIfAborted(signal);
  await rename(stagedBuildDirectory, buildDirectory);

  if (
    failureInjection === "before-pointer" ||
    process.env.NARAFRAME_TEST_FAIL_PREVIEW_PUBLISH === "before-pointer"
  ) {
    throw new Error(
      "Injected preview publication failure before pointer promotion.",
    );
  }

  throwIfAborted(signal);

  const currentPointer = await replacePointerAtomically(
    previewDirectory,
    {
      schemaVersion: 1,
      buildId,
      manifest: `builds/${buildId}/manifest.json`,
      manifestSha256,
      promotedAt: new Date().toISOString(),
    },
    signal,
    onPointerPrepared,
    onPointerRenameDispatched,
    pointerOpener,
    pointerRenamer,
  );
  return { buildDirectory, currentPointer, manifestSha256 };
};

export const publishPreviewBuild = async ({
  projectRoot,
  draft,
  issues,
  onProgress,
  failureInjection,
  signal,
  onPointerRenameDispatched,
  render = renderDraft,
  frameIntegrity,
}: PreviewBuildOptions): Promise<PublishedPreviewBuild> => {
  throwIfAborted(signal);
  const startedAt = new Date().toISOString();
  const attemptId = randomUUID();
  const buildId = `${draft.assemblyKey.slice(0, 12)}-${attemptId.slice(0, 12)}`;
  const outputRoots = await preparePreviewOutputRoots(projectRoot);
  const attemptDirectory = join(outputRoots.attempts, attemptId);
  const stagedBuildDirectory = join(attemptDirectory, "build");
  const previewDirectory = outputRoots.preview;
  await mkdir(stagedBuildDirectory, { recursive: true });
  try {
    await writeFile(join(attemptDirectory, "compiled.json"), json(draft), {
      flag: "wx",
    });

    const outputPath = join(stagedBuildDirectory, "preview.mp4");
    const rendered = await render({
      draft,
      projectRoot: outputRoots.project,
      outputPath,
      ...(onProgress ? { onProgress } : {}),
      ...(signal ? { signal } : {}),
    });
    throwIfAborted(signal);
    const allIssues = [...issues, ...rendered.visualPreflight.issues];
    const frames = selectCheckedFrames(draft, allIssues);
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
    throwIfAborted(signal);

    const verifiedMedia = await validatePreviewMedia({
      path: outputPath,
      draft,
      ffmpegExecutable: ffmpeg,
      ffprobeExecutable: ffprobe,
    });
    const integrity = await assertFrameIntegrity(
      outputPath,
      "preview.mp4",
      ffmpeg,
      frameIntegrity,
    );
    throwIfAborted(signal);
    await validateContactSheet({
      path: join(stagedBuildDirectory, "contact-sheet.png"),
      layout: contactSheet,
      ffmpegExecutable: ffmpeg,
      ffprobeExecutable: ffprobe,
    });
    const storyboard = await createStoryboard(
      outputPath,
      join(stagedBuildDirectory, storyboardName),
      frames,
      ffmpeg,
    );
    throwIfAborted(signal);
    const runtime: RuntimeMetadata = {
      node: process.version,
      os: { platform: platform(), release: release(), architecture: arch() },
      remotion: rendered.remotionVersion,
      browser: {
        executable: rendered.browserExecutable,
        version: await commandVersion(rendered.browserExecutable, [
          "--version",
        ]),
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
      ...(storyboard
        ? [artifactRecord(stagedBuildDirectory, storyboardName, "image/png")]
        : []),
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
        muted: verifiedMedia.audio === "none",
      },
      contactSheet,
      checkedFrames: frames,
      visualPreflight: {
        issues: rendered.visualPreflight.issues,
        checkedFrames: rendered.visualPreflight.frames,
      },
      varietyMetrics: computeVarietyMetrics(draft),
      readability: computeReadabilityMetrics(draft),
      frameIntegrity: integrity,
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
    ) as PreviewManifest["artifacts"];
    const manifest: PreviewManifest = { ...metadata, artifacts };
    await writeFile(
      join(stagedBuildDirectory, "manifest.json"),
      json(manifest),
      {
        flag: "wx",
      },
    );

    const promoted = await promotePreviewBuild({
      stagedBuildDirectory,
      previewDirectory,
      buildId,
      draft,
      ...(failureInjection ? { failureInjection } : {}),
      ffmpegExecutable: ffmpeg,
      ffprobeExecutable: ffprobe,
      ...(signal ? { signal } : {}),
      ...(onPointerRenameDispatched ? { onPointerRenameDispatched } : {}),
    });

    return {
      buildId,
      ...promoted,
      storyboard: storyboard !== null,
      rendered: withPublishedOutputPath(rendered, promoted.buildDirectory),
      issues: allIssues,
    };
  } finally {
    await rm(attemptDirectory, { recursive: true, force: true });
  }
};

export interface ReusablePreview {
  buildId: string;
  buildDirectory: string;
  report: PreviewMetadata;
}

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

/** What must match, besides the render inputs, for old pixels to be reusable. */
const currentRuntime = async (): Promise<{
  remotion: string;
  browser: string;
  ffmpeg: string;
}> => {
  const browser = await resolveBrowserExecutable();
  return {
    remotion: rendererRemotionVersion,
    browser: await commandVersion(browser, ["--version"]),
    ffmpeg: await commandVersion(ffmpegExecutable(), ["-version"]),
  };
};

/**
 * Finds a published build that already holds the pixels this draft would
 * render: the same assembly key and scope, the same runtime, and artifacts that
 * still match their recorded hashes. The source revision may differ, for
 * example after an editorial note, which is exactly when reuse pays off.
 */
export const findReusablePreview = async (
  projectRoot: string,
  draft: CompiledDraft,
  frames: readonly CheckedFrame[],
): Promise<ReusablePreview | null> => {
  let runtime: Awaited<ReturnType<typeof currentRuntime>>;
  try {
    runtime = await currentRuntime();
  } catch {
    return null;
  }
  const buildsDirectory = join(resolve(projectRoot), "preview", "builds");
  let names: string[];
  try {
    names = await readdir(buildsDirectory);
  } catch {
    return null;
  }

  const candidates: ReusablePreview[] = [];
  for (const name of names) {
    const directory = join(buildsDirectory, name);
    try {
      const manifest = JSON.parse(
        await readFile(join(directory, "manifest.json"), "utf8"),
      ) as PreviewManifest;
      if (
        manifest.status !== "success" ||
        manifest.mode !== "draft" ||
        manifest.assemblyKey !== draft.assemblyKey ||
        !sameJson(manifest.scope, draft.scope) ||
        !sameJson(manifest.checkedFrames, frames) ||
        manifest.runtime.remotion !== runtime.remotion ||
        manifest.runtime.browser.version !== runtime.browser ||
        manifest.runtime.ffmpeg.version !== runtime.ffmpeg
      ) {
        continue;
      }
      let intact = true;
      for (const artifact of ["preview.mp4", "contact-sheet.png"] as const) {
        const record = manifest.artifacts[artifact];
        intact &&=
          (await sha256File(join(directory, artifact))) === record.sha256;
      }
      if (intact) {
        candidates.push({
          buildId: name,
          buildDirectory: directory,
          report: manifest,
        });
      }
    } catch {
      // An incomplete or foreign directory is simply not reusable.
    }
  }
  candidates.sort((left, right) =>
    right.report.completedAt.localeCompare(left.report.completedAt),
  );
  return candidates[0] ?? null;
};

/**
 * Publishes a new build for the current source that points at an earlier
 * build's pixels. The media is linked, not re-rendered; the metadata is new
 * (build id, source revision, timestamps) and the same integrity checks run
 * before it is promoted, so the new build is as trustworthy as a rendered one.
 */
export const publishReusedPreviewBuild = async ({
  projectRoot,
  draft,
  issues,
  source,
  failureInjection,
  signal,
  onPointerRenameDispatched,
}: PreviewBuildOptions & {
  source: ReusablePreview;
}): Promise<PublishedPreviewBuild> => {
  throwIfAborted(signal);
  const startedAt = new Date().toISOString();
  const attemptId = randomUUID();
  const buildId = `${draft.assemblyKey.slice(0, 12)}-${attemptId.slice(0, 12)}`;
  const outputRoots = await preparePreviewOutputRoots(projectRoot);
  const attemptDirectory = join(outputRoots.attempts, attemptId);
  const staged = join(attemptDirectory, "build");
  await mkdir(staged, { recursive: true });
  try {
    for (const name of ["preview.mp4", "contact-sheet.png"] as const) {
      const from = join(source.buildDirectory, name);
      const to = join(staged, name);
      try {
        await link(from, to);
      } catch {
        await copyFile(from, to);
      }
    }
    // Older builds have no storyboard: make one from their video, or go without.
    let storyboard = false;
    try {
      await link(
        join(source.buildDirectory, storyboardName),
        join(staged, storyboardName),
      );
      storyboard = true;
    } catch {
      try {
        await copyFile(
          join(source.buildDirectory, storyboardName),
          join(staged, storyboardName),
        );
        storyboard = true;
      } catch {
        storyboard =
          (await createStoryboard(
            join(staged, "preview.mp4"),
            join(staged, storyboardName),
            source.report.checkedFrames,
            ffmpegExecutable(),
          )) !== null;
      }
    }
    const frames = source.report.checkedFrames;
    await writeFile(
      join(staged, "frames.json"),
      json({
        schemaVersion: 1,
        buildId,
        sourceRevision: draft.sourceRevision,
        assemblyKey: draft.assemblyKey,
        scope: draft.scope,
        timelineScope: draft.timelineScope,
        contactSheet: source.report.contactSheet,
        frames,
      }),
      { flag: "wx" },
    );
    const metadata: PreviewMetadata = {
      ...source.report,
      buildId,
      sourceRevision: draft.sourceRevision,
      label: draft.label,
      varietyMetrics: computeVarietyMetrics(draft),
      readability: computeReadabilityMetrics(draft),
      startedAt,
      completedAt: new Date().toISOString(),
      reusedFromBuildId: source.buildId,
    };
    await writeFile(join(staged, "report.json"), json(metadata), {
      flag: "wx",
    });
    const records = await Promise.all([
      artifactRecord(staged, "preview.mp4", "video/mp4"),
      artifactRecord(staged, "contact-sheet.png", "image/png"),
      artifactRecord(staged, "frames.json", "application/json"),
      artifactRecord(staged, "report.json", "application/json"),
      ...(storyboard
        ? [artifactRecord(staged, storyboardName, "image/png")]
        : []),
    ]);
    const manifest: PreviewManifest = {
      ...metadata,
      artifacts: Object.fromEntries(
        records.map((record) => [record.path, record]),
      ) as PreviewManifest["artifacts"],
    };
    await writeFile(join(staged, "manifest.json"), json(manifest), {
      flag: "wx",
    });

    const promoted = await promotePreviewBuild({
      stagedBuildDirectory: staged,
      previewDirectory: outputRoots.preview,
      buildId,
      draft,
      ...(failureInjection ? { failureInjection } : {}),
      ffmpegExecutable: ffmpegExecutable(),
      ffprobeExecutable: ffprobeExecutable(),
      ...(signal ? { signal } : {}),
      ...(onPointerRenameDispatched ? { onPointerRenameDispatched } : {}),
    });
    const rendered: RenderedDraft = {
      outputPath: join(promoted.buildDirectory, "preview.mp4"),
      durationInFrames: source.report.render.durationInFrames,
      width: source.report.render.width,
      height: source.report.render.height,
      fps: source.report.render.fps,
      browserExecutable: source.report.runtime.browser.executable,
      remotionVersion: source.report.runtime.remotion,
      visualPreflight: {
        issues: source.report.visualPreflight.issues,
        frames: [],
      },
    };
    return {
      buildId,
      ...promoted,
      storyboard,
      rendered,
      issues: [...issues, ...source.report.visualPreflight.issues],
    };
  } finally {
    await rm(attemptDirectory, { recursive: true, force: true });
  }
};
