import type { CompiledDraft, Layer } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import {
  computeReadabilityMetrics,
  computeVarietyMetrics,
} from "../../src/compiler/qa-report.js";

const baseRender: CompiledDraft["profile"]["render"] = {
  palette: {
    background: "#11130F",
    surface: "#111111",
    text: "#F5F1E8",
    accent: "#ff0000",
  },
  typography: { fontFamily: "Arial", headingWeight: 700, bodyWeight: 400 },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

const textLayer = (
  overrides: Partial<Extract<Layer, { type: "text" }>> & { id: string },
): Extract<Layer, { type: "text" }> => ({
  type: "text",
  text: "Copy",
  frame: { x: 0, y: 0, width: 300, height: 80 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

const draftWithScenes = (
  scenes: CompiledDraft["scenes"],
  width = 540,
): CompiledDraft => ({
  schemaVersion: 1,
  mode: "draft",
  width: width as 540,
  height: 960,
  fps: 30,
  totalFrames: scenes.reduce((sum, s) => sum + (s.endFrame - s.startFrame), 0),
  scope: { type: "project" },
  timelineScope: "project",
  label: "DRAFT • NO AUDIO",
  sourceRevision: "a".repeat(64),
  assemblyKey: "b".repeat(64),
  profile: { id: "probe", version: "0.1.0", render: baseRender },
  assets: {},
  fonts: [],
  scenes,
});

describe("computeVarietyMetrics", () => {
  it("counts scenes, distinct entries, transition types, focus cameras, and font sizes", () => {
    const draft = draftWithScenes([
      {
        id: "one",
        startFrame: 0,
        endFrame: 90,
        visual: { type: "composition" },
        layers: [textLayer({ id: "a", fontSize: 34 })],
        beats: [
          {
            id: "reveal-one",
            targetId: "one",
            action: "reveal",
            startFrame: 0,
            durationInFrames: 10,
            params: { direction: "up", distance: 40 },
          },
        ],
        transitionOut: {
          type: "push-through",
          durationInFrames: 15,
          direction: "left",
        },
      },
      {
        id: "two",
        startFrame: 90,
        endFrame: 180,
        visual: { type: "composition" },
        layers: [textLayer({ id: "b", fontSize: 64 })],
        beats: [
          {
            id: "focus-two",
            targetId: "two",
            action: "focus",
            startFrame: 0,
            durationInFrames: 10,
            params: { camera: "zoom", intensity: 0.3 },
          },
        ],
        transitionOut: { type: "cut" },
      },
    ]);

    const metrics = computeVarietyMetrics(draft);

    expect(metrics).toEqual({
      sceneCount: 2,
      distinctEntrySignatures: 2,
      transitionTypesUsed: ["cut", "push-through"],
      focusCamerasUsed: ["zoom"],
      distinctFontSizesUsed: 2,
    });
  });

  it("reports a static entry signature for a scene with no beats", () => {
    const draft = draftWithScenes([
      {
        id: "static",
        startFrame: 0,
        endFrame: 90,
        visual: { type: "composition" },
        layers: [],
        beats: [],
        transitionOut: { type: "cut" },
      },
    ]);

    const metrics = computeVarietyMetrics(draft);

    expect(metrics.distinctEntrySignatures).toBe(1);
    expect(metrics.transitionTypesUsed).toEqual(["cut"]);
    expect(metrics.focusCamerasUsed).toEqual([]);
  });
});

describe("computeReadabilityMetrics", () => {
  it("scales the smallest draft font size up to the fixed 1080px final width", () => {
    const draft = draftWithScenes(
      [
        {
          id: "one",
          startFrame: 0,
          endFrame: 90,
          visual: { type: "composition" },
          layers: [
            textLayer({ id: "small", fontSize: 20 }),
            textLayer({ id: "large", fontSize: 60 }),
          ],
          beats: [],
          transitionOut: { type: "cut" },
        },
      ],
      540,
    );

    const metrics = computeReadabilityMetrics(draft);

    // draft width 540 -> final 1080 is a 2x scale, so 20px -> 40px.
    expect(metrics.smallestFontSizeAtFinalWidthPx).toBe(40);
  });

  it("returns null smallest size when there are no text layers", () => {
    const draft = draftWithScenes([
      {
        id: "one",
        startFrame: 0,
        endFrame: 90,
        visual: { type: "composition" },
        layers: [],
        beats: [],
        transitionOut: { type: "cut" },
      },
    ]);

    const metrics = computeReadabilityMetrics(draft);

    expect(metrics.smallestFontSizeAtFinalWidthPx).toBeNull();
    expect(metrics.contrastSamples).toEqual([]);
  });

  it("reports one contrast sample per text layer, using the layer color or the palette default", () => {
    const draft = draftWithScenes([
      {
        id: "one",
        startFrame: 0,
        endFrame: 90,
        visual: { type: "composition" },
        layers: [
          textLayer({ id: "explicit-color", fontSize: 34, color: "#F5F1E8" }),
          textLayer({ id: "default-color", fontSize: 34 }),
        ],
        beats: [],
        transitionOut: { type: "cut" },
      },
    ]);

    const metrics = computeReadabilityMetrics(draft);

    expect(metrics.contrastSamples).toHaveLength(2);
    expect(metrics.contrastSamples[0]).toMatchObject({
      sceneId: "one",
      layerId: "explicit-color",
      meetsThreshold: true,
    });
    expect(metrics.contrastSamples[1]).toMatchObject({
      sceneId: "one",
      layerId: "default-color",
      meetsThreshold: true,
    });
  });
});
