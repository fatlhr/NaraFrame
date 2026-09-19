import { execFile } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { promisify } from "node:util";
import type { Issue, Result } from "../model/issue.js";
import { sha256File } from "../project/hash.js";

const run = promisify(execFile);

export interface ImportAudioOptions {
  audioPath: string;
  /** Intended spoken text of the whole block. */
  text: string;
  blockId: string;
  outputDirectory: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  silenceNoiseDb?: number;
  minSilenceSeconds?: number;
}

export interface ImportedPhrase {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface ImportedAudio {
  audioSha256: string;
  /** Content-addressed copy inside outputDirectory. */
  audioPath: string;
  durationMs: number;
  phrases: ImportedPhrase[];
  /** Phrase boundaries come from measured silence, never from a guess at words. */
  timing: "silence-inferred";
}

interface Silence {
  start: number;
  end: number;
}

const issue = (code: string, message: string): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: "narration.json",
  path: "/",
  message,
  suggestion:
    "Provide one clip per block whose pauses separate its sentences, or supply phrase timing manually.",
});

const parseSilences = (stderr: string, durationSeconds: number): Silence[] => {
  const silences: Silence[] = [];
  let open: number | undefined;
  for (const line of stderr.split("\n")) {
    const start = /silence_start: (-?[\d.]+)/.exec(line);
    if (start?.[1]) {
      open = Math.max(0, Number.parseFloat(start[1]));
      continue;
    }
    const end = /silence_end: ([\d.]+)/.exec(line);
    if (end?.[1] && open !== undefined) {
      silences.push({ start: open, end: Number.parseFloat(end[1]) });
      open = undefined;
    }
  }
  if (open !== undefined) {
    silences.push({ start: open, end: durationSeconds });
  }
  return silences;
};

const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

/**
 * Imports a clip made elsewhere (for example with an online TTS tool). The
 * duration is probed, the file is stored under its hash, and each sentence is
 * placed using the longest measured pauses, so timing is observed rather than
 * estimated. Fails when the audio does not contain enough pauses.
 */
export const importPreparedAudio = async (
  options: ImportAudioOptions,
): Promise<Result<ImportedAudio>> => {
  const ffmpeg = options.ffmpegPath ?? "ffmpeg";
  const ffprobe = options.ffprobePath ?? "ffprobe";
  const sentences = splitSentences(options.text);
  if (sentences.length === 0) {
    return {
      ok: false,
      issues: [issue("NARRATION_TEXT_EMPTY", "Block text is empty.")],
    };
  }

  const { stdout } = await run(ffprobe, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    options.audioPath,
  ]);
  const durationSeconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return {
      ok: false,
      issues: [
        issue("AUDIO_UNREADABLE", "The audio file has no measurable duration."),
      ],
    };
  }
  const durationMs = Math.round(durationSeconds * 1000);

  const { stderr } = await run(ffmpeg, [
    "-hide_banner",
    "-nostats",
    "-i",
    options.audioPath,
    "-af",
    `silencedetect=noise=${options.silenceNoiseDb ?? -35}dB:d=${options.minSilenceSeconds ?? 0.2}`,
    "-f",
    "null",
    "-",
  ]);
  const silences = parseSilences(stderr, durationSeconds);

  const leading = silences.find((silence) => silence.start === 0);
  const trailing = silences.find(
    (silence) => silence.end >= durationSeconds - 0.01 && silence !== leading,
  );
  const inner = silences.filter(
    (silence) => silence !== leading && silence !== trailing,
  );

  const boundaryCount = sentences.length - 1;
  if (inner.length < boundaryCount) {
    return {
      ok: false,
      issues: [
        issue(
          "PHRASE_TIMING_UNRESOLVED",
          `Block ${options.blockId} has ${sentences.length} sentences but only ${inner.length} inner pauses, so sentence boundaries cannot be measured.`,
        ),
      ],
    };
  }

  const boundaries = [...inner]
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, boundaryCount)
    .sort((a, b) => a.start - b.start);

  const speechStart = leading ? leading.end : 0;
  const speechEnd = trailing ? trailing.start : durationSeconds;
  const toMs = (seconds: number): number => Math.round(seconds * 1000);

  const phrases: ImportedPhrase[] = sentences.map((text, index) => {
    const previous = boundaries[index - 1];
    const next = boundaries[index];
    return {
      id: `${options.blockId}-p${index + 1}`,
      text,
      startMs: toMs(previous ? previous.end : speechStart),
      endMs: Math.min(durationMs, toMs(next ? next.start : speechEnd)),
    };
  });

  const audioSha256 = await sha256File(options.audioPath);
  await mkdir(options.outputDirectory, { recursive: true });
  const stored = join(
    options.outputDirectory,
    `${audioSha256}${extname(options.audioPath).toLowerCase()}`,
  );
  await copyFile(options.audioPath, stored);

  return {
    ok: true,
    value: {
      audioSha256,
      audioPath: stored,
      durationMs,
      phrases,
      timing: "silence-inferred",
    },
    issues: [],
  };
};
