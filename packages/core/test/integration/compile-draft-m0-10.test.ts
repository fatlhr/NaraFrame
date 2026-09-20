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
