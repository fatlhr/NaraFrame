import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft, ScenesSchema } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const panel: Extract<Layer, { type: "shape" }> = {
  id: "panel",
  type: "shape",
  shape: "rectangle",
  fill: "#FFFFFF",
  frame: { x: 100, y: 600, width: 880, height: 400 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
};

const label: Extract<Layer, { type: "text" }> = {
  id: "label",
  type: "text",
  text: "Tilt",
  color: "#FFFFFF",
  frame: { x: 160, y: 700, width: 400, height: 160 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 2,
};

const scene = (layers: Layer[], beats: Beat[] = []): Scene => ({
  id: "tilt",
  narrativeRole: "context",
  durationMs: 2000,
  visual: { type: "composition", layers },
  beats,
  transition: { type: "cut" },
});

const silentSource = (scenes: Scene[]): PlanSource => {
  const { narration: _narration, ...rest } = narratedSource({ scenes });
  return rest;
};

const tilt = (targetId: string): Beat => ({
  id: `${targetId}-tilt`,
  targetId,
  action: "transform",
  startMs: 0,
  durationMs: 500,
  params: { to: { rotationDeg: -20 } },
});

describe("layer pivot (S2)", () => {
  it("accepts a pivot inside the frame and refuses one outside", () => {
    const inside = ScenesSchema.safeParse({
      schemaVersion: 1,
      scenes: [scene([{ ...panel, pivot: { x: 0.1, y: 1 } }])],
    });
    expect(inside.success).toBe(true);
    const outside = ScenesSchema.safeParse({
      schemaVersion: 1,
      scenes: [scene([{ ...panel, pivot: { x: 1.2, y: 0.5 } }])],
    });
    expect(outside.success).toBe(false);
  });

  it("carries the pivot into the compiled layer", () => {
    const result = compileDraft(
      silentSource([scene([{ ...panel, pivot: { x: 0.1, y: 0.5 } }, label])]),
    );
    if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
    const compiled = result.value.scenes[0]?.layers.find(
      (layer) => layer.id === "panel",
    );
    expect(compiled?.pivot).toEqual({ x: 0.1, y: 0.5 });
  });

  it("leaves contrast unmeasured for text that turns about an off-centre pivot", () => {
    const result = compileDraft(
      silentSource([
        scene([panel, { ...label, pivot: { x: 0, y: 0.5 } }], [tilt("label")]),
      ]),
    );
    if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
    const unverified = result.issues.find(
      (issue) => issue.code === "CONTRAST_UNVERIFIED",
    );
    expect(unverified?.message).toContain("pivot");
  });

  it("still measures text whose pivot is the centre or that only travels", () => {
    for (const layers of [
      [panel, { ...label, pivot: { x: 0.5, y: 0.5 } }],
      [panel, { ...label, pivot: { x: 0, y: 0 } }],
    ]) {
      const beats: Beat[] =
        layers[1]?.pivot?.x === 0.5
          ? [tilt("label")]
          : [
              {
                id: "slide",
                targetId: "label",
                action: "transform",
                startMs: 0,
                durationMs: 500,
                params: { to: { x: 40 } },
              },
            ];
      const result = compileDraft(silentSource([scene(layers, beats)]));
      if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
      // White on white is measured, and fails.
      expect(result.issues.map((issue) => issue.code)).toContain(
        "CONTRAST_INSUFFICIENT",
      );
    }
  });
});
