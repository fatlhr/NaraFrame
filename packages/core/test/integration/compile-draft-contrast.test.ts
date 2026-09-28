import type { Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

// F1: compileDraft hands the design canvas to the contrast check, so text
// over a layer at another camera depth is judged from the camera's actual
// moves instead of being left unverified.

const plate = (y: number): Layer => ({
  id: "plate",
  type: "shape",
  shape: "rectangle",
  fill: "#E8E0D2",
  frame: { x: 0, y, width: 1080, height: 200 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  space: "world",
  parallax: 0.5,
});

const title: Layer = {
  id: "title",
  type: "text",
  text: "Judul",
  frame: { x: 100, y: 100, width: 800, height: 120 },
  role: "heading",
  opacity: 1,
  rotationDeg: 0,
  zIndex: 5,
};

const withPlateAt = (y: number): PlanSource => {
  const scene: Scene = {
    id: "push",
    narrativeRole: "context",
    durationMs: 2000,
    visual: { type: "composition", layers: [plate(y), title] },
    camera: {
      initial: { x: 0, y: 0, zoom: 1 },
      moves: [
        {
          id: "push-in",
          startMs: 0,
          durationMs: 1000,
          to: { x: 0, y: 200, zoom: 1.2 },
        },
      ],
    },
    beats: [],
    transition: { type: "cut" },
  };
  const { narration: _narration, ...rest } = narratedSource({
    scenes: [scene],
  });
  return rest;
};

const contrastIssues = (source: PlanSource) =>
  compileDraft(source).issues.filter((issue) =>
    issue.code.startsWith("CONTRAST"),
  );

describe("contrast check through compileDraft", () => {
  it("clears overlay text that a world plate never reaches during the camera move", () => {
    expect(contrastIssues(withPlateAt(1500))).toEqual([]);
  });

  it("leaves overlay text unverified when the camera brings a plate under it", () => {
    expect(contrastIssues(withPlateAt(300))).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        severity: "info",
        entityId: "title",
        path: "/scenes/0/visual/layers/1",
      }),
    ]);
  });
});

describe("contrast check with narration-anchored reveals", () => {
  // Silent-draft times say the text shows first; the phrase anchors put the
  // panel (phrase c1) before the text (phrase c2). The check must use the
  // resolved times, so the text is measured on its panel.
  const scene: Scene = {
    id: "s1",
    narrativeRole: "context",
    durationMs: 999,
    narration: { blockId: "context" },
    visual: {
      type: "composition",
      layers: [
        {
          id: "panel",
          type: "shape",
          shape: "rectangle",
          fill: "#FFFFFF",
          frame: { x: 100, y: 600, width: 880, height: 300 },
          opacity: 1,
          rotationDeg: 0,
          zIndex: 1,
        },
        {
          id: "label",
          type: "text",
          text: "Label",
          color: "#101A37",
          frame: { x: 140, y: 650, width: 800, height: 120 },
          role: "heading",
          opacity: 1,
          rotationDeg: 0,
          zIndex: 2,
        },
      ],
    },
    beats: [
      {
        id: "panel-in",
        targetId: "panel",
        action: "reveal",
        startMs: 2000,
        durationMs: 300,
        at: { phraseId: "c1", offsetMs: 0 },
        params: { direction: "up", distance: 20 },
      },
      {
        id: "label-in",
        targetId: "label",
        action: "reveal",
        startMs: 0,
        durationMs: 300,
        at: { phraseId: "c2", offsetMs: 0 },
        params: { direction: "up", distance: 20 },
      },
    ],
    transition: { type: "cut" },
  };

  it("measures the text on a panel that the narration reveals first", () => {
    const source = narratedSource({ scenes: [scene] });
    const result = compileDraft(source);
    expect(
      result.issues.filter((issue) => issue.code.startsWith("CONTRAST")),
    ).toEqual([]);
  });
});
