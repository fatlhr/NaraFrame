import type { CompiledDraft, Layer } from "@naraframe/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveVisualPreflight } from "../../src/remotion/visual-preflight.js";

// 0.6 em per character: at fontSize 20 each character is 12 px wide.
vi.mock("@remotion/layout-utils", () => ({
  measureText: ({ text, fontSize }: { text: string; fontSize: number }) => ({
    width: text.length * fontSize * 0.6,
    height: fontSize * 1.2,
  }),
}));

const render: CompiledDraft["profile"]["render"] = {
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

const textLayer = (id: string, y: number): Layer => ({
  type: "text",
  id,
  text: "Judul",
  frame: { x: 40, y, width: 460, height: 40 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
});

// Caption text width = 540 - 2 * 40 - 2 * 10 = 440 px = 36 characters per line.
const draftWith = (
  cueText: string,
  layers: Layer[] = [],
  maxLines = 2,
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
  profile: { id: "p", version: "0.1.0", render },
  assets: {},
  fonts: [],
  scenes: [
    {
      id: "probe",
      startFrame: 0,
      endFrame: 90,
      visual: { type: "composition" },
      layers,
      beats: [],
      transitionOut: { type: "cut" },
    },
  ],
  captions: {
    style: { fontSize: 20, maxLines, bottom: 60, side: 40 },
    cues: [{ id: "b/p1", text: cueText, startFrame: 10, endFrame: 80 }],
  },
});

const codes = (draft: CompiledDraft) =>
  resolveVisualPreflight(draft).report.issues.map((issue) => issue.code);

beforeEach(() => {
  (globalThis as unknown as { document: unknown }).document = {
    fonts: { check: () => true },
  };
});
afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
});

describe("caption preflight", () => {
  it("accepts a caption that fits within the allowed lines", () => {
    expect(codes(draftWith("Krakatau meletus pada tahun 1883."))).toEqual([]);
  });

  it("flags a caption that needs more lines than the profile allows", () => {
    const long =
      "Letusan besar tahun 1883 terdengar sampai ribuan kilometer jauhnya dan abunya menutupi langit";
    expect(codes(draftWith(long))).toContain("CAPTION_OVERFLOW");
    expect(codes(draftWith(long, [], 3))).not.toContain("CAPTION_OVERFLOW");
  });

  it("flags a single word wider than the caption box", () => {
    expect(codes(draftWith("x".repeat(60), [], 4))).toContain(
      "CAPTION_OVERFLOW",
    );
  });

  it("reports the offending cue on the captions path", () => {
    const { report } = resolveVisualPreflight(
      draftWith(
        "Letusan besar tahun 1883 terdengar sampai ribuan kilometer jauhnya dan abunya menutupi langit",
      ),
    );
    expect(
      report.issues.find((issue) => issue.code === "CAPTION_OVERFLOW"),
    ).toMatchObject({
      path: "/captions/cues/0",
      entityId: "b/p1",
    });
  });

  it("flags scene text that sits inside the caption zone", () => {
    // One line: box height 20 * 1.3 + 10 = 36, so it spans y 864..900.
    expect(
      codes(draftWith("Halo dunia.", [textLayer("title", 850)])),
    ).toContain("CAPTION_COLLISION");
  });

  it("does not flag scene text above the caption zone", () => {
    expect(
      codes(draftWith("Halo dunia.", [textLayer("title", 100)])),
    ).not.toContain("CAPTION_COLLISION");
  });

  it("samples a frame inside each cue so a mid-scene caption is still checked", () => {
    const { report } = resolveVisualPreflight(draftWith("Halo dunia."));
    expect(
      report.frames.some((frame) => frame.reasons.includes("caption:b/p1")),
    ).toBe(true);
  });

  it("reports FONT_NOT_LOADED for the caption font instead of measuring blindly", () => {
    (globalThis as unknown as { document: unknown }).document = {
      fonts: { check: () => false },
    };
    expect(codes(draftWith("Halo dunia."))).toContain("FONT_NOT_LOADED");
  });
});
