import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import type {
  Approval,
  CompiledDraft,
  CostReport,
  Issue,
  ResolvedAudioMode,
} from "@naraframe/core";
import { type RenderedDraft, renderDraft } from "@naraframe/renderer-remotion";
import {
  assertFrameIntegrity,
  type FrameIntegrityRecord,
} from "./frame-integrity.js";
import {
  carriesAudio,
  commandVersion,
  execute,
  ffmpegExecutable,
  ffprobeExecutable,
  json,
  resolveSafeOutputDirectory,
  sha256File,
  throwIfAborted,
  validateExistingOutputAncestors,
  validatePreviewMedia,
} from "./preview-build.js";

export interface OutputRoots {
  project: string;
  attempts: string;
  output: string;
  builds: string;
}

export const prepareOutputRoots = async (
  projectRoot: string,
): Promise<OutputRoots> => {
  const project = await realpath(resolve(projectRoot));
  await Promise.all([
    validateExistingOutputAncestors(project, [".naraframe", "attempts"]),
    validateExistingOutputAncestors(project, ["output", "builds"]),
  ]);
  const attempts = await resolveSafeOutputDirectory(project, [
    ".naraframe",
    "attempts",
  ]);
  const builds = await resolveSafeOutputDirectory(project, [
    "output",
    "builds",
  ]);
  const [attemptDetails, buildDetails] = await Promise.all([
    stat(attempts),
    stat(builds),
  ]);
  if (attemptDetails.dev !== buildDetails.dev) {
    throw new Error(
      "Export attempts and builds must be directories on the same filesystem.",
    );
  }
  return { project, attempts, output: dirname(builds), builds };
};

interface FinalArtifact {
  path: string;
  bytes: number;
  sha256: string;
  mediaType: string;
}

const artifactRecord = async (
  directory: string,
  path: string,
  mediaType: string,
): Promise<FinalArtifact> => {
  const file = join(directory, path);
  return {
    path,
    bytes: (await stat(file)).size,
    sha256: await sha256File(file),
    mediaType,
  };
};

const decodeAudio = async (path: string, executable: string): Promise<void> => {
  await execute(executable, [
    "-v",
    "error",
    "-xerror",
    "-err_detect",
    "explode",
    "-i",
    path,
    "-map",
    "0:a:0",
    "-vn",
    "-f",
    "null",
    "-",
  ]);
};

export interface MediaChecks {
  probe?: (path: string) => Promise<Record<string, unknown>>;
  decode?: (path: string) => Promise<void>;
  audioDecode?: (path: string) => Promise<void>;
  ffmpegExecutable?: string;
  ffprobeExecutable?: string;
}

const verifyFinalMedia = async (
  path: string,
  draft: CompiledDraft,
  checks: MediaChecks,
): Promise<void> => {
  await validatePreviewMedia({
    path,
    draft,
    ffmpegExecutable: checks.ffmpegExecutable ?? ffmpegExecutable(),
    ffprobeExecutable: checks.ffprobeExecutable ?? ffprobeExecutable(),
    ...(checks.probe ? { probe: checks.probe } : {}),
    ...(checks.decode ? { decode: checks.decode } : {}),
  });
  // A silent export has no audio stream; the probe has already proven that.
  if (!carriesAudio(draft)) return;
  if (checks.audioDecode) await checks.audioDecode(path);
  else await decodeAudio(path, checks.ffmpegExecutable ?? ffmpegExecutable());
};

const expectManifest = (
  manifest: Record<string, unknown>,
  report: Record<string, unknown>,
  buildId: string,
  draft: CompiledDraft,
): void => {
  const agree = (key: string, expected: unknown): boolean =>
    manifest[key] === expected && report[key] === expected;
  if (
    !agree("buildId", buildId) ||
    !agree("sourceRevision", draft.sourceRevision) ||
    !agree("assemblyKey", draft.assemblyKey) ||
    !agree("mode", "final") ||
    report.status !== "success"
  ) {
    throw new Error(
      "Final build metadata is incomplete or does not match the compiled export.",
    );
  }
};

