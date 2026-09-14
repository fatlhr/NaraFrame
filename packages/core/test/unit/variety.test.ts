import type { Layer, RenderTokens, Scene } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { checkVariety, type VarietyScene } from "../../src/compiler/variety.js";

const baseRender: RenderTokens = {
  palette: {
    background: "#000000",
    surface: "#111111",
    text: "#ffffff",
    accent: "#ff0000",
  },
  typography: { fontFamily: "Arial", headingWeight: 700, bodyWeight: 400 },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

const scene = (overrides: {
  id: string;
  entryDirection?: "up" | "down" | "left" | "right";
  focus?: boolean;
  transitionType?: "cut";
}): Scene => ({
  id: overrides.id,
  narrativeRole: "context",
  durationMs: 3000,
  visual: { type: "text", text: overrides.id },
  beats: [
    ...(overrides.entryDirection
      ? [
          {
            id: `${overrides.id}-reveal`,
            targetId: overrides.id,
            action: "reveal" as const,
            startMs: 0,
            durationMs: 500,
            params: { direction: overrides.entryDirection, distance: 40 },
          },
        ]
      : []),
    ...(overrides.focus
      ? [
          {
            id: `${overrides.id}-focus`,
            targetId: overrides.id,
            action: "focus" as const,
            startMs: 600,
            durationMs: 900,
            params: { camera: "zoom" as const, intensity: 0.3 },
          },
        ]
      : []),
  ],
  transition: { type: overrides.transitionType ?? "cut" },
});

const textLayer = (fontSize: number): Extract<Layer, { type: "text" }> => ({
  type: "text",
  id: `label-${fontSize}-${Math.random()}`,
  text: "Copy",
  frame: { x: 0, y: 0, width: 300, height: 80 },
  fontSize,
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
});

const entries = (
  scenes: Scene[],
  layersPerScene: Array<Layer[]> = [],
): VarietyScene[] =>
  scenes.map((s, index) => ({
    scene: s,
    sceneIndex: index,
    resolvedLayers: layersPerScene[index] ?? [],
  }));

describe("checkVariety", () => {
  it("flags three or more consecutive scenes entering the same way", () => {
    const scenes = [
      scene({ id: "a", entryDirection: "up" }),
      scene({ id: "b", entryDirection: "up" }),
      scene({ id: "c", entryDirection: "up" }),
    ];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).toContain("MOTION_REPETITION");
  });

  it("does not flag two consecutive scenes with the same entry", () => {
    const scenes = [
      scene({ id: "a", entryDirection: "up" }),
      scene({ id: "b", entryDirection: "up" }),
      scene({ id: "c", entryDirection: "left" }),
    ];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).not.toContain("MOTION_REPETITION");
  });

  it("flags a run of fixed-viewpoint scenes with no focus beat", () => {
    const scenes = [scene({ id: "a" }), scene({ id: "b" }), scene({ id: "c" })];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).toContain("VIEWPOINT_STATIC");
  });

  it("does not flag a viewpoint run broken by a focus beat", () => {
    const scenes = [
      scene({ id: "a" }),
      scene({ id: "b", focus: true }),
      scene({ id: "c" }),
    ];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).not.toContain("VIEWPOINT_STATIC");
  });

  it("flags a project where every scene uses the same transition", () => {
    const scenes = [
      scene({ id: "a" }),
      scene({ id: "b", focus: true }),
      scene({ id: "c" }),
    ];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).toContain("SINGLE_TRANSITION_TYPE");
  });

  it("skips the transition check under the minimum scene count", () => {
    const scenes = [scene({ id: "a" }), scene({ id: "b", focus: true })];

    const issues = checkVariety(entries(scenes), baseRender);

    expect(issues.map((i) => i.code)).not.toContain("SINGLE_TRANSITION_TYPE");
  });

  it("flags a project whose text layers all resolve to one font size", () => {
    const scenes = [scene({ id: "a", focus: true }), scene({ id: "b" })];
    const layers = [
      [textLayer(34), textLayer(34)],
      [textLayer(34), textLayer(34)],
    ];

    const issues = checkVariety(entries(scenes, layers), baseRender);

    expect(issues.map((i) => i.code)).toContain("TYPOGRAPHY_FLAT");
  });

  it("does not flag typography once sizes differ", () => {
    const scenes = [scene({ id: "a", focus: true }), scene({ id: "b" })];
    const layers = [
      [textLayer(64), textLayer(34)],
      [textLayer(34), textLayer(22)],
    ];

    const issues = checkVariety(entries(scenes, layers), baseRender);

    expect(issues.map((i) => i.code)).not.toContain("TYPOGRAPHY_FLAT");
  });

  it("honors a profile policy that raises repetition to an error", () => {
    const scenes = [
      scene({ id: "a", entryDirection: "up" }),
      scene({ id: "b", entryDirection: "up" }),
      scene({ id: "c", entryDirection: "up" }),
    ];

    const issues = checkVariety(entries(scenes), {
      ...baseRender,
      variety: { severity: "error" },
    });

    const repetition = issues.find((i) => i.code === "MOTION_REPETITION");
    expect(repetition?.severity).toBe("error");
  });

  it("honors a profile policy that raises the allowed run length", () => {
    const scenes = [
      scene({ id: "a", entryDirection: "up" }),
      scene({ id: "b", entryDirection: "up" }),
      scene({ id: "c", entryDirection: "up" }),
    ];

    const issues = checkVariety(entries(scenes), {
      ...baseRender,
      variety: { maxConsecutiveSameEntry: 3 },
    });

    expect(issues.map((i) => i.code)).not.toContain("MOTION_REPETITION");
  });
});
