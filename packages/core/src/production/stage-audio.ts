import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  checkAudioModeConflicts,
  resolveAudioMode,
} from "../compiler/audio-mode.js";
import { preparedTimingHash } from "../compiler/prepared-audio.js";
import { narrationTextHash } from "../compiler/voice-binding.js";
import { loadPlanProject } from "../io/load-project.js";
import { type Issue, issuesFromZodError, type Result } from "../model/issue.js";
import { hashValue } from "../project/hash.js";
import { linkTree } from "../revision/store.js";
import type { Asset } from "../schema/asset.js";
import { NarrationSchema } from "../schema/narration.js";
import { PreparedTimingPackageSchema } from "../schema/prepared-audio.js";

const run = promisify(execFile);
const issue = (code: string, message: string): Issue => ({
  code,
  message,
  severity: "error",
  responsible: "user",
  artifact: "timing package",
  path: "/",
  suggestion:
    "Correct the package/media, preserve the intended audio mode, and stage again. Listening review is required for production.",
});
export interface StageAudioOptions {
  root: string;
  from: string;
  timing: string;
  block: string;
  ffprobePath?: string;
}
export interface StagedAudio {
  staging: string;
  sourceRevision: string;
  files: string[];
  blockId: string;
  audioSha256: string;
  audioDurationMs: number;
  verification: "pending" | "verified";
}

