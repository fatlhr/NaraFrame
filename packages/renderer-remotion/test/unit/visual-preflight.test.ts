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
