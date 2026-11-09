import type { CompiledDraft, Layer } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { motionStateFor } from "../../src/remotion/motion.js";
import { transformPoints } from "../../src/remotion/visual-preflight.js";

// An arm drawn at its natural size, lying to the right of its shoulder. The
// shoulder sits 10% in from the left edge, halfway down.
const arm = (pivot?: { x: number; y: number }): Layer => ({
  id: "arm",
  type: "shape",
  shape: "rectangle",
  fill: "#3E7A8C",
  frame: { x: 400, y: 600, width: 300, height: 100 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
  ...(pivot ? { pivot } : {}),
});
const shoulder = [430, 650] as const;
const tip = [700, 650] as const;

const draftWith = (
  layer: Layer,
  beats: CompiledDraft["scenes"][number]["beats"],
) => {
  const scene: CompiledDraft["scenes"][number] = {
    id: "wave",
    startFrame: 0,
    endFrame: 60,
    visual: { type: "composition" },
    layers: [layer],
    beats,
    transitionOut: { type: "cut" },
  };
  const draft = {
    schemaVersion: 1,
    mode: "draft",
    width: 1080,
    height: 1920,
    fps: 30,
    totalFrames: 60,
    scope: { type: "project" },
    timelineScope: "project",
    label: "DRAFT",
    sourceRevision: "a".repeat(64),
    assemblyKey: "b".repeat(64),
    profile: {
      id: "probe",
      version: "0.1.0",
      render: {
        palette: {
          background: "#000000",
          surface: "#111111",
          text: "#ffffff",
          accent: "#ff0000",
        },
        typography: {
          fontFamily: "Arial",
          headingWeight: 700,
          bodyWeight: 400,
        },
        safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.14,
        },
      },
    },
    assets: {},
    fonts: [],
    scenes: [scene],
  } as unknown as CompiledDraft;
  return { draft, scene };
};

const lift: CompiledDraft["scenes"][number]["beats"][number] = {
  id: "lift",
  targetId: "arm",
  action: "transform",
  startFrame: 0,
  durationInFrames: 30,
  params: { to: { rotationDeg: -40, scale: 1.1 }, easingPreset: "smooth" },
};

/** Where a point of the layer lands, with the renderer's own transform math. */
const placed = (
  layer: Layer,
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  frame: number,
  point: readonly [number, number],
) => {
  const state = motionStateFor(draft, scene, "arm", frame);
  if (layer.type === "group") throw new Error("not a group");
  const [moved] = transformPoints(
    [point],
    {
      ...state,
      anchorX: state.anchor.x,
      anchorY: state.anchor.y,
    },
    layer.frame,
  );
  return moved as readonly [number, number];
};

describe("layer pivot (S2)", () => {
  it("keeps the shoulder in place while the arm turns and grows", () => {
    const layer = arm({ x: 0.1, y: 0.5 });
    const { draft, scene } = draftWith(layer, [lift]);
    for (let frame = 0; frame <= 40; frame += 1) {
      const [x, y] = placed(layer, draft, scene, frame, shoulder);
      expect(Math.abs(x - shoulder[0])).toBeLessThan(1);
      expect(Math.abs(y - shoulder[1])).toBeLessThan(1);
    }
    // The hand end swings up, so the arm really turned.
    const [, tipY] = placed(layer, draft, scene, 30, tip);
    expect(tipY).toBeLessThan(tip[1] - 150);
  });

  it("turns about the centre without a pivot, as before", () => {
    const layer = arm();
    const { draft, scene } = draftWith(layer, [lift]);
    expect(motionStateFor(draft, scene, "arm", 10).anchor).toEqual({
      x: 0.5,
      y: 0.5,
    });
    const [x] = placed(layer, draft, scene, 30, shoulder);
    expect(Math.abs(x - shoulder[0])).toBeGreaterThan(10);
  });

  it("lets a focus anchor replace the pivot, as a focus anchor always has", () => {
    const layer = arm({ x: 0.1, y: 0.5 });
    const { draft, scene } = draftWith(layer, [
      {
        id: "look",
        targetId: "arm",
        action: "focus",
        startFrame: 40,
        durationInFrames: 10,
        params: { camera: "zoom", intensity: 0.5, anchor: { x: 0.9, y: 0.5 } },
      },
    ]);
    expect(motionStateFor(draft, scene, "arm", 45).anchor).toEqual({
      x: 0.9,
      y: 0.5,
    });
  });
});