/** Capture once, probe those bytes, and stage an ordinary guarded edit. */
export const stagePreparedAudio = async (
  options: StageAudioOptions,
): Promise<Result<StagedAudio>> => {
  let staging: string | undefined;
  let capture: string | undefined;
  const fail = (code: string, message: string): Result<StagedAudio> => ({
    ok: false,
    issues: [issue(code, message)],
  });
  try {
    const root = resolve(options.root);
    const loaded = await loadPlanProject(root);
    if (!loaded.ok) return loaded;
    const source = loaded.value.source;
    const block = source.narration?.blocks.find((b) => b.id === options.block);
    if (!block || !source.narration)
      return fail(
        "PREPARED_AUDIO_BLOCK_UNKNOWN",
        `Unknown narration block ${options.block}.`,
      );
    const kind = extname(options.from).slice(1).toLowerCase();
    if (kind !== "mp3" && kind !== "wav" && kind !== "m4a")
      return fail(
        "PREPARED_AUDIO_FORMAT_UNSUPPORTED",
        "Use a local MP3, WAV or M4A audio master.",
      );
    const [bytes, packageBytes] = await Promise.all([
      readFile(resolve(options.from)),
      readFile(resolve(options.timing)),
    ]);
    const parsed = PreparedTimingPackageSchema.safeParse(
      JSON.parse(packageBytes.toString("utf8")),
    );
    if (!parsed.success)
      return {
        ok: false,
        issues: issuesFromZodError(parsed.error, options.timing),
      };
    const timing = parsed.data;
    const audioSha256 = createHash("sha256").update(bytes).digest("hex");
    if (timing.audioSha256 !== audioSha256)
      return fail(
        "PREPARED_AUDIO_HASH_MISMATCH",
        "Timing package audioSha256 differs from the captured master bytes.",
      );
    if (narrationTextHash(timing.text) !== narrationTextHash(block.text))
      return fail(
        "PREPARED_AUDIO_TEXT_MISMATCH",
        "Timing package text differs from the intended block speech. Edit the intended text explicitly first.",
      );
    capture = await mkdtemp(join(tmpdir(), "naraframe-audio-capture-"));
    const capturedPath = join(capture, `master.${kind}`);
    await writeFile(capturedPath, bytes);
    let audioDurationMs: number;
    try {
      const ffprobe =
        options.ffprobePath ??
        process.env.NARAFRAME_FFPROBE_EXECUTABLE ??
        (process.env.NARAFRAME_FFMPEG_EXECUTABLE
          ? join(dirname(process.env.NARAFRAME_FFMPEG_EXECUTABLE), "ffprobe")
          : "ffprobe");
      const { stdout } = await run(ffprobe, [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type",
        "-of",
        "json",
        capturedPath,
      ]);
      const probe = JSON.parse(stdout) as {
        format?: { duration?: string };
        streams?: { codec_type?: string }[];
      };
      audioDurationMs = Math.round(Number(probe.format?.duration) * 1000);
      if (
        !Number.isSafeInteger(audioDurationMs) ||
        audioDurationMs <= 0 ||
        !probe.streams?.some((s) => s.codec_type === "audio") ||
        probe.streams.some((s) => s.codec_type === "video")
      )
        return fail(
          "PREPARED_AUDIO_UNREADABLE",
          "Captured file must contain measurable audio and no video stream.",
        );
    } catch {
      return fail(
        "PREPARED_AUDIO_UNREADABLE",
        "The captured master could not be probed. Check the media and configured FFprobe executable.",
      );
    }
    const receipt = {
      schemaVersion: 1 as const,
      units: timing.units,
      audioSha256,
      textSha256: narrationTextHash(block.text),
      timingSha256: preparedTimingHash({
        audioDurationMs,
        phrases: timing.phrases,
      }),
      audioDurationMs,
      alignment: timing.alignment,
      uncertainties: timing.uncertainties,
      verification: timing.verification,
    };
    const assetId = `prepared-${block.id}-${audioSha256}`;
    const audioPath = `assets/audio/${audioSha256}.${kind}`;
    const asset: Asset = {
      id: assetId,
      status: "ready",
      kind,
      path: audioPath,
      sha256: audioSha256,
      origin: {
        type: "user",
        source: "Captured prepared audio master",
        ...(timing.license ? { license: timing.license } : {}),
      },
      ...(timing.verification.state === "verified"
        ? {
            generation: {
              textSha256: receipt.textSha256,
              ...(timing.voiceStyleSignature
                ? { voiceStyleSignature: timing.voiceStyleSignature }
                : {}),
            },
          }
        : {}),
    };
    // Same bytes may already belong to another block with a different binding.
    const existing = source.assets.assets.find((a) => a.id === assetId);
    if (
      existing &&
      hashValue(existing) !== hashValue(asset) &&
      source.narration.blocks.some(
        (b) =>
          b.id !== block.id &&
          "audioAssetId" in b &&
          b.audioAssetId === assetId,
      )
    )
      return fail(
        "PREPARED_AUDIO_ASSET_CONFLICT",
        "Captured master is shared by another block with a different receipt; resolve that existing binding explicitly.",
      );
    const { prepared: _prepared, ...blockBase } =
      "prepared" in block ? block : { ...block, prepared: undefined };
    const narration = {
      ...source.narration,
      blocks: source.narration.blocks.map((b) =>
        b.id === block.id
          ? {
              ...blockBase,
              audioAssetId: assetId,
              audioDurationMs,
              pauseAfterMs: timing.pauseAfterMs,
              phrases: timing.phrases,
              prepared: receipt,
            }
          : b,
      ),
    };
    const validNarration = NarrationSchema.safeParse(narration);
    if (!validNarration.success)
      return {
        ok: false,
        issues: issuesFromZodError(validNarration.error, "narration.json"),
      };
    const assets = {
      ...source.assets,
      assets: [...source.assets.assets.filter((a) => a.id !== assetId), asset],
    };
    const proposed = { ...source, narration: validNarration.data, assets };
    const mode = resolveAudioMode(proposed);
    const conflicts = checkAudioModeConflicts(proposed, mode);
    if (mode.mode !== "voice")
      conflicts.push(
        issue(
          "PREPARED_AUDIO_MODE_CONFLICT",
          `Prepared narration conflicts with ${mode.mode} audio mode; change owner intent explicitly before import.`,
        ),
      );
    if (conflicts.length) return { ok: false, issues: conflicts };
    const files = new Map<string, Buffer>([
      [audioPath, bytes],
      [
        "narration.json",
        Buffer.from(`${JSON.stringify(narration, null, 2)}\n`),
      ],
      [
        "assets/manifest.json",
        Buffer.from(`${JSON.stringify(assets, null, 2)}\n`),
      ],
    ]);
    staging = await mkdtemp(join(tmpdir(), "naraframe-audio-stage-"));
    const candidate = await mkdtemp(join(tmpdir(), "naraframe-audio-check-"));
    try {
      await linkTree(root, candidate);
      for (const [path, file] of files) {
        await mkdir(dirname(join(staging, path)), { recursive: true });
        await writeFile(join(staging, path), file);
        await mkdir(dirname(join(candidate, path)), { recursive: true });
        await rm(join(candidate, path), { force: true });
        await writeFile(join(candidate, path), file);
      }
      const checked = await loadPlanProject(candidate);
      if (!checked.ok) {
        await rm(staging, { recursive: true, force: true });
        staging = undefined;
        return checked;
      }
    } finally {
      await rm(candidate, { recursive: true, force: true });
    }
    return {
      ok: true,
      issues: [],
      value: {
        staging,
        sourceRevision: hashValue(source),
        files: [...files.keys()].sort(),
        blockId: block.id,
        audioSha256,
        audioDurationMs,
        verification: timing.verification.state,
      },
    };
  } catch (error) {
    if (staging) await rm(staging, { recursive: true, force: true });
    return fail(
      "PREPARED_AUDIO_INPUT_INVALID",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (capture) await rm(capture, { recursive: true, force: true });
  }
};
