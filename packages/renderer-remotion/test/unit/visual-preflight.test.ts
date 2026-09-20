import type { CompiledDraft, Layer } from "@naraframe/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveVisualPreflight } from "../../src/remotion/visual-preflight.js";

vi.mock("@remotion/layout-utils", () => ({
  measureText: ({ text, fontSize }: { text: string; fontSize: number }) => ({
    width: text.length * fontSize * 0.6,
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
    // Each layer reveals in fully by frame 25 (own opacity reaches 1 well
    // before the checked "scene-settled" frame ~7 is even reached in
    // progress terms — it stays below the 0.9 gate on its own until then),
    // then the scene's own push-through exit (window [15,30)) fades the
    // whole scene back down through the "scene-final" checkpoint (29). If
    // that scene-level fade were not folded into the opacity gate, this
    // pair would read as fully opaque and colliding at frame 29.
    const revealBeat = (targetId: string) => ({
      id: `${targetId}-reveal`,
      targetId,
      action: "reveal" as const,
      startFrame: 0,
      durationInFrames: 25,
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
