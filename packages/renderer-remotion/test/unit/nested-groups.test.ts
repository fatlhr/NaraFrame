import type { CompiledDraft, Layer } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { throughGroups } from "../../src/remotion/visual-preflight.js";

type Scene = CompiledDraft["scenes"][number];
type Beat = Scene["beats"][number];

const shape = (
  id: string,
  frame: { x: number; y: number; width: number; height: number },
): Layer => ({
  id,
  type: "shape",
  shape: "rectangle",
  fill: "#3E7A8C",
  frame,
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
});
const group = (
  id: string,
  memberIds: string[],
  pivot?: { x: number; y: number },
): Layer => ({
  id,
  type: "group",
  memberIds,
  transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
  zIndex: 1,
  ...(pivot ? { pivot } : {}),
});

// The shoulder is (500, 650), the elbow (700, 650) and the wrist (860, 650).
const layers: Layer[] = [
  shape("torso", { x: 400, y: 600, width: 200, height: 400 }),
  shape("upper-arm", { x: 500, y: 620, width: 200, height: 60 }),
  shape("forearm", { x: 700, y: 625, width: 160, height: 50 }),
  shape("hand", { x: 850, y: 625, width: 50, height: 50 }),
  // Forearm and hand span 700-900 by 625-675: the elbow is at (0, 0.5).
  group("forearm-g", ["forearm", "hand"], { x: 0, y: 0.5 }),
  // Upper arm and forearm span 500-900 by 620-680: the shoulder is at (0, 0.5).
  group("arm-g", ["upper-arm", "forearm-g"], { x: 0, y: 0.5 }),
  group("body-g", ["torso", "arm-g"]),
];

const turn = (
  id: string,
  targetId: string,
  startFrame: number,
  to: { rotationDeg?: number; x?: number },
): Beat => ({
  id,
  targetId,
  action: "transform",
  startFrame,
  durationInFrames: 10,
  params: { to, easingPreset: "linear" },
});

const draftWith = (beats: Beat[]) => {
  const scene: Scene = {
    id: "reach",
    startFrame: 0,
    endFrame: 60,
    visual: { type: "composition" },
    layers,
    beats,
    transitionOut: { type: "cut" },
  };
  const draft = {
    width: 1080,
    height: 1920,
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
  } as unknown as CompiledDraft;
  return { draft, scene };
};

const at = (
  draft: CompiledDraft,
  scene: Scene,
  layerId: string,
  point: readonly [number, number],
  frame: number,
) => {
  const [moved] = throughGroups(draft, scene, layerId, [point], frame);
  return moved as readonly [number, number];
};
const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0));

// The body turns and shifts over frames 0-10, the arm lifts over 10-20 and
// the elbow bends over 20-30.
const { draft, scene } = draftWith([
  turn("lean", "body-g", 0, { rotationDeg: 10, x: 30 }),
  turn("lift", "arm-g", 10, { rotationDeg: -50 }),
  turn("bend", "forearm-g", 20, { rotationDeg: -40 }),
]);

describe("nested groups (S3)", () => {
  it("keeps each child's joint on its parent's joint", () => {
    for (let frame = 0; frame <= 40; frame += 1) {
      // The shoulder as part of the body and as part of the upper arm.
      expect(
        distance(
          at(draft, scene, "torso", [500, 650], frame),
          at(draft, scene, "upper-arm", [500, 650], frame),
        ),
      ).toBeLessThan(1);
      // The elbow as part of the upper arm and as part of the forearm.
      expect(
        distance(
          at(draft, scene, "upper-arm", [700, 650], frame),
          at(draft, scene, "forearm", [700, 650], frame),
        ),
      ).toBeLessThan(1);
      // The wrist as part of the forearm and as part of the hand.
      expect(
        distance(
          at(draft, scene, "forearm", [860, 650], frame),
          at(draft, scene, "hand", [860, 650], frame),
        ),
      ).toBeLessThan(1);
    }
  });

  it("carries the whole arm when the body turns", () => {
    const before = at(draft, scene, "hand", [875, 650], 0);
    const after = at(draft, scene, "hand", [875, 650], 10);
    expect(distance(before, after)).toBeGreaterThan(30);
  });

  it("carries forearm and hand when the upper arm turns, and leaves the shoulder", () => {
    const shoulder = (frame: number) =>
      at(draft, scene, "upper-arm", [500, 650], frame);
    const hand = (frame: number) => at(draft, scene, "hand", [875, 650], frame);
    expect(distance(shoulder(10), shoulder(20))).toBeLessThan(1);
    expect(hand(20)[1]).toBeLessThan(hand(10)[1] - 200);
  });

  it("bends the elbow without moving the shoulder or the upper arm", () => {
    const point = (layerId: string, xy: [number, number], frame: number) =>
      at(draft, scene, layerId, xy, frame);
    expect(
      distance(
        point("upper-arm", [500, 650], 20),
        point("upper-arm", [500, 650], 30),
      ),
    ).toBeLessThan(1);
    expect(
      distance(
        point("upper-arm", [700, 650], 20),
        point("upper-arm", [700, 650], 30),
      ),
    ).toBeLessThan(1);
    expect(
      distance(point("hand", [875, 650], 20), point("hand", [875, 650], 30)),
    ).toBeGreaterThan(50);
  });
});
