import type { CompiledDraft, RenderTokens } from "@naraframe/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fontFamilyForRole,
  loadBundledFonts,
} from "../../src/remotion/typography.js";

describe("per-face font readiness", () => {
  afterEach(() => vi.unstubAllGlobals());

  const setup = (failBold: boolean) => {
    vi.stubGlobal(
      "FontFace",
      class {
        weight: string;
        constructor(
          _family: string,
          _src: string,
          options: { weight: string },
        ) {
          this.weight = options.weight;
        }
        async load() {
          if (failBold && this.weight === "700") throw new Error("broken bold");
          return this;
        }
      },
    );
    vi.stubGlobal("document", { fonts: { add: vi.fn(), check: () => true } });
    return [400, 700].map((weight) => ({
      family: "Shared Face",
      weight,
      publicPath: `${weight}.ttf`,
    })) as CompiledDraft["fonts"];
  };

  it("rejects a broken weight even when another face registers the same family", async () => {
    await expect(
      loadBundledFonts(setup(true), { requireAllFaces: true }),
    ).rejects.toThrow("NARAFRAME_FONT_UNAVAILABLE: Shared Face 700");
  });

  it("loads both valid faces and preserves the family-based preflight interface", async () => {
    await expect(
      loadBundledFonts(setup(false), { requireAllFaces: true }),
    ).resolves.toEqual(new Set(["Shared Face"]));
  });
});

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
