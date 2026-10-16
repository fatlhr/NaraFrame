import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertFrameIntegrity,
  checkFrameIntegrity,
  FRAME_INTEGRITY_METHOD,
  isFrameIntegrityError,
} from "../../src/frame-integrity.js";

const run = promisify(execFile);
const ffmpeg =
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

const WIDTH = 108;
const HEIGHT = 192;
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

/** A grey frame: a left-to-right ramp, or vertical bars for the odd one out. */
const frame = (kind: "ramp" | "bars"): Buffer => {
  const pixels = Buffer.alloc(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      pixels[y * WIDTH + x] =
        kind === "ramp"
          ? Math.round((x / (WIDTH - 1)) * 200)
          : Math.floor(x / 12) % 2 === 0
            ? 255
            : 0;
    }
  }
  return pixels;
};

const synthesize = async (kinds: Array<"ramp" | "bars">): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-integrity-"));
  roots.push(root);
  const raw = join(root, "frames.gray");
  const frames = { ramp: frame("ramp"), bars: frame("bars") };
  await writeFile(raw, Buffer.concat(kinds.map((kind) => frames[kind])));
  const output = join(root, "synthetic.mp4");
  await run(ffmpeg, [
    "-v",
    "error",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "gray",
    "-video_size",
    `${WIDTH}x${HEIGHT}`,
    "-framerate",
    "30",
    "-i",
    raw,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "12",
    output,
  ]);
  return output;
};

describe.skipIf(!existsSync(ffmpeg))("checkFrameIntegrity", () => {
  it("reports the one frame that differs from identical neighbours", async () => {
    const kinds = Array<"ramp" | "bars">(30).fill("ramp");
    kinds[17] = "bars";
    const path = await synthesize(kinds);

    const result = await checkFrameIntegrity(path, ffmpeg);

    expect(result.method).toBe(FRAME_INTEGRITY_METHOD);
    expect(result.frames).toBe(30);
    expect(result.outliers.map(({ frame: index }) => index)).toEqual([17]);
    await expect(
      assertFrameIntegrity(path, "preview.mp4", ffmpeg),
    ).rejects.toSatisfy(isFrameIntegrityError);
  });

  it("reports nothing for a clean video and a hard cut", async () => {
    const clean = await synthesize(Array<"ramp" | "bars">(30).fill("ramp"));
    expect(await checkFrameIntegrity(clean, ffmpeg)).toEqual({
      method: FRAME_INTEGRITY_METHOD,
      frames: 30,
      outliers: [],
    });

    const cut = await synthesize([
      ...Array<"ramp" | "bars">(15).fill("ramp"),
      ...Array<"ramp" | "bars">(15).fill("bars"),
    ]);
    expect((await checkFrameIntegrity(cut, ffmpeg)).outliers).toEqual([]);
    await expect(
      assertFrameIntegrity(cut, "final.mp4", ffmpeg),
    ).resolves.toMatchObject({ frames: 30, outliers: [] });
  });

  it("rejects a file ffmpeg cannot decode", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-integrity-"));
    roots.push(root);
    const path = join(root, "broken.mp4");
    await writeFile(path, "not a video");
    await expect(checkFrameIntegrity(path, ffmpeg)).rejects.toThrow("exited");
  });
});
