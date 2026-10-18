import type { CompiledDraft, Layer } from "@naraframe/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveVisualPreflight } from "../../src/remotion/visual-preflight.js";

// Heavier type is wider. Weights at or below 700 measure exactly as before,
// so the older cases are unaffected while a span's own weight is observable.
vi.mock("@remotion/layout-utils", () => ({
  measureText: ({
    text,
    fontSize,
    fontWeight,
  }: {
    text: string;
    fontSize: number;
    fontWeight?: number;
  }) => ({
    width:
      text.length *
      fontSize *
      0.6 *
      (1 + Math.max(0, (fontWeight ?? 700) - 700) / 2000),
    height: fontSize * 1.2,
  }),
}));

const baseRender: CompiledDraft["profile"]["render"] = {
  palette: {
    background: "#000000",
    surface: "#111111",
    text: "#ffffff",
    accent: "#ff0000",
  },
  typography: {
    fontFamily: "Arial",
    headingWeight: 700,
    bodyWeight: 400,
    minimumFontSize: 14,
  },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

const draftWithScene = (
  layers: Layer[],
  beats: CompiledDraft["scenes"][number]["beats"] = [],
): CompiledDraft => ({
  schemaVersion: 1,
  mode: "draft",
  width: 540,
  height: 960,
  fps: 30,
  totalFrames: 90,
  scope: { type: "project" },
  timelineScope: "project",
  label: "DRAFT • NO AUDIO",
  sourceRevision: "a".repeat(64),
  assemblyKey: "b".repeat(64),
  profile: { id: "test-profile", version: "0.1.0", render: baseRender },
  assets: {},
  fonts: [],
  scenes: [
    {
      id: "probe",
      startFrame: 0,
      endFrame: 90,
      visual: { type: "composition" },
      layers,
      beats,
      transitionOut: { type: "cut" },
    },
  ],
});

const text = (overrides: {
  id: string;
  text: string;
  frame: { x: number; y: number; width: number; height: number };
  overflowPolicy?: "error" | "shrink";
  fontSize?: number;
}): Extract<Layer, { type: "text" }> => ({
  type: "text",
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

beforeEach(() => {
  (globalThis as unknown as { document: unknown }).document = {
    fonts: { check: () => true },
  };
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
});

describe("camera preflight", () => {
  it("checks a world label through its parent plane against fixed overlay text", () => {
    const draft = draftWithScene([
      text({
        id: "fixed",
        text: "A",
        frame: { x: 100, y: 400, width: 80, height: 80 },
      }),
      text({
        id: "label",
        text: "B",
        frame: { x: 300, y: 400, width: 80, height: 80 },
      }),
      {
        id: "world-rig",
        type: "group",
        space: "world",
        parallax: 1,
        memberIds: ["label"],
        transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
        zIndex: 1,
      },
    ]);
    const scene = draft.scenes[0];
    if (!scene) throw new Error("Missing scene fixture");
    scene.camera = {
      initial: { x: 0, y: 0, zoom: 1 },
      moves: [
        {
          id: "pan",
          startFrame: 0,
          durationInFrames: 30,
          to: { x: 200, y: 0, zoom: 1 },
          easingPreset: "linear",
        },
      ],
    };
    const { report } = resolveVisualPreflight(draft);
    expect(report.issues.map((i) => i.code)).toContain("TEXT_COLLISION");
    expect(
      report.frames.some((f) => f.reasons.includes("camera-settled:pan")),
    ).toBe(true);
  });
  it("reports required world text moved outside the canvas", () => {
    const label = {
      ...text({
        id: "label",
        text: "B",
        frame: { x: 100, y: 400, width: 80, height: 80 },
      }),
      space: "world" as const,
    };
    const draft = draftWithScene([label]);
    const scene = draft.scenes[0];
    if (!scene) throw new Error("Missing scene fixture");
    scene.camera = { initial: { x: 200, y: 0, zoom: 1 }, moves: [] };
    expect(
      resolveVisualPreflight(draft).report.issues.map((i) => i.code),
    ).toContain("TEXT_OUTSIDE_CANVAS");
  });
});

describe("resolveVisualPreflight — group transform folding", () => {
  it("flags a collision that only exists after the parent group's static transform is applied", () => {
    const layers: Layer[] = [
      text({
        id: "label-a",
        text: "AAAA",
        frame: { x: 100, y: 400, width: 300, height: 80 },
      }),
      text({
        id: "label-b",
        text: "BBBB",
        frame: { x: 500, y: 400, width: 300, height: 80 },
      }),
      {
        type: "group",
        id: "shift-group",
        memberIds: ["label-b"],
        transform: { x: -150, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
        zIndex: 1,
      },
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toContain(
      "TEXT_COLLISION",
    );
  });

  it("does not flag members that only overlap before the parent group's static transform separates them", () => {
    const layers: Layer[] = [
      text({
        id: "label-a",
        text: "AAAA",
        frame: { x: 350, y: 400, width: 300, height: 80 },
      }),
      text({
        id: "label-b",
        text: "BBBB",
        frame: { x: 500, y: 400, width: 300, height: 80 },
      }),
      {
        type: "group",
        id: "shift-group",
        memberIds: ["label-b"],
        transform: { x: 300, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
        zIndex: 1,
      },
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).not.toContain(
      "TEXT_COLLISION",
    );
  });
});

const draftWithScenes = (
  scenes: Array<{
    layers: Layer[];
    beats?: CompiledDraft["scenes"][number]["beats"];
    transitionOut?: CompiledDraft["scenes"][number]["transitionOut"];
    startFrame: number;
    endFrame: number;
  }>,
): CompiledDraft => ({
  schemaVersion: 1,
  mode: "draft",
  width: 540,
  height: 960,
  fps: 30,
  totalFrames: scenes.at(-1)?.endFrame ?? 0,
  scope: { type: "project" },
  timelineScope: "project",
  label: "DRAFT • NO AUDIO",
  sourceRevision: "a".repeat(64),
  assemblyKey: "b".repeat(64),
  profile: { id: "test-profile", version: "0.1.0", render: baseRender },
  assets: {},
  fonts: [],
  scenes: scenes.map((entry, index) => ({
    id: `scene-${index}`,
    startFrame: entry.startFrame,
    endFrame: entry.endFrame,
    visual: { type: "composition" },
    layers: entry.layers,
    beats: entry.beats ?? [],
    transitionOut: entry.transitionOut ?? { type: "cut" },
  })),
});

describe("resolveVisualPreflight — scene-transition folding", () => {
  it("still flags a real collision even while a later exit transition will eventually fade it", () => {
    const overlapping: Layer[] = [
      text({
        id: "label-a",
        text: "AAAA",
        frame: { x: 100, y: 400, width: 300, height: 80 },
      }),
      text({
        id: "label-b",
        text: "BBBB",
        frame: { x: 150, y: 400, width: 300, height: 80 },
      }),
    ];
    const draft = draftWithScenes([
      {
        layers: overlapping,
        startFrame: 0,
        endFrame: 30,
        // A short exit window near the tail leaves "scene-entry" (frame 0)
        // and "scene-settled" (frame ~7) fully outside it and fully opaque.
        transitionOut: {
          type: "push-through",
          durationInFrames: 5,
          direction: "left",
        },
      },
      { layers: [], startFrame: 30, endFrame: 60 },
    ]);

    const { report } = resolveVisualPreflight(draft);

    expect(report.issues.map((issue) => issue.code)).toContain(
      "TEXT_COLLISION",
    );
  });

  it("folds the exit transition's fade into visibility, suppressing a collision that is only ever on-screen at low opacity", () => {
    // Each layer reveals slowly (40 frames), so its own opacity stays below
    // the 0.9 gate through the window's first sampled frame (15) and the
    // scene's own push-through exit (window [15,30)) fades the whole scene
    // back down through the later checkpoints (22 and 29). If that
    // scene-level fade were not folded into the opacity gate, this pair would
    // read as fully opaque and colliding at frame 29.
    const revealBeat = (targetId: string) => ({
      id: `${targetId}-reveal`,
      targetId,
      action: "reveal" as const,
      startFrame: 0,
      durationInFrames: 40,
      params: { direction: "up" as const, distance: 0 },
    });
    const overlapping: Layer[] = [
      text({
        id: "label-a",
        text: "AAAA",
        frame: { x: 100, y: 400, width: 300, height: 80 },
      }),
      text({
        id: "label-b",
        text: "BBBB",
        frame: { x: 150, y: 400, width: 300, height: 80 },
      }),
    ];
    const draft = draftWithScenes([
      {
        layers: overlapping,
        beats: [revealBeat("label-a"), revealBeat("label-b")],
        startFrame: 0,
        endFrame: 30,
        transitionOut: {
          type: "push-through",
          durationInFrames: 15,
          direction: "left",
        },
      },
      { layers: [], startFrame: 30, endFrame: 60 },
    ]);

    const { report } = resolveVisualPreflight(draft);

    expect(report.issues.map((issue) => issue.code)).not.toContain(
      "TEXT_COLLISION",
    );
  });

  it("does not introduce a false collision between separated layers during an active entry transition", () => {
    const separated: Layer[] = [
      text({
        id: "label-a",
        text: "AAAA",
        frame: { x: 40, y: 400, width: 200, height: 80 },
      }),
      text({
        id: "label-b",
        text: "BBBB",
        frame: { x: 300, y: 400, width: 200, height: 80 },
      }),
    ];
    const draft = draftWithScenes([
      {
        layers: [],
        startFrame: 0,
        endFrame: 30,
        transitionOut: {
          type: "match-cut",
          durationInFrames: 15,
          anchor: { x: 0.5, y: 0.5 },
        },
      },
      { layers: separated, startFrame: 30, endFrame: 60 },
    ]);

    const { report } = resolveVisualPreflight(draft);

    expect(report.issues.map((issue) => issue.code)).not.toContain(
      "TEXT_COLLISION",
    );
  });
});

describe("resolveVisualPreflight — layer issue codes", () => {
  it("flags overlapping ungrouped text layers as TEXT_COLLISION", () => {
    const layers: Layer[] = [
      text({
        id: "left",
        text: "Left",
        frame: { x: 100, y: 400, width: 300, height: 80 },
      }),
      text({
        id: "right",
        text: "Right",
        frame: { x: 350, y: 400, width: 300, height: 80 },
      }),
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toContain(
      "TEXT_COLLISION",
    );
  });

  it("flags text that cannot fit its box under a strict overflow policy as TEXT_OVERFLOW", () => {
    const layers: Layer[] = [
      text({
        id: "tight",
        text: "This copy is far too long for its declared box.",
        frame: { x: 0, y: 0, width: 5, height: 10 },
        overflowPolicy: "error",
      }),
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toContain("TEXT_OVERFLOW");
  });

  it("says an overflowing layer's collision check waits until it fits, and in which pixels its box is", () => {
    // F2: the collision below exists either way; it is reported only once
    // the overflow is fixed, and the overflow message now says so.
    const overlapping = (copy: string): Layer[] => [
      text({
        id: "upper",
        text: copy,
        frame: { x: 100, y: 400, width: 300, height: 80 },
        overflowPolicy: "error",
      }),
      text({
        id: "lower",
        text: "Lower",
        frame: { x: 100, y: 420, width: 300, height: 80 },
      }),
    ];

    const overflowing = resolveVisualPreflight(
      draftWithScene(
        overlapping(
          "This copy is far too long for its declared box and keeps going on.",
        ),
      ),
    ).report.issues;
    const fitting = resolveVisualPreflight(draftWithScene(overlapping("Upper")))
      .report.issues;

    const overflow = overflowing.find(
      (issue) => issue.code === "TEXT_OVERFLOW",
    );
    expect(overflow?.message).toContain("box (draft pixels; the draft is ");
    expect(overflow?.message).toContain(
      "Its collision and off-canvas checks run once it fits",
    );
    expect(overflowing.map((issue) => issue.code)).not.toContain(
      "TEXT_COLLISION",
    );
    expect(fitting.map((issue) => issue.code)).toContain("TEXT_COLLISION");
  });

  it("flags shrink-to-fit text that bottoms out at the profile minimum as MIN_FONT_SIZE_VIOLATION", () => {
    const layers: Layer[] = [
      text({
        id: "shrinking",
        text: "This copy is far too long for its declared box.",
        frame: { x: 0, y: 0, width: 5, height: 10 },
        overflowPolicy: "shrink",
      }),
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toContain(
      "MIN_FONT_SIZE_VIOLATION",
    );
  });

  it("flags a layer whose font failed to load as FONT_NOT_LOADED and skips measurement", () => {
    (globalThis as unknown as { document: unknown }).document = {
      fonts: { check: () => false },
    };
    const layers: Layer[] = [
      text({
        id: "unloaded",
        text: "Hello",
        frame: { x: 0, y: 0, width: 300, height: 80 },
      }),
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toEqual([
      "FONT_NOT_LOADED",
    ]);
  });

  it("flags an image whose corner radius exceeds half its shortest edge as IMAGE_MASK_INVALID", () => {
    const layers: Layer[] = [
      {
        type: "image",
        id: "portrait",
        assetId: "unused",
        fit: "cover",
        frame: { x: 0, y: 0, width: 100, height: 60 },
        cornerRadius: 50,
        opacity: 1,
        rotationDeg: 0,
        zIndex: 0,
      },
    ];

    const { report } = resolveVisualPreflight(draftWithScene(layers));

    expect(report.issues.map((issue) => issue.code)).toContain(
      "IMAGE_MASK_INVALID",
    );
  });
});

describe("resolveVisualPreflight — panel dead space", () => {
  const shape = (overrides: {
    id: string;
    frame: { x: number; y: number; width: number; height: number };
    zIndex?: number;
    opacity?: number;
  }): Extract<Layer, { type: "shape" }> => ({
    type: "shape",
    shape: "rectangle",
    fill: "#E8E0D2",
    opacity: 1,
    rotationDeg: 0,
    zIndex: 0,
    ...overrides,
  });

  const image = (overrides: {
    id: string;
    frame: { x: number; y: number; width: number; height: number };
    zIndex?: number;
  }): Extract<Layer, { type: "image" }> => ({
    type: "image",
    assetId: "krakatau-map",
    fit: "cover",
    opacity: 1,
    rotationDeg: 0,
    zIndex: 1,
    ...overrides,
  });

  /**
   * The owner's own failing scene: samples/krakatau-narrated, scene "context".
   * The cream panel runs 1040 px tall while the map on it ends 345 px short
   * of its bottom edge, which reads on screen as an unfinished block.
   */
  const krakatauContextLayers = (): Layer[] => [
    shape({
      id: "map-panel",
      frame: { x: 88, y: 280, width: 904, height: 1040 },
    }),
    image({
      id: "map-image",
      frame: { x: 130, y: 360, width: 820, height: 615 },
    }),
    shape({
      id: "eruption-ring",
      frame: { x: 480, y: 760, width: 120, height: 120 },
      opacity: 0.28,
    }),
    shape({
      id: "eruption-core",
      frame: { x: 515, y: 795, width: 50, height: 50 },
      zIndex: 1,
    }),
    text({
      id: "context-copy",
      text: "1883",
      frame: { x: 88, y: 1340, width: 904, height: 140 },
    }),
  ];

  const deadSpace = (layers: Layer[]) =>
    resolveVisualPreflight(draftWithScene(layers)).report.issues.filter(
      (issue) => issue.code === "PANEL_DEAD_SPACE",
    );

  it("catches the empty band under the Krakatau map, naming the side and the size", () => {
    const issues = deadSpace(krakatauContextLayers());
    expect(issues).toHaveLength(1);
    expect(issues[0]?.entityId).toBe("map-panel");
    expect(issues[0]?.severity).toBe("warning");
    expect(issues[0]?.message).toContain("bottom");
    expect(issues[0]?.message).toContain("33%");
    expect(issues[0]?.message).toContain("345 px");
  });

  it("goes quiet once the panel is sized to the map it holds", () => {
    const fixed = krakatauContextLayers().map((layer) =>
      layer.id === "map-panel"
        ? shape({
            id: "map-panel",
            frame: { x: 88, y: 280, width: 904, height: 775 },
          })
        : layer,
    );
    expect(deadSpace(fixed)).toEqual([]);
  });

  it("accepts an even padding and ignores a panel with nothing on it at all", () => {
    expect(
      deadSpace([
        shape({ id: "panel", frame: { x: 0, y: 0, width: 500, height: 500 } }),
        image({ id: "art", frame: { x: 40, y: 40, width: 420, height: 420 } }),
      ]),
    ).toEqual([]);
    // A bare backdrop is a deliberate choice, not a layout mistake.
    expect(
      deadSpace([
        shape({ id: "panel", frame: { x: 0, y: 0, width: 500, height: 500 } }),
      ]),
    ).toEqual([]);
  });

  it("does not count content hidden behind the panel", () => {
    const issues = deadSpace([
      image({
        id: "behind",
        frame: { x: 10, y: 10, width: 480, height: 480 },
        zIndex: 0,
      }),
      shape({
        id: "panel",
        frame: { x: 0, y: 0, width: 500, height: 500 },
        zIndex: 1,
      }),
      image({
        id: "small",
        frame: { x: 200, y: 200, width: 100, height: 100 },
        zIndex: 2,
      }),
    ]);
    expect(issues).toHaveLength(1);
  });

  it("leaves a drawn object alone: water with an ice cube across its surface, or a thin line", () => {
    // A filled rectangle that is the artwork, with a shape only partly over it.
    expect(
      deadSpace([
        shape({
          id: "water",
          frame: { x: 88, y: 900, width: 904, height: 600 },
        }),
        shape({
          id: "ice-cube",
          frame: { x: 700, y: 820, width: 120, height: 120 },
          zIndex: 1,
        }),
      ]),
    ).toEqual([]);
    // The same with a shape wholly inside: still a drawing, not a panel.
    expect(
      deadSpace([
        shape({
          id: "water",
          frame: { x: 0, y: 900, width: 900, height: 600 },
        }),
        shape({
          id: "cube",
          frame: { x: 700, y: 950, width: 100, height: 100 },
          zIndex: 1,
        }),
      ]),
    ).toEqual([]);
    // A thin rule with a label that only touches it.
    expect(
      deadSpace([
        shape({ id: "rule", frame: { x: 88, y: 700, width: 904, height: 6 } }),
        text({
          id: "label",
          text: "Today",
          frame: { x: 88, y: 690, width: 200, height: 60 },
          zIndex: 1,
        }),
      ]),
    ).toEqual([]);
  });

  it("measures a group by the members it holds", () => {
    const issues = deadSpace([
      shape({ id: "panel", frame: { x: 0, y: 0, width: 500, height: 500 } }),
      image({
        id: "a",
        frame: { x: 40, y: 40, width: 200, height: 420 },
        zIndex: 1,
      }),
      image({
        id: "b",
        frame: { x: 260, y: 40, width: 200, height: 420 },
        zIndex: 1,
      }),
      { type: "group", id: "pair", memberIds: ["a", "b"], zIndex: 2 },
    ]);
    expect(issues).toEqual([]);
  });
});

describe("resolveVisualPreflight — rich text and per-role fonts", () => {
  const headline = (
    spans: Array<{ text: string; emphasis?: "accent" | "strong" | "quiet" }>,
    width = 520,
  ): Extract<Layer, { type: "text" }> => ({
    ...text({
      id: "headline",
      text: spans.map((span) => span.text).join(""),
      frame: { x: 0, y: 0, width, height: 300 },
      fontSize: 40,
    }),
    role: "display",
    fontWeight: 700,
    spans,
  });

  const draftWithFont = (
    layers: Layer[],
    roles: Record<string, { fontFamily?: string }> = {},
  ): CompiledDraft => {
    const draft = draftWithScene(layers);
    return {
      ...draft,
      fonts: [
        {
          family: "Label Mono",
          publicPath: "assets/profile/label.ttf",
          sha256: "c".repeat(64),
        },
      ],
      profile: {
        ...draft.profile,
        render: {
          ...draft.profile.render,
          typography: {
            ...draft.profile.render.typography,
            roles: {
              display: {
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: 0,
                ...roles.display,
              },
              heading: {
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: 0,
                ...roles.heading,
              },
              body: {
                fontSize: 24,
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: 0,
                ...roles.body,
              },
              label: {
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: 2,
                ...roles.label,
              },
            },
          },
        },
      },
    };
  };

  const issuesFor = (draft: CompiledDraft) =>
    resolveVisualPreflight(draft).report.issues.map((issue) => issue.code);

  const wrappedLines = (layer: Layer, roles = {}) => {
    const draft = draftWithFont([layer], roles);
    // The wrapped result is what the overflow check reads, so a line count
    // change is the observable consequence of measuring a run at its weight.
    const report = resolveVisualPreflight(draft).report;
    return report.issues.filter((issue) => issue.code === "TEXT_OVERFLOW")
      .length;
  };

  it("measures an accented run at the weight it is painted in, not the base weight", () => {
    // "Katanya semrawut" is 16 characters: 384px at the base weight, which
    // fits this 390px box on one line. Painting "semrawut" heavier makes it
    // 403px, so it wraps to a second line and no longer fits the height.
    const box = { x: 0, y: 0, width: 390, height: 50 };
    const plain = {
      ...headline([{ text: "Katanya semrawut" }]),
      frame: box,
      overflowPolicy: "error" as const,
    };
    const heavy = {
      ...headline([
        { text: "Katanya " },
        { text: "semrawut", emphasis: "strong" as const },
      ]),
      frame: box,
      overflowPolicy: "error" as const,
    };
    expect(wrappedLines(plain)).toBe(0);
    expect(wrappedLines(heavy)).toBe(1);
  });

  it("still reports an overflow that the spans themselves cause", () => {
    const layer = headline(
      [
        { text: "Medan? " },
        { text: "Katanya", emphasis: "quiet" },
        { text: " semrawut", emphasis: "accent" },
      ],
      120,
    );
    expect(
      issuesFor(draftWithFont([{ ...layer, overflowPolicy: "error" }])),
    ).toContain("TEXT_OVERFLOW");
  });

  it("measures a role in its own bundled face, and reports that face when it fails to load", () => {
    const label: Layer = {
      ...text({
        id: "place",
        text: "MEDAN · SUMATERA UTARA",
        frame: { x: 0, y: 0, width: 500, height: 60 },
        fontSize: 18,
      }),
      role: "label",
    };
    const draft = draftWithFont([label], {
      label: { fontFamily: "Label Mono" },
    });
    // The family is declared as a bundled asset but nothing loaded it here.
    expect(
      resolveVisualPreflight(draft, new Set()).report.issues.map((i) => i.code),
    ).toContain("FONT_NOT_LOADED");
    expect(
      resolveVisualPreflight(draft, new Set(["Label Mono"])).report.issues.map(
        (i) => i.code,
      ),
    ).not.toContain("FONT_NOT_LOADED");
  });

  it("leaves a layer with no spans measured exactly as before", () => {
    const legacy: Layer = text({
      id: "legacy",
      text: "Satu baris lama",
      frame: { x: 0, y: 0, width: 520, height: 120 },
      fontSize: 40,
    });
    expect(issuesFor(draftWithScene([legacy]))).toEqual([]);
  });
});

describe("M2.4.3 preflight", () => {
  it("checks a rotated label by its outline, not the box around it", () => {
    // A long label turned 41 degrees: its bounding box reaches the short
    // label at its corner, but the text itself passes well clear of it.
    const rotated = {
      ...text({
        id: "strait",
        text: "SELAT MALAKA",
        frame: { x: 100, y: 400, width: 290, height: 32 },
        fontSize: 20,
      }),
      rotationDeg: 41,
    };
    const corner = text({
      id: "country",
      text: "MY",
      frame: { x: 330, y: 330, width: 40, height: 30 },
      fontSize: 20,
    });
    const clear = resolveVisualPreflight(draftWithScene([rotated, corner]));
    expect(clear.report.issues.map((i) => i.code)).not.toContain(
      "TEXT_COLLISION",
    );
    const onTheLine = text({
      id: "country",
      text: "MY",
      frame: { x: 225, y: 400, width: 40, height: 30 },
      fontSize: 20,
    });
    const hit = resolveVisualPreflight(draftWithScene([rotated, onTheLine]));
    expect(hit.report.issues.map((i) => i.code)).toContain("TEXT_COLLISION");
  });

  it("reports a path with no drawable length", () => {
    const { report } = resolveVisualPreflight(
      draftWithScene([
        {
          id: "dot",
          type: "path",
          d: "M10 10",
          viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
          frame: { x: 0, y: 0, width: 100, height: 100 },
          stroke: { color: "#ffffff", width: 2 },
          opacity: 1,
          rotationDeg: 0,
          zIndex: 0,
        },
      ]),
    );
    expect(report.issues.map((i) => i.code)).toContain("PATH_INVALID");
  });

  it("measures a counted layer at each count's start and end values", () => {
    // "9" fits in one line; "1.000.000" at the same size does not.
    const layer = text({
      id: "figure",
      text: "9",
      frame: { x: 0, y: 0, width: 60, height: 30 },
      fontSize: 20,
    });
    const { report } = resolveVisualPreflight(
      draftWithScene(
        [layer],
        [
          {
            id: "count",
            targetId: "figure",
            action: "count",
            startFrame: 0,
            durationInFrames: 30,
            params: { from: 1000000, to: 9, grouping: "." },
          },
        ],
      ),
    );
    expect(report.issues.map((i) => i.code)).toContain("TEXT_OVERFLOW");
  });
});

describe("resolveVisualPreflight — motion-aware text checks (F1)", () => {
  const headline = (id = "headline"): Extract<Layer, { type: "text" }> =>
    text({
      id,
      text: "A",
      // Close to both side edges of the 540px canvas.
      frame: { x: 20, y: 400, width: 500, height: 100 },
    });

  const frameOf = (message: string): number =>
    Number(/at frame (\d+)/.exec(message)?.[1]);

  const withSafeZone = (
    draft: CompiledDraft,
    safeZone: CompiledDraft["profile"]["render"]["safeZone"],
  ): CompiledDraft => ({
    ...draft,
    profile: {
      ...draft.profile,
      render: { ...draft.profile.render, safeZone },
    },
  });

  const issuesOf = (draft: CompiledDraft, code: string) =>
    resolveVisualPreflight(draft).report.issues.filter(
      (issue) => issue.code === code,
    );

  it("flags a near-edge headline pushed off the canvas by a match-cut zoom, inside the transition window", () => {
    // No camera and no transform beat: the scene transition alone carries it.
    const draft = draftWithScenes([
      {
        layers: [headline()],
        startFrame: 0,
        endFrame: 60,
        transitionOut: {
          type: "match-cut",
          durationInFrames: 20,
          anchor: { x: 0.5, y: 0.5 },
        },
      },
      { layers: [], startFrame: 60, endFrame: 120 },
    ]);

    const { report } = resolveVisualPreflight(draft);
    const issues = report.issues.filter(
      (issue) => issue.code === "TEXT_OUTSIDE_CANVAS",
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("error");
    expect(issues[0]?.entityId).toBe("headline");
    const frame = frameOf(issues[0]?.message ?? "");
    expect(frame).toBeGreaterThanOrEqual(40);
    expect(frame).toBeLessThan(60);
  });

  it("flags the same headline while a match-cut zoom settles into its scene", () => {
    const draft = draftWithScenes([
      {
        layers: [],
        startFrame: 0,
        endFrame: 60,
        transitionOut: {
          type: "match-cut",
          durationInFrames: 20,
          anchor: { x: 0.5, y: 0.5 },
        },
      },
      { layers: [headline()], startFrame: 60, endFrame: 120 },
    ]);

    const issues = issuesOf(draft, "TEXT_OUTSIDE_CANVAS");

    expect(issues).toHaveLength(1);
    expect(frameOf(issues[0]?.message ?? "")).toBeLessThan(80);
  });

  it("accepts the same headline under a fading push-through, which is below full opacity wherever it travels", () => {
    const draft = draftWithScenes([
      {
        layers: [headline()],
        startFrame: 0,
        endFrame: 60,
        transitionOut: {
          type: "push-through",
          durationInFrames: 20,
          direction: "left",
        },
      },
      { layers: [], startFrame: 60, endFrame: 120 },
    ]);

    expect(resolveVisualPreflight(draft).report.issues).toEqual([]);
  });

  it("samples the start and midpoint of each transition window", () => {
    const draft = draftWithScenes([
      {
        layers: [],
        startFrame: 0,
        endFrame: 60,
        transitionOut: {
          type: "push-through",
          durationInFrames: 20,
          direction: "left",
        },
      },
      { layers: [], startFrame: 60, endFrame: 120 },
    ]);

    const { report } = resolveVisualPreflight(draft);
    const reasonsAt = (frame: number) =>
      report.frames.find((item) => item.frame === frame)?.reasons ?? [];

    expect(reasonsAt(40)).toContain("transition-out-start");
    expect(reasonsAt(50)).toContain("transition-out-mid");
    expect(reasonsAt(60)).toContain("transition-in-start");
    expect(reasonsAt(70)).toContain("transition-in-mid");
  });

  it("adds no transition frames and no issues to a static scene", () => {
    const draft = draftWithScene([
      text({
        id: "still",
        text: "A",
        frame: { x: 100, y: 400, width: 300, height: 80 },
      }),
    ]);

    const { report } = resolveVisualPreflight(
      withSafeZone(draft, { top: 40, right: 40, bottom: 40, left: 40 }),
    );

    expect(report.issues).toEqual([]);
    expect(
      report.frames.some((item) =>
        item.reasons.some((reason) => reason.startsWith("transition-")),
      ),
    ).toBe(false);
  });

  const slideIn = (distance: number, x: number) => {
    const layer = text({
      id: "title",
      text: "A",
      // Inside the 40px safe zone at rest.
      frame: { x, y: 400, width: 460, height: 100 },
    });
    return withSafeZone(
      draftWithScene(
        [layer],
        [
          {
            id: "title-reveal",
            targetId: "title",
            action: "reveal",
            startFrame: 0,
            durationInFrames: 30,
            params: { direction: "right", distance },
          },
        ],
      ),
      { top: 0, right: 40, bottom: 0, left: 40 },
    );
  };

  it("warns once when a reveal slides readable text out of the safe zone before it settles inside", () => {
    const issues = issuesOf(slideIn(120, 40), "TEXT_OUTSIDE_SAFE_ZONE");

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("warning");
    expect(issues[0]?.entityId).toBe("title");
    expect(Number.isInteger(frameOf(issues[0]?.message ?? ""))).toBe(true);
    // It never leaves the canvas, so there is no canvas error.
    expect(issuesOf(slideIn(120, 40), "TEXT_OUTSIDE_CANVAS")).toEqual([]);
  });

  it("does not warn when the reveal stays inside the safe zone", () => {
    expect(issuesOf(slideIn(20, 80), "TEXT_OUTSIDE_SAFE_ZONE")).toEqual([]);
  });

  it("judges a short left-aligned line by its glyphs, not by the wide box it sits in", () => {
    // The box spans the safe zone exactly, as a full-width headline box does.
    // Sliding it in from the right pushes the box, but not the glyphs, over
    // the right safe edge; sliding it in from the left does push the glyphs.
    const slide = (direction: "left" | "right") => {
      const draft = slideIn(24, 40);
      const scene = draft.scenes[0];
      const beat = scene?.beats[0];
      if (!scene || beat?.action !== "reveal") {
        throw new Error("Missing reveal fixture");
      }
      beat.params.direction = direction;
      return draft;
    };

    expect(issuesOf(slide("left"), "TEXT_OUTSIDE_SAFE_ZONE")).toEqual([]);
    expect(issuesOf(slide("right"), "TEXT_OUTSIDE_SAFE_ZONE")).toHaveLength(1);
  });

  it("does not warn about camera-framed world text, whose screen position is the camera's", () => {
    const label = {
      ...text({
        id: "label",
        text: "B",
        frame: { x: 100, y: 400, width: 80, height: 80 },
      }),
      space: "world" as const,
    };
    const draft = withSafeZone(draftWithScene([label]), {
      top: 0,
      right: 0,
      bottom: 0,
      left: 40,
    });
    const scene = draft.scenes[0];
    if (!scene) throw new Error("Missing scene fixture");
    scene.camera = { initial: { x: 80, y: 0, zoom: 1 }, moves: [] };

    expect(resolveVisualPreflight(draft).report.issues).toEqual([]);
  });
});
