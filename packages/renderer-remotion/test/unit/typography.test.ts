import type { RenderTokens } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { fontFamilyForRole } from "../../src/remotion/typography.js";

const baseRender: RenderTokens = {
  palette: {
    background: "#000000",
    surface: "#111111",
    text: "#ffffff",
    accent: "#ff0000",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

describe("fontFamilyForRole", () => {
  it("uses the base family for every role when no displayFontFamily is declared", () => {
    expect(fontFamilyForRole(baseRender, "display")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(fontFamilyForRole(baseRender, "heading")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(fontFamilyForRole(baseRender, undefined)).toBe(
      "Arial, Helvetica, sans-serif",
    );
  });

  it("uses the bundled display family only for the display role once declared", () => {
    const withDisplay: RenderTokens = {
      ...baseRender,
      typography: {
        ...baseRender.typography,
        displayFontFamily: "Bundled Display",
      },
    };

    expect(fontFamilyForRole(withDisplay, "display")).toBe("Bundled Display");
    expect(fontFamilyForRole(withDisplay, "heading")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(fontFamilyForRole(withDisplay, "body")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(fontFamilyForRole(withDisplay, "label")).toBe(
      "Arial, Helvetica, sans-serif",
    );
    expect(fontFamilyForRole(withDisplay, undefined)).toBe(
      "Arial, Helvetica, sans-serif",
    );
  });
});
