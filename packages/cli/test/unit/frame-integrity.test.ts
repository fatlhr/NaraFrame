import { describe, expect, it } from "vitest";
import {
  assertFrameIntegrity,
  FRAME_INTEGRITY_METHOD,
  type FrameIntegrityError,
  findOutlierFrames,
  isFrameIntegrityError,
} from "../../src/frame-integrity.js";

const WIDTH = 6;
const HEIGHT = 8;

/** One frame per value, each frame a flat grey of that level. */
const flat = (levels: readonly number[]): Uint8Array => {
  const pixels = new Uint8Array(levels.length * WIDTH * HEIGHT);
  levels.forEach((level, index) => {
    pixels.fill(level, index * WIDTH * HEIGHT, (index + 1) * WIDTH * HEIGHT);
  });
  return pixels;
};

const outliersOf = (levels: readonly number[]): number[] =>
  findOutlierFrames(flat(levels), WIDTH, HEIGHT).map(({ frame }) => frame);

describe("findOutlierFrames", () => {
  it("flags a frame that differs from both neighbours while they match", () => {
    expect(outliersOf([20, 20, 200, 20, 20])).toEqual([2]);
    const [only] = findOutlierFrames(
      flat([20, 20, 200, 20, 20]),
      WIDTH,
      HEIGHT,
    );
    expect(only).toEqual({ frame: 2, dp: 180, dn: 180, dpn: 0 });
  });

  it("flags a repeated top band the way the renderer produced it", () => {
    const frameSize = WIDTH * HEIGHT;
    const good = new Uint8Array(frameSize);
    for (let row = 0; row < HEIGHT; row += 1) {
      good.fill(row * 30, row * WIDTH, (row + 1) * WIDTH);
    }
    const bad = new Uint8Array(frameSize);
    for (let row = 0; row < HEIGHT; row += 1) {
      // The top three rows repeated below, the rest blank.
      bad.fill(row < 6 ? (row % 3) * 30 : 255, row * WIDTH, (row + 1) * WIDTH);
    }
    const pixels = new Uint8Array(5 * frameSize);
    [good, good, bad, good, good].forEach((frame, index) => {
      pixels.set(frame, index * frameSize);
    });
    expect(
      findOutlierFrames(pixels, WIDTH, HEIGHT).map(({ frame }) => frame),
    ).toEqual([2]);
  });

  it("flags two separated bad frames", () => {
    expect(outliersOf([20, 200, 20, 20, 20, 20, 220, 20, 20])).toEqual([1, 6]);
  });

  it("does not flag a hard cut", () => {
    expect(outliersOf([20, 20, 20, 200, 200, 200])).toEqual([]);
    expect(outliersOf([20, 20, 200, 200])).toEqual([]);
  });

  it("does not flag a linear fade", () => {
    expect(outliersOf([0, 10, 20, 30, 40, 50, 60, 70])).toEqual([]);
  });

  it("does not flag a static video", () => {
    expect(outliersOf(Array(30).fill(90))).toEqual([]);
  });

  it("does not flag small flicker below the change threshold", () => {
    expect(outliersOf([20, 20, 23, 20, 20])).toEqual([]);
  });

  it("never flags the first or last frame", () => {
    expect(outliersOf([200, 20, 20, 20])).toEqual([]);
    expect(outliersOf([20, 20, 20, 200])).toEqual([]);
  });

  it("reports nothing for fewer than three frames", () => {
    expect(outliersOf([])).toEqual([]);
    expect(outliersOf([20])).toEqual([]);
    expect(outliersOf([20, 200])).toEqual([]);
  });

  it("accepts an explicit frame count and rejects a mismatched buffer", () => {
    expect(
      findOutlierFrames(flat([20, 200, 20]), WIDTH, HEIGHT, 3).map(
        ({ frame }) => frame,
      ),
    ).toEqual([1]);
    expect(() =>
      findOutlierFrames(flat([20, 200, 20]), WIDTH, HEIGHT, 4),
    ).toThrow("Expected 4 frames");
    expect(() =>
      findOutlierFrames(new Uint8Array(WIDTH * HEIGHT + 1), WIDTH, HEIGHT),
    ).toThrow("Expected");
  });
});

describe("assertFrameIntegrity", () => {
  const record = (frames: number[]) => ({
    method: FRAME_INTEGRITY_METHOD,
    frames: 100,
    outliers: frames.map((frame) => ({ frame, dp: 30, dn: 30, dpn: 1 })),
  });

  it("returns the passing record untouched", async () => {
    const clean = record([]);
    await expect(
      assertFrameIntegrity("a.mp4", "preview.mp4", "ffmpeg", async () => clean),
    ).resolves.toBe(clean);
  });

  it("fails with RENDER_FRAME_INTEGRITY naming the frames and advising a re-render", async () => {
    const failure = await assertFrameIntegrity(
      "a.mp4",
      "final.mp4",
      "ffmpeg",
      async () => record([14, 106]),
    ).catch((error: unknown) => error);
    expect(isFrameIntegrityError(failure)).toBe(true);
    const [issue] = (failure as FrameIntegrityError).issues;
    expect(issue).toMatchObject({
      code: "RENDER_FRAME_INTEGRITY",
      severity: "error",
      responsible: "system",
      artifact: "final.mp4",
    });
    expect(issue?.message).toContain("frame 14, 106");
    expect(issue?.suggestion).toContain("again");
  });

  it("caps the listed frames but keeps every outlier in the details", async () => {
    const many = Array.from({ length: 25 }, (_, index) => index * 3 + 1);
    const failure = (await assertFrameIntegrity(
      "a.mp4",
      "preview.mp4",
      "ffmpeg",
      async () => record(many),
    ).catch((error: unknown) => error)) as FrameIntegrityError;
    const [issue] = failure.issues;
    expect(issue?.message).toContain("and 5 more");
    expect(
      (issue?.details as { outliers: unknown[] } | undefined)?.outliers,
    ).toHaveLength(25);
  });
});
