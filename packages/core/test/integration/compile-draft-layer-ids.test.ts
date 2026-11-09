import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const label = (id: string): Layer => ({
  id,
  type: "text",
  text: "Start free",
  color: "#F5F1E8",
  frame: { x: 245, y: 1290, width: 590, height: 95 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
});

const reveal = (targetId: string): Beat => ({
  id: "reveal-cta",
  targetId,
  action: "reveal",
  startMs: 400,
  durationMs: 500,
  params: { direction: "up", distance: 0 },
});

const source = (layerId: string, beats: Beat[]): PlanSource => {
  const scene: Scene = {
    id: "cta",
    narrativeRole: "context",
    durationMs: 3000,
    visual: { type: "composition", layers: [label(layerId)] },
    beats,
    transition: { type: "cut" },
  };
  const { narration: _narration, ...rest } = narratedSource({
    scenes: [scene],
  });
  return rest;
};

const warnings = (result: ReturnType<typeof compileDraft>) =>
  result.issues.filter((issue) => issue.code === "LAYER_ID_IS_SCENE_ID");

describe("a layer that shares its scene's id", () => {
  it("warns, names the beats that act on the whole scene, and still compiles", () => {
    const result = compileDraft(source("cta", [reveal("cta")]));
    expect(result.ok).toBe(true);
    const [warning] = warnings(result);
    expect(warning).toMatchObject({
      severity: "warning",
      path: "/scenes/0/visual/layers/0/id",
    });
    expect(warning?.message).toContain(
      "beat reveal-cta acts on the whole scene",
    );
  });

  it("warns without beats, because the layer can never be targeted", () => {
    const [warning] = warnings(compileDraft(source("cta", [])));
    expect(warning?.message).toContain("can never target the layer");
  });

  it("stays quiet when the ids differ", () => {
    expect(
      warnings(compileDraft(source("cta-text", [reveal("cta-text")]))),
    ).toEqual([]);
  });
});
