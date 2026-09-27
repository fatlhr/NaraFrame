import type { CompiledDraft, Layer } from "@naraframe/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayerView } from "../../src/remotion/draft-video.js";
import {
  countedTextFor,
  countedTextVariants,
  drawnPathFor,
  drawProgressFor,
  motionStateFor,
  planeTransformFor,
  pointAlongPath,
} from "../../src/remotion/motion.js";

type Scene = CompiledDraft["scenes"][number];
type Beat = Scene["beats"][number];

const presentation = { opacity: 1, rotationDeg: 0, zIndex: 1 } as const;

// A 100-unit line laid 4x onto the page: (100, 400) to (500, 400).
const route: Extract<Layer, { type: "path" }> = {
  id: "route",
  type: "path",
  d: "M0 0 L100 0",
  viewBox: { minX: 0, minY: 0, width: 100, height: 50 },
  frame: { x: 100, y: 400, width: 400, height: 200 },
  stroke: { color: "#F2B705", width: 4 },
  ...presentation,
};

const ship: Extract<Layer, { type: "shape" }> = {
  id: "ship",
  type: "shape",
  shape: "rectangle",
  fill: "#1E2A26",
  frame: { x: 0, y: 0, width: 40, height: 20 },
  ...presentation,
};

const figure: Extract<Layer, { type: "text" }> = {
  id: "figure",
  type: "text",
  text: "50.000+",
  frame: { x: 0, y: 0, width: 400, height: 100 },
  ...presentation,
};

const draftWith = (beats: Beat[], camera?: Scene["camera"]): CompiledDraft => ({
  schemaVersion: 1,
  mode: "draft",
  width: 540,
  height: 960,
  fps: 30,
  totalFrames: 120,
  scope: { type: "project" },
  timelineScope: "project",
  label: "DRAFT • NO AUDIO",
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
      typography: { fontFamily: "Arial", headingWeight: 700, bodyWeight: 400 },
      safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
      spacingUnit: 8,
      motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
    },
  },
  assets: {},
  fonts: [],
  scenes: [
    {
      id: "probe",
      startFrame: 0,
      endFrame: 120,
      visual: { type: "composition" },
      layers: [route, ship, figure],
      beats,
      ...(camera ? { camera } : {}),
      transitionOut: { type: "cut" },
    },
  ],
});

const sceneOf = (draft: CompiledDraft): Scene => {
  const scene = draft.scenes[0];
  if (!scene) throw new Error("fixture has one scene");
  return scene;
};

const linear = { easingPreset: "linear" as const };

describe("path geometry", () => {
  it("maps viewBox points onto the frame, facing the direction of the path", () => {
    expect(pointAlongPath(route, 0)).toMatchObject({ x: 100, y: 400 });
    expect(pointAlongPath(route, 0.5)).toMatchObject({ x: 300, y: 400 });
    expect(pointAlongPath(route, 1)).toMatchObject({ x: 500, y: 400 });
    expect(pointAlongPath(route, 1).angleDeg).toBeCloseTo(0);
    // Fractions outside the path clamp to its ends.
    expect(pointAlongPath(route, 2)).toMatchObject({ x: 500 });
  });
});

describe("draw beats", () => {
  const draws: Beat[] = [
    {
      id: "draw",
      targetId: "route",
      action: "draw",
      startFrame: 10,
      durationInFrames: 20,
      params: linear,
    },
    {
      id: "erase",
      targetId: "route",
      action: "draw",
      startFrame: 60,
      durationInFrames: 20,
      params: { to: 0.25, ...linear },
    },
  ];
  const scene = sceneOf(draftWith(draws));

  it("hides a path before its first draw and settles each draw's end", () => {
    expect(drawProgressFor(scene, "route", 0)).toBe(0);
    expect(drawProgressFor(scene, "route", 20)).toBeCloseTo(0.5);
    expect(drawProgressFor(scene, "route", 45)).toBe(1);
    // The second draw continues from where the first settled.
    expect(drawProgressFor(scene, "route", 70)).toBeCloseTo(0.625);
    expect(drawProgressFor(scene, "route", 119)).toBeCloseTo(0.25);
  });

  it("paints nothing, a cut path, then the whole path", () => {
    expect(drawnPathFor(scene, route, 0)).toBeNull();
    const half = drawnPathFor(scene, route, 20);
    expect(half).not.toBeNull();
    expect(half).not.toBe(route.d);
    expect(drawnPathFor(scene, route, 45)).toBe(route.d);
  });

  it("draws a path in full when nothing draws it", () => {
    expect(drawProgressFor(sceneOf(draftWith([])), "route", 0)).toBe(1);
  });

  it("renders the drawn part of a path layer", () => {
    const markup = renderToStaticMarkup(
      createElement(LayerView, {
        draft: draftWith(draws),
        layer: route,
        localFrame: 20,
        scene,
      }),
    );
    expect(markup).toContain('viewBox="0 0 100 50"');
    expect(markup).toContain('stroke="#F2B705"');
    const empty = renderToStaticMarkup(
      createElement(LayerView, {
        draft: draftWith(draws),
        layer: route,
        localFrame: 0,
        scene,
      }),
    );
    expect(empty).not.toContain("<path");
  });
});