export interface PromoteFinalOptions extends MediaChecks {
  stagedBuildDirectory: string;
  outputDirectory: string;
  buildId: string;
  draft: CompiledDraft;
  failureInjection?: "before-pointer";
  signal?: AbortSignal;
}

/**
 * Publishes a complete, verified build, then switches `output/current.json`.
 * A failure at any earlier point leaves the previous build current.
 */
export const promoteFinalBuild = async (
  options: PromoteFinalOptions,
): Promise<{
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
}> => {
  const { stagedBuildDirectory, outputDirectory, buildId, draft } = options;
  throwIfAborted(options.signal);
  const buildDirectory = join(outputDirectory, "builds", buildId);
  if (
    await lstat(buildDirectory).then(
      () => true,
      () => false,
    )
  ) {
    throw new Error(
      `Immutable export build destination already exists: ${buildDirectory}.`,
    );
  }

  const manifestPath = join(stagedBuildDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
    string,
    unknown
  >;
  const report = JSON.parse(
    await readFile(join(stagedBuildDirectory, "report.json"), "utf8"),
  ) as Record<string, unknown>;
  expectManifest(manifest, report, buildId, draft);

  const artifacts = Array.isArray(manifest.artifacts)
    ? (manifest.artifacts as FinalArtifact[])
    : [];
  const names = artifacts.map((artifact) => artifact.path).sort();
  if (names.join(",") !== "final.mp4,report.json") {
    throw new Error(
      "Final build manifest must list exactly final.mp4 and report.json.",
    );
  }
  for (const artifact of artifacts) {
    const file = join(stagedBuildDirectory, artifact.path);
    const details = await stat(file);
    if (
      details.size !== artifact.bytes ||
      (await sha256File(file)) !== artifact.sha256
    ) {
      throw new Error(`${artifact.path} failed the size/hash integrity check.`);
    }
  }
  await verifyFinalMedia(
    join(stagedBuildDirectory, "final.mp4"),
    draft,
    options,
  );
  const manifestSha256 = await sha256File(manifestPath);

  throwIfAborted(options.signal);
  await rename(stagedBuildDirectory, buildDirectory);

  if (
    options.failureInjection === "before-pointer" ||
    process.env.NARAFRAME_TEST_FAIL_FINAL_PUBLISH === "before-pointer"
  ) {
    throw new Error(
      "Injected final publication failure before pointer promotion.",
    );
  }

  const pointerPath = join(outputDirectory, "current.json");
  const temporary = join(outputDirectory, `.current-${randomUUID()}.json.tmp`);
  try {
    await writeFile(
      temporary,
      json({
        schemaVersion: 1,
        buildId,
        manifest: `builds/${buildId}/manifest.json`,
        manifestSha256,
        promotedAt: new Date().toISOString(),
      }),
      { flag: "wx" },
    );
    await rename(temporary, pointerPath);
  } finally {
    await rm(temporary, { force: true });
  }
  return { buildDirectory, currentPointer: pointerPath, manifestSha256 };
};

export interface PublishFinalOptions extends MediaChecks {
  projectRoot: string;
  draft: CompiledDraft;
  approval: Approval;
  issues: readonly Issue[];
  cost: CostReport | null;
  /** The resolved audio mode, recorded in the report. */
  audioMode?: ResolvedAudioMode;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  failureInjection?: "before-pointer";
  render?: typeof renderDraft;
  /** Test seam: stands in for the frame integrity scan of the new render. */
  frameIntegrity?: (path: string) => Promise<FrameIntegrityRecord>;
}

export interface PublishedFinalBuild {
  buildId: string;
  buildDirectory: string;
  currentPointer: string;
  manifestSha256: string;
  rendered: RenderedDraft;
  issues: Issue[];
}

export const publishFinalBuild = async (
  options: PublishFinalOptions,
): Promise<PublishedFinalBuild> => {
  const { draft } = options;
  throwIfAborted(options.signal);
  const startedAt = new Date().toISOString();
  const attemptId = randomUUID();
  const buildId = `${draft.assemblyKey.slice(0, 12)}-${attemptId.slice(0, 12)}`;
  const roots = await prepareOutputRoots(options.projectRoot);
  const attemptDirectory = join(roots.attempts, `final-${attemptId}`);
  const staged = join(attemptDirectory, "build");
  await mkdir(staged, { recursive: true });
  try {
    await writeFile(join(attemptDirectory, "compiled.json"), json(draft), {
      flag: "wx",
    });
    const outputPath = join(staged, "final.mp4");
    const rendered = await (options.render ?? renderDraft)({
      draft,
      projectRoot: roots.project,
      outputPath,
      ...(options.onProgress ? { onProgress: options.onProgress } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
    throwIfAborted(options.signal);
    await verifyFinalMedia(outputPath, draft, options);
    const integrity = await assertFrameIntegrity(
      outputPath,
      "final.mp4",
      options.ffmpegExecutable ?? ffmpegExecutable(),
      options.frameIntegrity,
    );
    throwIfAborted(options.signal);

    const allIssues = [...options.issues, ...rendered.visualPreflight.issues];
    const runtime = {
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
        executable: options.ffmpegExecutable ?? ffmpegExecutable(),
        version: await commandVersion(
          options.ffmpegExecutable ?? ffmpegExecutable(),
          ["-version"],
        ),
      },
    };
    const completedAt = new Date().toISOString();
    await writeFile(
      join(staged, "report.json"),
      json({
        schemaVersion: 1,
        buildId,
        mode: "final",
        sourceRevision: draft.sourceRevision,
        assemblyKey: draft.assemblyKey,
        profile: { id: draft.profile.id, version: draft.profile.version },
        runtime,
        render: {
          width: rendered.width,
          height: rendered.height,
          fps: rendered.fps,
          durationInFrames: rendered.durationInFrames,
          codec: "h264",
          audio: carriesAudio(draft) ? "aac" : "none",
        },
        frameIntegrity: integrity,
        ...(options.audioMode ? { audioMode: options.audioMode } : {}),
        approval: options.approval,
        cost: options.cost,
        visualPreflight: {
          issues: rendered.visualPreflight.issues,
          checkedFrames: rendered.visualPreflight.frames,
        },
        issues: allIssues,
        startedAt,
        completedAt,
        status: "success",
      }),
      { flag: "wx" },
    );
    const artifacts = await Promise.all([
      artifactRecord(staged, "final.mp4", "video/mp4"),
      artifactRecord(staged, "report.json", "application/json"),
    ]);
    await writeFile(
      join(staged, "manifest.json"),
      json({
        schemaVersion: 1,
        buildId,
        mode: "final",
        sourceRevision: draft.sourceRevision,
        assemblyKey: draft.assemblyKey,
        approval: options.approval,
        artifacts,
        completedAt,
      }),
      { flag: "wx" },
    );
    const promoted = await promoteFinalBuild({
      stagedBuildDirectory: staged,
      outputDirectory: roots.output,
      buildId,
      draft,
      ...(options.failureInjection
        ? { failureInjection: options.failureInjection }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.probe ? { probe: options.probe } : {}),
      ...(options.decode ? { decode: options.decode } : {}),
      ...(options.audioDecode ? { audioDecode: options.audioDecode } : {}),
      ...(options.ffmpegExecutable
        ? { ffmpegExecutable: options.ffmpegExecutable }
        : {}),
      ...(options.ffprobeExecutable
        ? { ffprobeExecutable: options.ffprobeExecutable }
        : {}),
    });
    return { buildId, ...promoted, rendered, issues: allIssues };
  } finally {
    await rm(attemptDirectory, { recursive: true, force: true });
  }
};

/** The build `output/current.json` points to, verified only for existence. */
export const readCurrentOutput = async (
  projectRoot: string,
): Promise<{
  buildId: string;
  sourceRevision: string;
  assemblyKey: string;
} | null> => {
  try {
    const root = resolve(projectRoot);
    const pointer = JSON.parse(
      await readFile(join(root, "output", "current.json"), "utf8"),
    );
    const manifest = JSON.parse(
      await readFile(join(root, "output", String(pointer.manifest)), "utf8"),
    );
    return {
      buildId: String(pointer.buildId),
      sourceRevision: String(manifest.sourceRevision),
      assemblyKey: String(manifest.assemblyKey),
    };
  } catch {
    return null;
  }
};

const AUDIO_TOLERANCE_MS = 60;

/**
 * Audio preflight: every narration clip must decode and be as long as its
 * block declares, so a timeline built on those durations is real.
 */
export const preflightNarrationAudio = async (
  projectRoot: string,
  draft: CompiledDraft,
  probeDuration: (path: string) => Promise<number> = async (path) => {
    const result = await execute(ffprobeExecutable(), [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      path,
    ]);
    return Math.round(Number.parseFloat(result.stdout.trim()) * 1000);
  },
): Promise<Issue[]> => {
  const issues: Issue[] = [];
  for (const [index, clip] of (draft.narration?.clips ?? []).entries()) {
    const asset = draft.assets[clip.assetId];
    if (!asset || asset.kind === "png" || asset.kind === "placeholder")
      continue;
    const path = `/narration/clips/${index}`;
    let actual: number;
    try {
      actual = await probeDuration(join(projectRoot, asset.publicPath));
    } catch {
      actual = Number.NaN;
    }
    if (!Number.isFinite(actual) || actual <= 0) {
      issues.push({
        code: "AUDIO_UNREADABLE",
        severity: "error",
        responsible: "user",
        artifact: "narration.json",
        path,
        entityId: clip.blockId,
        message: `Audio for block ${clip.blockId} (${asset.publicPath}) could not be read.`,
        suggestion:
          "Replace the clip with a valid audio file and update its hash.",
      });
    } else if (Math.abs(actual - clip.durationMs) > AUDIO_TOLERANCE_MS) {
      issues.push({
        code: "AUDIO_DURATION_MISMATCH",
        severity: "error",
        responsible: "agent",
        artifact: "narration.json",
        path,
        entityId: clip.blockId,
        message: `Block ${clip.blockId} declares ${clip.durationMs} ms but its audio is ${actual} ms.`,
        suggestion:
          "Set audioDurationMs to the measured length and re-check the phrase timing.",
      });
    }
  }
  return issues;
};

/** Mean level of an audio file in dBFS, or null when it cannot be measured. */
export const measureMeanLevel = async (
  path: string,
): Promise<number | null> => {
  try {
    const result = await execute(ffmpegExecutable(), [
      "-v",
      "info",
      "-i",
      path,
      "-af",
      "volumedetect",
      "-vn",
      "-f",
      "null",
      "-",
    ]);
    const match = /mean_volume: (-?[\d.]+) dB/.exec(result.stderr);
    return match?.[1] ? Number.parseFloat(match[1]) : null;
  } catch {
    return null;
  }
};

/**
 * Measured on the owner's own material: narration averages about -17 dBFS.
 * A bed less than 6 dB under that competes with the voice; more than 20 dB
 * under it is not heard at all, which also makes its fades and ducking
 * inaudible. Both ends are worth saying out loud.
 */
export const MUSIC_HEADROOM_DB = 6;
export const MUSIC_FLOOR_DB = 20;
/** With no narration to compare against, a bed this quiet is simply silent. */
export const MUSIC_SILENT_DBFS = -45;

const db = (gain: number): number => 20 * Math.log10(Math.max(gain, 1e-6));

/**
 * Music and effects must decode, and a music bed that is not looped should
 * cover the video, or the tail plays in silence without anyone noticing.
 */
export const preflightSoundtrackAudio = async (
  projectRoot: string,
  draft: CompiledDraft,
  probeDuration: (path: string) => Promise<number> = async (path) => {
    await decodeAudio(path, ffmpegExecutable());
    const result = await execute(ffprobeExecutable(), [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      path,
    ]);
    return Math.round(Number.parseFloat(result.stdout.trim()) * 1000);
  },
  measureLevel: (path: string) => Promise<number | null> = measureMeanLevel,
): Promise<Issue[]> => {
  const soundtrack = draft.soundtrack;
  if (!soundtrack) return [];
  const issues: Issue[] = [];
  const entries = [
    ...(soundtrack.music
      ? [{ assetId: soundtrack.music.assetId, path: "/soundtrack/music" }]
      : []),
    ...soundtrack.sfx.map((effect, index) => ({
      assetId: effect.assetId,
      path: `/soundtrack/sfx/${index}`,
    })),
  ];
  for (const entry of entries) {
    const asset = draft.assets[entry.assetId];
    if (!asset || asset.kind === "png" || asset.kind === "placeholder")
      continue;
    let actual: number;
    try {
      actual = await probeDuration(join(projectRoot, asset.publicPath));
    } catch {
      actual = Number.NaN;
    }
    if (!Number.isFinite(actual) || actual <= 0) {
      issues.push({
        code: "AUDIO_UNREADABLE",
        severity: "error",
        responsible: "user",
        artifact: "naraframe.json",
        path: entry.path,
        message: `Audio ${asset.publicPath} could not be decoded.`,
        suggestion: "Replace it with a valid audio file and update its hash.",
      });
      continue;
    }
    const music = soundtrack.music;
    if (music && entry.path === "/soundtrack/music" && !music.loop) {
      const playable =
        actual - Math.round((music.trimStartFrames * 1000) / draft.fps);
      const videoMs = Math.round((draft.totalFrames * 1000) / draft.fps);
      if (playable < videoMs - AUDIO_TOLERANCE_MS) {
        issues.push({
          code: "MUSIC_SHORTER_THAN_VIDEO",
          severity: "warning",
          responsible: "agent",
          artifact: "naraframe.json",
          path: entry.path,
          message: `Music has ${playable} ms after trimming but the video runs ${videoMs} ms, so it ends early.`,
          suggestion:
            "Set loop to true, use a longer track, or accept the silence.",
        });
      }
    }
  }

  const music = soundtrack.music;
  const musicAsset = music ? draft.assets[music.assetId] : undefined;
  if (
    music &&
    musicAsset &&
    musicAsset.kind !== "png" &&
    musicAsset.kind !== "placeholder"
  ) {
    const bed = await measureLevel(join(projectRoot, musicAsset.publicPath));
    if (bed !== null) {
      // What the viewer actually hears: the track's own level, the configured
      // volume, and the ducking that applies wherever narration plays.
      const played = bed + db(music.volume);
      const underSpeech = played + db(music.duck?.volume ?? 1);
      const speech: number[] = [];
      for (const clip of draft.narration?.clips ?? []) {
        const asset = draft.assets[clip.assetId];
        if (!asset || asset.kind === "png" || asset.kind === "placeholder")
          continue;
        const level = await measureLevel(join(projectRoot, asset.publicPath));
        if (level !== null) speech.push(level);
      }
      const warn = (code: string, message: string, suggestion: string) =>
        issues.push({
          code,
          severity: "warning",
          responsible: "agent",
          artifact: "naraframe.json",
          path: "/soundtrack/music",
          message,
          suggestion,
        });

      if (speech.length > 0) {
        const voice =
          speech.reduce((sum, value) => sum + value, 0) / speech.length;
        const gap = voice - underSpeech;
        if (gap < MUSIC_HEADROOM_DB) {
          warn(
            "MUSIC_MASKS_NARRATION",
            `Under speech the music is at ${underSpeech.toFixed(1)} dB against a ${voice.toFixed(1)} dB voice, only ${gap.toFixed(1)} dB apart.`,
            "Lower the music volume or duck it further.",
          );
        } else if (gap > MUSIC_FLOOR_DB) {
          warn(
            "MUSIC_INAUDIBLE",
            `Under speech the music is ${gap.toFixed(1)} dB below the voice, so it cannot be heard and neither can its fades or ducking.`,
            "Raise the music volume, use a louder track, or duck it less.",
          );
        }
      } else if (played < MUSIC_SILENT_DBFS) {
        warn(
          "MUSIC_INAUDIBLE",
          `The track averages ${bed.toFixed(1)} dB and plays at ${played.toFixed(1)} dB, which is silent in practice.`,
          "Raise the music volume or use a louder track.",
        );
      }
    }
  }
  return issues;
};
