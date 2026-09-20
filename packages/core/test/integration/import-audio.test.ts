import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importPreparedAudio } from "@naraframe/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ffmpeg = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";
const ffprobe = process.env.FFPROBE_PATH ?? "/opt/homebrew/bin/ffprobe";
const available = existsSync(ffmpeg) && existsSync(ffprobe);

/** Builds a clip from alternating silence/tone seconds, e.g. [0.4, 1, 0.6, 1.2, 0.3]. */
const synthesize = (path: string, segments: number[]): void => {
  const inputs = segments.map((seconds, index) =>
    index % 2 === 0
      ? `anullsrc=r=24000:cl=mono:d=${seconds}[s${index}]`
      : `sine=f=440:r=24000:d=${seconds}[s${index}]`,
  );
  const labels = segments.map((_, index) => `[s${index}]`).join("");
  execFileSync(ffmpeg, [
    "-y",
    "-loglevel",
    "error",
    "-filter_complex",
    `${inputs.join(";")};${labels}concat=n=${segments.length}:v=0:a=1[out]`,
    "-map",
    "[out]",
    path,
  ]);
};

describe.skipIf(!available)("importPreparedAudio", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "naraframe-import-"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const run = (file: string, text: string) =>
    importPreparedAudio({
      audioPath: join(dir, file),
      text,
      blockId: "blk",
      outputDirectory: join(dir, "out"),
      ffmpegPath: ffmpeg,
      ffprobePath: ffprobe,
    });

  const near = (
    actual: number | undefined,
    expected: number,
    tolerance = 40,
  ) => {
    expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
    expect(actual).toBeLessThanOrEqual(expected + tolerance);
  };

  it("places two sentences from measured pauses and stores a content-addressed copy", async () => {
    synthesize(join(dir, "two.wav"), [0.4, 1, 0.6, 1.2, 0.3]);
    const result = await run("two.wav", "Kalimat satu. Kalimat dua.");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { value } = result;
    near(value.durationMs, 3500);
    near(value.phrases[0]?.startMs, 400);
    near(value.phrases[0]?.endMs, 1400);
    near(value.phrases[1]?.startMs, 2000);
    near(value.phrases[1]?.endMs, 3200);
    expect(value.phrases.map((p) => p.id)).toEqual(["blk-p1", "blk-p2"]);
    expect(value.timing).toBe("silence-inferred");
    expect(value.audioSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await readdir(join(dir, "out"))).toEqual([
      `${value.audioSha256}.wav`,
    ]);
  });

  it("uses the longest pauses as sentence boundaries, not shorter in-sentence ones", async () => {
    // 0.3 s lead-in, 0.8 s tone, 0.3 s comma-like pause, 0.6 s tone, 0.8 s sentence break, tone
    synthesize(join(dir, "commas.wav"), [0.3, 0.8, 0.3, 0.6, 0.8, 0.3]);
    const result = await run("commas.wav", "Halo dunia, apa kabar. Baik.");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Boundary is the 0.8 s gap starting at 0.3 + 0.8 + 0.3 + 0.6 = 2.0 s.
    near(result.value.phrases[0]?.endMs, 2000);
    near(result.value.phrases[1]?.startMs, 2800);
  });

  it("fails with PHRASE_TIMING_UNRESOLVED when there are fewer pauses than sentence boundaries", async () => {
    synthesize(join(dir, "one.wav"), [0.3, 2, 0.3]);
    const result = await run("one.wav", "Satu. Dua. Tiga.");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("PHRASE_TIMING_UNRESOLVED");
  });

  it("times a single sentence between its leading and trailing silence", async () => {
    synthesize(join(dir, "solo.wav"), [0.5, 1.5, 0.5]);
    const result = await run("solo.wav", "Hanya satu kalimat.");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phrases).toHaveLength(1);
    near(result.value.phrases[0]?.startMs, 500);
    near(result.value.phrases[0]?.endMs, 2000);
  });

  it("rejects empty text", async () => {
    synthesize(join(dir, "empty.wav"), [0.3, 1, 0.3]);
    const result = await run("empty.wav", "   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("NARRATION_TEXT_EMPTY");
  });
});
