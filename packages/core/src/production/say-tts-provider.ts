import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { sha256File } from "../project/hash.js";
import type {
  TtsPhrase,
  TtsProvider,
  TtsSynthesisRequest,
} from "./tts-provider.js";

const run = promisify(execFile);

export interface SayTtsProviderOptions {
  /** Directory where finished block clips are written. */
  outputDirectory: string;
  /** macOS voice name; Damayanti is the built-in Indonesian voice. */
  voice?: string;
  currency?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
}

const splitPhrases = (text: string): string[] =>
  text
    .split(/(?<=[.!?,])\s+/u)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0);

/**
 * Local, offline, zero-cost TTS through macOS `say`. Every phrase is spoken
 * as its own clip so its duration is measured, not guessed; clips are then
 * concatenated into one block clip with real phrase timestamps.
 */
export const createSayTtsProvider = (
  options: SayTtsProviderOptions,
): TtsProvider => {
  const voice = options.voice ?? "Damayanti";
  const currency = options.currency ?? "IDR";
  const ffmpeg = options.ffmpegPath ?? "ffmpeg";
  const ffprobe = options.ffprobePath ?? "ffprobe";
  const zero = { amount: 0, currency };

  const probeMs = async (path: string): Promise<number> => {
    const { stdout } = await run(ffprobe, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      path,
    ]);
    return Math.round(Number.parseFloat(stdout.trim()) * 1000);
  };

  return {
    id: "macos-say",
    estimate: () => zero,
    synthesize: async (request: TtsSynthesisRequest) => {
      await mkdir(options.outputDirectory, { recursive: true });
      const workDir = await mkdtemp(join(options.outputDirectory, ".say-"));
      try {
        const texts = splitPhrases(request.text);
        const clips: string[] = [];
        const phrases: TtsPhrase[] = [];
        let cursor = 0;

        for (const [index, text] of texts.entries()) {
          const textFile = join(workDir, `p${index}.txt`);
          const clip = join(workDir, `p${index}.wav`);
          await writeFile(textFile, text, "utf8");
          await run("say", [
            "-v",
            voice,
            "-f",
            textFile,
            "-o",
            clip,
            "--data-format=LEI16@22050",
          ]);
          const durationMs = await probeMs(clip);
          phrases.push({ text, startMs: cursor, durationMs });
          cursor += durationMs;
          clips.push(clip);
        }

        const listFile = join(workDir, "list.txt");
        await writeFile(
          listFile,
          clips.map((clip) => `file '${clip}'`).join("\n"),
          "utf8",
        );
        const output = join(workDir, "block.wav");
        await run(ffmpeg, [
          "-y",
          "-loglevel",
          "error",
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          listFile,
          "-c",
          "copy",
          output,
        ]);

        const audioSha256 = await sha256File(output);
        const finalPath = join(options.outputDirectory, `${audioSha256}.wav`);
        await writeFile(finalPath, await readFile(output));

        return {
          audioSha256,
          audioPath: finalPath,
          durationMs: await probeMs(finalPath),
          phrases,
          cost: zero,
        };
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    },
  };
};
