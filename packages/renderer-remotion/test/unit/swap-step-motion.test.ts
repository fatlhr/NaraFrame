import type { CompiledDraft, Layer } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import {
  assetAt,
  assetsOf,
  motionStateFor,
} from "../../src/remotion/motion.js";

type Scene = CompiledDraft["scenes"][number];

const raka = (stepFps?: 12 | 15): Extract<Layer, { type: "image" }> => ({
  id: "raka",
  type: "image",
  assetId: "raka-sit",
  fit: "contain",
  frame: { x: 150, y: 350, width: 240, height: 360 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
  ...(stepFps ? { stepFps } : {}),
});

const sceneWith = (layer: Layer, beats: Scene["beats"]): Scene => ({
  id: "phone",
  startFrame: 0,
  endFrame: 90,
  visual: { type: "composition" },
  layers: [layer],
  beats,
  transitionOut: { type: "cut" },
});

const draftOf = (scene: Scene) =>
  ({
    width: 540,
    height: 960,
    fps: 30,
    profile: {
      render: {
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.14,
        },
      },
    },
    scenes: [scene],
  }) as unknown as CompiledDraft;

describe("swap beat (S4)", () => {
  const layer = raka();
  const scene = sceneWith(layer, [
    {
      id: "hold",
      targetId: "raka",
      action: "swap",
      startFrame: 30,
      durationInFrames: 3,
      params: { assetId: "raka-hold" },
    },
    {
      id: "down",
      targetId: "raka",
      action: "swap",
      startFrame: 66,
      durationInFrames: 3,
      params: { assetId: "raka-down" },
    },
  ]);

  it("shows its own artwork, then each pose from its swap frame", () => {
    expect(assetAt(scene, layer, 0)).toBe("raka-sit");
    expect(assetAt(scene, layer, 29)).toBe("raka-sit");
    expect(assetAt(scene, layer, 30)).toBe("raka-hold");
    expect(assetAt(scene, layer, 65)).toBe("raka-hold");
    expect(assetAt(scene, layer, 66)).toBe("raka-down");
    expect(assetAt(scene, layer, 89)).toBe("raka-down");
  });

  it("lists every pose the layer can show", () => {
    expect(assetsOf(scene, layer)).toEqual([
      "raka-sit",
      "raka-hold",
      "raka-down",
    ]);
  });
});

describe("stepFps (S4)", () => {
  const slide = (stepFps?: 12 | 15) => {
    const layer = raka(stepFps);
    const scene = sceneWith(layer, [
      {
        id: "slide",
        targetId: "raka",
        action: "transform",
        startFrame: 0,
        durationInFrames: 30,
        params: { to: { x: 60 }, easingPreset: "linear" },
      },
    ]);
    const draft = draftOf(scene);
    return (frame: number) =>
      motionStateFor(draft, scene, "raka", frame).translateX;
  };

  it("moves on every frame without stepFps", () => {
    const x = slide();
    expect(x(1)).toBeCloseTo(2);
    expect(x(2)).toBeCloseTo(4);
  });

  it("holds each drawing for two frames at 15 in a 30 fps video", () => {
    const x = slide(15);
    const values = Array.from({ length: 10 }, (_, frame) => x(frame));
    expect(values).toEqual([0, 0, 4, 4, 8, 8, 12, 12, 16, 16]);
    // It keeps pace: the step at frame 20 shows frame 20's pose.
    expect(x(20)).toBeCloseTo(40);
    expect(x(30)).toBeCloseTo(60);
  });

  it("advances 12 drawings a second at 30 fps", () => {
    const x = slide(12);
    const changes = Array.from({ length: 30 }, (_, frame) => x(frame)).filter(
      (value, index, all) => index === 0 || value !== all[index - 1],
    );
    expect(changes).toHaveLength(12);
  });
});
