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
} from "@naraframe/core";
import { type RenderedDraft, renderDraft } from "@naraframe/renderer-remotion";
import {
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
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  failureInjection?: "before-pointer";
  render?: typeof renderDraft;
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
          audio: "aac",
        },
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
