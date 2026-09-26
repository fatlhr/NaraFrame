import type { PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const baseRender: PlanSource["profile"]["render"] = {
  palette: {
    background: "#11130F",
    surface: "#E8E0D2",
    text: "#F5F1E8",
    accent: "#FF5A36",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    headingWeight: 800,
    bodyWeight: 500,
  },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

const scene = (overrides: {
  id: string;
  durationMs: number;
  transition?: Scene["transition"];
}): Scene => ({
  id: overrides.id,
  narrativeRole: "context",
  durationMs: overrides.durationMs,
  visual: { type: "text", text: overrides.id },
  beats: [],
  transition: overrides.transition ?? { type: "cut" },
});

const buildSource = (
  scenes: Scene[],
  renderOverrides: Partial<PlanSource["profile"]["render"]> = {},
  fontAssets: PlanSource["profile"]["assets"] = [],
): PlanSource => ({
  project: {
    schemaVersion: 1,
    id: "probe",
    title: "Probe",
    profile: { id: "probe-profile", version: "0.1.0" },
    format: {
      design: { width: 1080, height: 1920, fps: 30 },
      draft: { width: 540, height: 960, fps: 30 },
    },
    safetyMaxDurationMs: 180_000,
  },
  profile: {
    schemaVersion: 1,
    id: "probe-profile",
    version: "0.1.0",
    source: { kind: "local", identity: "probe@0.1.0" },
    direction: { text: "Probe direction.", sha256: "a".repeat(64) },
    render: { ...baseRender, ...renderOverrides },
    production: {
      voiceStyleSignature: "probe",
      illustrationStyleSignature: "probe",
      timing: { wordLevelRequired: false },
      assetPolicy: { allowPlannedInDraft: true },
    },
    duration: { preferredMinMs: 1000, preferredMaxMs: 60_000 },
    lockedPaths: [],
    overridablePaths: [],
    assets: fontAssets,
  },
  scenes: { schemaVersion: 1, scenes },
  assets: { schemaVersion: 1, assets: [] },
});

describe("motion-study source-to-compile", () => {
  const motionScene = (): Scene => ({
    id: "study",
    narrativeRole: "hook",
    durationMs: 3000,
    transition: { type: "cut" },
    visual: {
      type: "composition",
      layers: [
        {
          id: "pin",
          type: "shape",
          shape: "circle",
          fill: "#ffffff",
          frame: { x: 100, y: 500, width: 100, height: 100 },
          opacity: 1,
          rotationDeg: 0,
          zIndex: 0,
          space: "world",
        },
      ],
    },
    camera: {
      initial: { x: 0, y: 0, zoom: 1 },
      moves: [
        {
          id: "pan",
          startMs: 0,
          durationMs: 2000,
          to: { x: 100, y: 20, zoom: 1.1 },
        },
      ],
    },
    beats: [
      {
        id: "travel",
        targetId: "pin",
        action: "transform",
        startMs: 0,
        durationMs: 1000,
        params: { to: { x: 200, y: 40 } },
      },
    ],
  });
  it("scales coordinates and preserves scoped camera and motion; camera invalidates render key", () => {
    const source = buildSource([
      scene({ id: "lead", durationMs: 1000 }),
      motionScene(),
    ]);
    const full = compileDraft(source);
    expect(full.ok).toBe(true);
    if (!full.ok) return;
    const compiledScene = full.value.scenes[1];
    if (!compiledScene) throw new Error("Missing compiled study scene");
    expect(compiledScene.camera?.moves[0]?.to).toEqual({
      x: 50,
      y: 10,
      zoom: 1.1,
    });
    expect(compiledScene.beats[0]?.params).toMatchObject({
      to: { x: 100, y: 20 },
    });
    const scoped = compileDraft(source, { type: "scene", sceneId: "study" });
    expect(scoped.ok).toBe(true);
    if (scoped.ok) {
      expect(scoped.value.scenes[0]?.camera).toEqual(compiledScene.camera);
      expect(scoped.value.scenes[0]?.beats).toEqual(compiledScene.beats);
      expect(scoped.value.scenes[0]?.startFrame).toBe(0);
      expect(compiledScene.startFrame).toBe(30);
    }
    const changed = structuredClone(source);
    const changedMove = changed.scenes.scenes[1]?.camera?.moves[0];
    if (!changedMove) throw new Error("Missing camera move fixture");
    changedMove.to.x = 150;
    const next = compileDraft(changed);
    expect(next.ok).toBe(true);
    if (next.ok)
      expect(next.value.assemblyKey).not.toBe(full.value.assemblyKey);
  });
  it("rejects same-property conflicts but accepts independent properties", () => {
    const scene = motionScene();
    scene.beats.push({
      id: "rotate",
      targetId: "pin",
      action: "transform",
      startMs: 0,
      durationMs: 1000,
      params: { to: { rotationDeg: 15 } },
    });
    expect(compileDraft(buildSource([scene])).ok).toBe(true);
    const secondBeat = scene.beats[1];
    if (!secondBeat) throw new Error("Missing beat fixture");
    secondBeat.params = { to: { x: 300 } };
    const result = compileDraft(buildSource([scene]));
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain(
      "MOTION_PROPERTY_OVERLAP",
    );
  });
  it("rejects camera overlaps and camera moves beyond scene duration", () => {
    const scene = motionScene();
    if (!scene.camera) throw new Error("Missing camera fixture");
    scene.camera.moves.push({
      id: "bad",
      startMs: 1000,
      durationMs: 3000,
      to: { x: 0, y: 0, zoom: 1 },
    });
    const result = compileDraft(buildSource([scene]));
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining([
        "CAMERA_MOVE_OVERLAP",
        "CAMERA_MOVE_OUTSIDE_SCENE",
      ]),
    );
  });
});

describe("compileDraft — exit beat overlap validation", () => {
  type Beat = Scene["beats"][number];

  /** One composition scene with a single text target, and the given beats. */
  const exitScene = (beats: Beat[]): Scene => ({
    id: "opening",
    narrativeRole: "hook",
    durationMs: 3000,
    transition: { type: "cut" },
    visual: {
      type: "composition",
      layers: [
        {
          id: "headline",
          type: "text",
          text: "Headline",
          frame: { x: 80, y: 200, width: 900, height: 200 },
          opacity: 1,
          rotationDeg: 0,
          zIndex: 0,
        },
      ],
    },
    beats,
  });

  const reveal = (id: string, startMs: number, durationMs: number): Beat => ({
    id,
    targetId: "headline",
    action: "reveal",
    startMs,
    durationMs,
    params: { direction: "up", distance: 40 },
  });
  const exit = (
    id: string,
    startMs: number,
    durationMs: number,
    params: Extract<Beat, { action: "exit" }>["params"] = {},
  ): Beat => ({
    id,
    targetId: "headline",
    action: "exit",
    startMs,
    durationMs,
    params,
  });

  const overlapCodes = (beats: Beat[]) => {
    const result = compileDraft(buildSource([exitScene(beats)]));
    return {
      ok: result.ok,
      overlaps: result.issues.filter(
        (issue) => issue.code === "MOTION_PROPERTY_OVERLAP",
      ),
    };
  };

  it("rejects an exit that overlaps a reveal on the same target's opacity", () => {
    const result = overlapCodes([
      reveal("in", 0, 1000),
      exit("out", 500, 1000),
    ]);
    expect(result.ok).toBe(false);
    expect(result.overlaps).toHaveLength(1);
    expect(result.overlaps[0]?.message).toContain("opacity");
  });

  it("rejects two exits that overlap on the same target", () => {
    const result = overlapCodes([
      exit("out-a", 0, 1000),
      exit("out-b", 500, 1000),
    ]);
    expect(result.ok).toBe(false);
    expect(result.overlaps.length).toBeGreaterThan(0);
  });

  it("rejects an exit whose drift overlaps a transform on the same axis", () => {
    const result = overlapCodes([
      {
        id: "lift",
        targetId: "headline",
        action: "transform",
        startMs: 0,
        durationMs: 1000,
        params: { to: { y: -30 } },
      },
      exit("out", 500, 1000, { direction: "up", distance: 60 }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.overlaps[0]?.message).toContain(" y ");
  });

  it("accepts a reveal followed by an exit when the windows are sequential", () => {
    expect(
      overlapCodes([reveal("in", 0, 1000), exit("out", 1500, 500)]),
    ).toEqual({
      ok: true,
      overlaps: [],
    });
  });

  it("accepts an exit alongside motion on independent properties", () => {
    // A fade-only exit writes opacity; emphasize writes scale and a transform
    // here writes x. None of them touches what the others write.
    expect(
      overlapCodes([
        exit("out", 500, 1000),
        {
          id: "pulse",
          targetId: "headline",
          action: "emphasize",
          startMs: 500,
          durationMs: 1000,
          params: { scale: 1.05 },
        },
        {
          id: "slide",
          targetId: "headline",
          action: "transform",
          startMs: 500,
          durationMs: 1000,
          params: { to: { x: 40 } },
        },
      ]),
    ).toEqual({ ok: true, overlaps: [] });
  });

  it("keeps accepting overlaps among the original presets, which existing projects rely on", () => {
    expect(
      overlapCodes([reveal("in-a", 0, 1000), reveal("in-b", 500, 1000)]),
    ).toEqual({ ok: true, overlaps: [] });
  });
});

describe("compileDraft — M0.10 transition boundary validation", () => {
  it("accepts a project whose transitions fit within both neighbouring scenes", () => {
    const source = buildSource([
      scene({
        id: "one",
        durationMs: 3000,
        transition: {
          type: "push-through",
          durationMs: 500,
          direction: "left",
        },
      }),
      scene({ id: "two", durationMs: 3000 }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).not.toContain(
      "TRANSITION_DURATION_EXCEEDS_SCENE",
    );
  });

  it("rejects a transition that does not fit inside its own scene", () => {
    const source = buildSource([
      scene({
        id: "one",
        durationMs: 400,
        transition: {
          type: "push-through",
          durationMs: 900,
          direction: "left",
        },
      }),
      scene({ id: "two", durationMs: 3000 }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).toContain(
      "TRANSITION_DURATION_EXCEEDS_SCENE",
    );
  });

  it("rejects a transition that does not fit inside the next scene", () => {
    const source = buildSource([
      scene({
        id: "one",
        durationMs: 3000,
        transition: { type: "mask-reveal", durationMs: 900, shape: "circle" },
      }),
      scene({ id: "two", durationMs: 400 }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).toContain(
      "TRANSITION_DURATION_EXCEEDS_SCENE",
    );
  });

  it("rejects a scene whose incoming and outgoing transitions together overflow its own duration", () => {
    const source = buildSource([
      scene({
        id: "one",
        durationMs: 3000,
        transition: {
          type: "push-through",
          durationMs: 500,
          direction: "left",
        },
      }),
      scene({
        id: "two",
        durationMs: 900,
        transition: { type: "mask-reveal", durationMs: 600, shape: "circle" },
      }),
      scene({ id: "three", durationMs: 3000 }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).toContain(
      "TRANSITION_OVERLAP_WITHIN_SCENE",
    );
  });

  it("warns (without blocking) when the final scene declares a transition that can never play", () => {
    const source = buildSource([
      scene({ id: "one", durationMs: 3000 }),
      scene({
        id: "two",
        durationMs: 3000,
        transition: { type: "match-cut", durationMs: 400 },
      }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.issues).toContainEqual(
      expect.objectContaining({
        code: "TRANSITION_ON_FINAL_SCENE_IGNORED",
        severity: "warning",
      }),
    );
  });

  it("carries each scene's transition into transitionOut in frame space", () => {
    const source = buildSource([
      scene({
        id: "one",
        durationMs: 1000,
        transition: { type: "push-through", durationMs: 500, direction: "up" },
      }),
      scene({ id: "two", durationMs: 1000 }),
    ]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.value.scenes[0]?.transitionOut).toEqual({
      type: "push-through",
      direction: "up",
      durationInFrames: 15,
    });
    expect(compiled.value.scenes[1]?.transitionOut).toEqual({ type: "cut" });
  });
});

describe("compileDraft — M0.10.3 display font validation", () => {
  it("accepts a displayFontFamily that matches a locked font asset", () => {
    const source = buildSource(
      [scene({ id: "one", durationMs: 3000 })],
      {
        typography: {
          ...baseRender.typography,
          displayFontFamily: "Probe Display",
        },
      },
      [
        {
          id: "display-face",
          kind: "font",
          path: "assets/profile/aa.ttf",
          sha256: "a".repeat(64),
          family: "Probe Display",
          weight: 700,
        },
      ],
    );

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).not.toContain(
      "DISPLAY_FONT_NOT_DECLARED",
    );
    expect(compiled.value.fonts).toEqual([
      {
        family: "Probe Display",
        weight: 700,
        publicPath: "assets/profile/aa.ttf",
        sha256: "a".repeat(64),
      },
    ]);
  });

  it("rejects a displayFontFamily with no matching locked font asset", () => {
    const source = buildSource([scene({ id: "one", durationMs: 3000 })], {
      typography: {
        ...baseRender.typography,
        displayFontFamily: "Nobody Registered This",
      },
    });

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues).toContainEqual(
      expect.objectContaining({
        code: "DISPLAY_FONT_NOT_DECLARED",
        artifact: "profile.lock.json",
      }),
    );
  });

  it("does not require displayFontFamily to be set at all", () => {
    const source = buildSource([scene({ id: "one", durationMs: 3000 })]);

    const compiled = compileDraft(source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.value.fonts).toEqual([]);
  });
});
