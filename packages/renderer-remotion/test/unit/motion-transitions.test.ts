import type { CompiledDraft, CompiledTransition } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { sceneTransitionStateFor } from "../../src/remotion/motion.js";

const baseRender: CompiledDraft["profile"]["render"] = {
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

const sceneOf = (
  id: string,
  startFrame: number,
  endFrame: number,
  transitionOut: CompiledTransition,
): CompiledDraft["scenes"][number] => ({
  id,
  startFrame,
  endFrame,
  visual: { type: "composition" },
  layers: [],
  beats: [],
  transitionOut,
});

const draftWithScenes = (
  scenes: CompiledDraft["scenes"],
  width = 540,
  height = 960,
): CompiledDraft => ({
  schemaVersion: 1,
  mode: "draft",
  width: width as 540,
  height: height as 960,
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

describe("sceneTransitionStateFor — identity cases", () => {
  it("returns identity state for a cut transition throughout the scene", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, { type: "cut" }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    for (const frame of [0, 15, 29]) {
      const state = sceneTransitionStateFor(draft, 0, frame);
      expect(state).toEqual({
        opacity: 1,
        translateX: 0,
        translateY: 0,
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
      });
    }
  });

  it("never applies an exit transition on the last scene, since it never plays into anything", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, { type: "cut" }),
      sceneOf("b", 30, 60, {
        type: "push-through",
        durationInFrames: 15,
        direction: "left",
      }),
    ]);

    // scene "b" is last; its own transitionOut must not create an exit effect on itself.
    const state = sceneTransitionStateFor(draft, 1, 29);
    expect(state.opacity).toBe(1);
    expect(state.scale).toBe(1);
  });

  it("never applies an entry transition on the first scene, since nothing precedes it", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, { type: "cut" }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const state = sceneTransitionStateFor(draft, 0, 0);
    expect(state.opacity).toBe(1);
    expect(state.scale).toBe(1);
  });
});

describe("sceneTransitionStateFor — push-through", () => {
  it("starts an outgoing scene's exit window unchanged and ends it fully transitioned", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "push-through",
        durationInFrames: 15,
        direction: "left",
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atWindowStart = sceneTransitionStateFor(draft, 0, 15);
    expect(atWindowStart.opacity).toBeCloseTo(1, 5);
    expect(atWindowStart.scale).toBeCloseTo(1, 5);
    expect(atWindowStart.translateX).toBeCloseTo(0, 5);

    const atSceneEnd = sceneTransitionStateFor(draft, 0, 30);
    expect(atSceneEnd.opacity).toBeCloseTo(0, 5);
    expect(atSceneEnd.scale).toBeCloseTo(1 - 0.12, 5);
    // "left" exits toward negative x.
    expect(atSceneEnd.translateX).toBeLessThan(0);
  });

  it("arrives fully offset at frame 0 of the incoming scene and settles by the window's end", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "push-through",
        durationInFrames: 15,
        direction: "left",
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atEntryStart = sceneTransitionStateFor(draft, 1, 0);
    expect(atEntryStart.opacity).toBeCloseTo(0, 5);
    // Entry arrives from the opposite edge of the exit direction ("left" exit -> positive offset entry).
    expect(atEntryStart.translateX).toBeGreaterThan(0);

    const atEntryEnd = sceneTransitionStateFor(draft, 1, 15);
    expect(atEntryEnd.opacity).toBeCloseTo(1, 5);
    expect(atEntryEnd.translateX).toBeCloseTo(0, 5);
    expect(atEntryEnd.scale).toBeCloseTo(1, 5);
  });

  it("scales the travel distance from the draft's own width, not a hardcoded pixel count", () => {
    const narrow = draftWithScenes(
      [
        sceneOf("a", 0, 30, {
          type: "push-through",
          durationInFrames: 15,
          direction: "left",
        }),
        sceneOf("b", 30, 60, { type: "cut" }),
      ],
      270,
    );
    const wide = draftWithScenes(
      [
        sceneOf("a", 0, 30, {
          type: "push-through",
          durationInFrames: 15,
          direction: "left",
        }),
        sceneOf("b", 30, 60, { type: "cut" }),
      ],
      1080,
    );

    const narrowState = sceneTransitionStateFor(narrow, 0, 30);
    const wideState = sceneTransitionStateFor(wide, 0, 30);
    expect(Math.abs(wideState.translateX)).toBeGreaterThan(
      Math.abs(narrowState.translateX),
    );
  });
});

describe("sceneTransitionStateFor — mask-reveal", () => {
  it("fades the outgoing scene without changing its geometry", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "mask-reveal",
        durationInFrames: 15,
        shape: "circle",
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const state = sceneTransitionStateFor(draft, 0, 30);
    expect(state.opacity).toBeCloseTo(0, 5);
    expect(state.scale).toBe(1);
    expect(state.translateX).toBe(0);
    expect(state.clipPath).toBeUndefined();
  });

  it("clips the incoming scene with an expanding circle, starting at 0% and nearly fully covering just before the window ends", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "mask-reveal",
        durationInFrames: 15,
        shape: "circle",
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atEntryStart = sceneTransitionStateFor(draft, 1, 0);
    expect(atEntryStart.clipPath).toBe("circle(0% at 50% 50%)");
    expect(atEntryStart.opacity).toBe(1);

    // At exactly durationInFrames the window has closed and the scene reads
    // as settled (see the identity-case describe block above); the frame
    // just before it is still inside the window and should read nearly, but
    // not yet fully, expanded.
    const nearEnd = sceneTransitionStateFor(draft, 1, 14);
    const percent = Number(
      nearEnd.clipPath?.match(/circle\((\d+(?:\.\d+)?)%/)?.[1],
    );
    expect(percent).toBeGreaterThan(120);
    expect(percent).toBeLessThan(150);
  });

  it("clips a rectangle mask from fully inset down toward fully open", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "mask-reveal",
        durationInFrames: 15,
        shape: "rectangle",
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atEntryStart = sceneTransitionStateFor(draft, 1, 0);
    expect(atEntryStart.clipPath).toBe("inset(50%)");

    const nearEnd = sceneTransitionStateFor(draft, 1, 14);
    const percent = Number(
      nearEnd.clipPath?.match(/inset\((\d+(?:\.\d+)?)%/)?.[1],
    );
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThan(10);
  });
});

describe("sceneTransitionStateFor — match-cut", () => {
  it("zooms the outgoing scene in around the default center anchor", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, { type: "match-cut", durationInFrames: 15 }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atSceneEnd = sceneTransitionStateFor(draft, 0, 30);
    expect(atSceneEnd.scale).toBeCloseTo(1.3, 5);
    expect(atSceneEnd.anchor).toEqual({ x: 0.5, y: 0.5 });
    expect(atSceneEnd.opacity).toBe(1);
  });

  it("starts the incoming scene zoomed in and settles to scale 1 at the declared anchor", () => {
    const draft = draftWithScenes([
      sceneOf("a", 0, 30, {
        type: "match-cut",
        durationInFrames: 15,
        anchor: { x: 0.5, y: 0.4 },
      }),
      sceneOf("b", 30, 60, { type: "cut" }),
    ]);

    const atEntryStart = sceneTransitionStateFor(draft, 1, 0);
    expect(atEntryStart.scale).toBeCloseTo(1.3, 5);
    expect(atEntryStart.anchor).toEqual({ x: 0.5, y: 0.4 });
    expect(atEntryStart.opacity).toBe(1);

    const atEntryEnd = sceneTransitionStateFor(draft, 1, 15);
    expect(atEntryEnd.scale).toBeCloseTo(1, 5);
  });
});