describe("follow beats", () => {
  const sail = (from: number, to: number): Beat => ({
    id: "sail",
    targetId: "ship",
    action: "follow",
    startFrame: 30,
    durationInFrames: 30,
    params: { pathId: "route", from, to, orient: true, ...linear },
  });

  it("waits at the start of its path, then puts the centre on the path", () => {
    const draft = draftWith([sail(0, 1)]);
    const scene = sceneOf(draft);
    // Ship centre is (20, 10); the path starts at (100, 400).
    const before = motionStateFor(draft, scene, "ship", 0);
    expect([before.translateX, before.translateY]).toEqual([80, 390]);
    const middle = motionStateFor(draft, scene, "ship", 45);
    expect(middle.translateX).toBeCloseTo(280);
    const after = motionStateFor(draft, scene, "ship", 119);
    expect([after.translateX, after.translateY]).toEqual([480, 390]);
    expect(after.rotationDeg).toBeCloseTo(0);
  });

  it("turns round when it travels back along its path", () => {
    const draft = draftWith([sail(1, 0.5)]);
    const state = motionStateFor(draft, sceneOf(draft), "ship", 40);
    expect(state.rotationDeg).toBeCloseTo(180);
  });

  it("hands the pose on to a later transform", () => {
    const draft = draftWith([
      sail(0, 1),
      {
        id: "moor",
        targetId: "ship",
        action: "transform",
        startFrame: 70,
        durationInFrames: 10,
        params: { to: { y: 500 }, ...linear },
      },
    ]);
    const state = motionStateFor(draft, sceneOf(draft), "ship", 119);
    expect([state.translateX, state.translateY]).toEqual([480, 500]);
  });
});

describe("count beats", () => {
  const counts: Beat[] = [
    {
      id: "count",
      targetId: "figure",
      action: "count",
      startFrame: 30,
      durationInFrames: 30,
      params: { from: 0, to: 50000, grouping: ".", suffix: "+", ...linear },
    },
  ];
  const scene = sceneOf(draftWith(counts));

  it("reads the start before, the value during and the settled figure after", () => {
    expect(countedTextFor(scene, "figure", 0)).toBe("0+");
    expect(countedTextFor(scene, "figure", 45)).toBe("25.000+");
    expect(countedTextFor(scene, "figure", 119)).toBe("50.000+");
    expect(countedTextFor(scene, "ship", 45)).toBeNull();
  });

  it("offers every endpoint for measurement", () => {
    expect(countedTextVariants(scene, "figure")).toEqual(["0+", "50.000+"]);
  });

  it("paints the counted text in place of the layer's own", () => {
    const markup = renderToStaticMarkup(
      createElement(LayerView, {
        draft: draftWith(counts),
        layer: figure,
        localFrame: 45,
        scene,
      }),
    );
    expect(markup).toContain("25.000+");
    expect(markup).not.toContain("50.000+");
  });
});

describe("billboard planes", () => {
  it("carries the pinned point with the camera without scaling", () => {
    const draft = draftWith([], {
      initial: { x: 100, y: 50, zoom: 2 },
      moves: [],
    });
    const scene = sceneOf(draft);
    const world = planeTransformFor(draft, scene, "world", 1, 0);
    const pinned = planeTransformFor(draft, scene, "world", 1, 0, {
      x: 370,
      y: 580,
    });
    expect(pinned.scale).toBe(1);
    // Where the world plane puts (370, 580) is where the pinned plane puts it.
    const onWorld = {
      x: world.originX + (370 - world.originX) * world.scale + world.translateX,
      y: world.originY + (580 - world.originY) * world.scale + world.translateY,
    };
    expect(370 + pinned.translateX).toBeCloseTo(onWorld.x);
    expect(580 + pinned.translateY).toBeCloseTo(onWorld.y);
  });
});
