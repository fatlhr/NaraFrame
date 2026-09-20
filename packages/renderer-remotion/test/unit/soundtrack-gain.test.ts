import { describe, expect, it } from "vitest";
import { musicGainAt } from "../../src/remotion/soundtrack-gain.js";

const music = {
  assetId: "bed",
  volume: 0.5,
  loop: false,
  trimStartFrames: 0,
  fadeInFrames: 30,
  fadeOutFrames: 30,
  duck: {
    volume: 0.2,
    attackFrames: 10,
    releaseFrames: 20,
    windows: [{ startFrame: 100, endFrame: 200 }],
  },
};
const TOTAL = 300;

describe("musicGainAt", () => {
  it("fades in from silence and out to silence", () => {
    expect(musicGainAt(music, 0, TOTAL)).toBe(0);
    expect(musicGainAt(music, 15, TOTAL)).toBeCloseTo(0.25);
    expect(musicGainAt(music, 60, TOTAL)).toBeCloseTo(0.5);
    expect(musicGainAt(music, TOTAL, TOTAL)).toBeCloseTo(0);
  });

  it("holds the ducked level under speech, easing down before and up after", () => {
    expect(musicGainAt(music, 150, TOTAL)).toBeCloseTo(0.1);
    expect(musicGainAt(music, 95, TOTAL)).toBeCloseTo(0.5 * (1 - 0.5 * 0.8));
    expect(musicGainAt(music, 210, TOTAL)).toBeCloseTo(0.5 * (1 - 0.5 * 0.8));
    expect(musicGainAt(music, 230, TOTAL)).toBeCloseTo(0.5);
  });

  it("without ducking or fades it is just the volume", () => {
    const plain = {
      ...music,
      fadeInFrames: 0,
      fadeOutFrames: 0,
      duck: undefined,
    };
    expect(musicGainAt(plain, 150, TOTAL)).toBe(0.5);
  });
});
