import {
  imagePlacement,
  PngLayoutSchema,
} from "@naraframe/core/image-placement";
import { describe, expect, it } from "vitest";

describe("source-pixel image placement", () => {
  it("maps a deliberately padded crop at native and half frame sizes without scaling source pixels", () => {
    const source = { width: 320, height: 400 },
      crop = { x: 60, y: 50, width: 200, height: 300 };
    const native = imagePlacement({
      source,
      crop,
      frame: { width: 560, height: 840 },
      fit: "contain",
    });
    const half = imagePlacement({
      source,
      crop,
      frame: { width: 280, height: 420 },
      fit: "contain",
    });
    expect(native.mapPoint({ x: 100, y: 190 })).toEqual({ x: 112, y: 392 });
    expect(half.mapPoint({ x: 100, y: 190 })).toEqual({ x: 56, y: 196 });
    expect(half.crop).toEqual(crop);
    expect(half.image.width).toBe(native.image.width / 2);
  });
  it("matches CSS contain/cover focal offsets and clips only the requested viewport", () => {
    const input = {
      source: { width: 800, height: 600 },
      crop: { x: 100, y: 100, width: 400, height: 200 },
      frame: { width: 200, height: 200 },
      focalPoint: { x: 1, y: 0 },
    };
    const contain = imagePlacement({ ...input, fit: "contain" });
    expect(contain.clip).toEqual({ x: 0, y: 0, width: 200, height: 100 });
    const cover = imagePlacement({ ...input, fit: "cover" });
    expect(cover.clip).toEqual({ x: -200, y: 0, width: 400, height: 200 });
    expect(cover.mapPoint({ x: 500, y: 100 })).toEqual({ x: 200, y: 0 });
  });
  it.each([
    { x: -1, y: 0, width: 20, height: 20 },
    { x: 90, y: 0, width: 20, height: 20 },
    { x: 0, y: 0, width: 0, height: 20 },
    { x: 0, y: Number.NaN, width: 20, height: 20 },
  ])("refuses invalid crop bounds %j", (crop) =>
    expect(() =>
      imagePlacement({
        source: { width: 100, height: 100 },
        frame: { width: 50, height: 50 },
        crop,
        fit: "contain",
      }),
    ).toThrow(),
  );
  it("requires declared source-pixel units and finite bounded metadata", () => {
    const base = { units: "source-pixels", width: 320, height: 400 };
    expect(PngLayoutSchema.safeParse(base).success).toBe(true);
    for (const patch of [
      { units: "normalized" },
      { anchors: { hand: { x: 321, y: 20 } } },
      { roi: { x: 0, y: 0, width: 321, height: 200 } },
      { padding: { top: 200, bottom: 200, left: 0, right: 0 } },
      { focalPoint: { x: Number.POSITIVE_INFINITY, y: 20 } },
    ])
      expect(PngLayoutSchema.safeParse({ ...base, ...patch }).success).toBe(
        false,
      );
  });
});
