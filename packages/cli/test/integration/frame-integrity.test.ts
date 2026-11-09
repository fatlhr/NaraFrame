import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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

const ffprobe =
  process.env.NARAFRAME_FFPROBE_EXECUTABLE ?? "/opt/homebrew/bin/ffprobe";

const WIDTH = 108;
const HEIGHT = 192;
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

type FrameKind = "ramp" | "bars" | "speck" | "tint";

/** A grey ramp, contrasting bars, or a small or broad change to the ramp. */
const frame = (kind: FrameKind): Buffer => {
  const pixels = Buffer.alloc(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const level = Math.round((x / (WIDTH - 1)) * 200);
      const inSpeck = x >= 30 && x < 38 && y >= 40 && y < 48;
      if (kind === "bars") {
        pixels[y * WIDTH + x] = Math.floor(x / 12) % 2 === 0 ? 255 : 0;
      } else {
        pixels[y * WIDTH + x] =
          level + (kind === "tint" || (kind === "speck" && inSpeck) ? 4 : 0);
      }
    }
  }
  return pixels;
};

const synthesize = async (kinds: FrameKind[], crf = "12"): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-integrity-"));
  roots.push(root);
  const raw = join(root, "frames.gray");
  const frames = {
    ramp: frame("ramp"),
    bars: frame("bars"),
    speck: frame("speck"),
    tint: frame("tint"),
  };
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
    crf,
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

describe.skipIf(!existsSync(ffmpeg) || !existsSync(ffprobe))(
  "release raster comparison",
  () => {
    const script = fileURLToPath(
      new URL("../../../../scripts/check-release-frames.mjs", import.meta.url),
    );
    const compare = async (
      baseline: string,
      candidate: string,
      ...args: string[]
    ) => {
      const invocation = [script, baseline, candidate, ...args];
      const env = {
        ...process.env,
        NARAFRAME_FFMPEG_EXECUTABLE: ffmpeg,
        NARAFRAME_FFPROBE_EXECUTABLE: ffprobe,
      };
      try {
        const { stdout } = await run(process.execPath, invocation, { env });
        return JSON.parse(stdout);
      } catch (error) {
        const failure = error as { code?: number; stdout?: string };
        if (failure.code !== 1 || !failure.stdout) throw error;
        return JSON.parse(failure.stdout);
      }
    };

    it("accepts a small local difference only in the specified frame window", async () => {
      const kinds = Array<FrameKind>(30).fill("ramp");
      const clean = await synthesize(kinds, "0");
      kinds[17] = "speck";
      const changed = await synthesize(kinds, "0");

      await expect(compare(clean, clean)).resolves.toMatchObject({
        passed: true,
        frames: 30,
        differentFrames: 0,
      });
      await expect(compare(clean, changed)).resolves.toMatchObject({
        passed: false,
        firstRejections: [17],
      });
      await expect(
        compare(clean, changed, "--tolerate=17:18"),
      ).resolves.toMatchObject({
        passed: true,
        differentFrames: 1,
      });
    });

    it("rejects the corrupt frame and a broad tint inside a tolerated window", async () => {
      const kinds = Array<FrameKind>(30).fill("ramp");
      const clean = await synthesize(kinds, "0");
      kinds[17] = "bars";
      const corrupt = await synthesize(kinds, "0");
      kinds[17] = "tint";
      const tint = await synthesize(kinds, "0");

      await expect(
        compare(clean, corrupt, "--tolerate=17:18"),
      ).resolves.toMatchObject({
        passed: false,
        firstRejections: [17],
      });
      await expect(
        compare(clean, tint, "--tolerate=17:18"),
      ).resolves.toMatchObject({
        passed: false,
        firstRejections: [17],
        peak: { Y: { MAX: 4 } },
      });
    });
  },
);
