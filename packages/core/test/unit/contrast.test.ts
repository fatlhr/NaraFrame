import type { Layer, RenderTokens } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import {
  checkContrast,
  contrastRatio,
  contrastThresholdFor,
} from "../../src/compiler/contrast.js";
import type { VarietyScene } from "../../src/compiler/variety.js";

const baseRender: RenderTokens = {
  palette: {
    background: "#11130F",
    surface: "#111111",
    text: "#F5F1E8",
    accent: "#ff0000",
  },
  typography: { fontFamily: "Arial", headingWeight: 700, bodyWeight: 400 },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

const textLayer = (
  overrides: Partial<Extract<Layer, { type: "text" }>> & { id: string },
): Extract<Layer, { type: "text" }> => ({
  type: "text",
  text: "Copy",
  frame: { x: 0, y: 0, width: 300, height: 80 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

const entryWith = (layers: Layer[]): VarietyScene[] => [
  {
    scene: {
      id: "probe",
      narrativeRole: "context",
      durationMs: 3000,
      visual: { type: "composition", layers: [] },
      beats: [],
      transition: { type: "cut" },
    },
    sceneIndex: 0,
    resolvedLayers: layers,
  },
];

describe("contrastRatio", () => {
  it("returns 21:1 for pure black against pure white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for identical colors", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = contrastRatio("#11130F", "#F5F1E8");
    const b = contrastRatio("#F5F1E8", "#11130F");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("contrastThresholdFor", () => {
  it("uses the large-text 3:1 bar at or above 24px", () => {
    expect(contrastThresholdFor(24)).toBe(3);
    expect(contrastThresholdFor(64)).toBe(3);
  });

  it("uses the normal-text 4.5:1 bar below 24px", () => {
    expect(contrastThresholdFor(23)).toBe(4.5);
    expect(contrastThresholdFor(12)).toBe(4.5);
  });
});

describe("checkContrast", () => {
  it("flags a text layer whose color nearly matches the background", () => {
    const layers = [
      textLayer({ id: "low-contrast", color: "#141610", fontSize: 34 }),
    ];

    const issues = checkContrast(entryWith(layers), baseRender);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        severity: "warning",
        entityId: "low-contrast",
      }),
    );
  });

  it("does not flag a text layer with strong contrast against the background", () => {
    const layers = [
      textLayer({ id: "high-contrast", color: "#F5F1E8", fontSize: 34 }),
    ];

    const issues = checkContrast(entryWith(layers), baseRender);

    expect(issues.map((issue) => issue.code)).not.toContain(
      "CONTRAST_INSUFFICIENT",
    );
  });

  it("falls back to the profile's default text color when a layer omits one", () => {
    const layers = [textLayer({ id: "default-color", fontSize: 34 })];

    const issues = checkContrast(entryWith(layers), baseRender);

    expect(issues.map((issue) => issue.code)).not.toContain(
      "CONTRAST_INSUFFICIENT",
    );
  });

  it("applies the large-text threshold so a borderline color can pass at 24px+ but fail below it", () => {
    // ~3.66:1 against #11130F — passes the 3:1 large-text bar, fails 4.5:1 normal-text.
    const borderlineColor = "#6e6e6e";
    const large = checkContrast(
      entryWith([
        textLayer({ id: "large", color: borderlineColor, fontSize: 40 }),
      ]),
      baseRender,
    );
    const normal = checkContrast(
      entryWith([
        textLayer({ id: "normal", color: borderlineColor, fontSize: 20 }),
      ]),
      baseRender,
    );

    expect(large.map((issue) => issue.code)).not.toContain(
      "CONTRAST_INSUFFICIENT",
    );
    expect(normal.map((issue) => issue.code)).toContain(
      "CONTRAST_INSUFFICIENT",
    );
  });

  it("ignores non-text layers", () => {
    const layers: Layer[] = [
      {
        type: "shape",
        id: "shape-only",
        shape: "rectangle",
        fill: "#141610",
        frame: { x: 0, y: 0, width: 100, height: 100 },
        opacity: 1,
        rotationDeg: 0,
        zIndex: 0,
      },
    ];

    const issues = checkContrast(entryWith(layers), baseRender);

    expect(issues).toEqual([]);
  });
});
