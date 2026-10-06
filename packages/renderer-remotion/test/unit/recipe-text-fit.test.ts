import type { CompiledDraft, CompiledTextSlot } from "@naraframe/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { measureSlotText } from "../../src/remotion/recipe-text-fit.js";
import { resolveVisualPreflight } from "../../src/remotion/visual-preflight.js";

// Every character is 0.5em plus the letter spacing, like CSS letter-spacing.
// Only white-space: pre keeps space runs; the caller collapses them otherwise.
const measured: Array<{ text: string; whiteSpace?: string }> = [];
vi.mock("@remotion/layout-utils", () => ({
  measureText: ({
    text,
    fontSize,
    letterSpacing,
    additionalStyles,
  }: {
    text: string;
    fontSize: number;
    letterSpacing?: string;
    additionalStyles?: { whiteSpace?: string };
  }) => {
    measured.push({ text, whiteSpace: additionalStyles?.whiteSpace });
    const spacing = Number.parseFloat(letterSpacing ?? "0");
    return {
      width: text.length * (fontSize * 0.5 + spacing),
      height: fontSize,
    };
  },
}));

const fontsLoaded = { value: true };
beforeEach(() => {
  measured.length = 0;
  fontsLoaded.value = true;
  (globalThis as unknown as { document: unknown }).document = {
    fonts: { check: () => fontsLoaded.value },
  };
});
afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
});

// 100px type: 50px per character with no spacing.
const style = (
  overrides: Partial<CompiledTextSlot["style"]> = {},
): CompiledTextSlot["style"] => ({
  fontFamily: "Probe Face",
  fontWeight: 700,
  fontSize: 100,
  lineHeight: 110,
  letterSpacing: 0,
  width: 500,
  height: 110,
  maxLines: 1,
  wrap: "words",
  ...overrides,
});

describe("recipe text slot measurement", () => {
  it("wraps words at spaces and counts lines against maxLines", () => {
    expect(measureSlotText("abcd efgh", style())).toMatchObject({
      lines: ["abcd efgh"],
      overflow: false,
    });
    expect(measureSlotText("abcde fghij", style())).toMatchObject({
      lines: ["abcde", "fghij"],
      overflow: true,
      reason: "lines",
    });
    // Two lines allowed, but the box is one line tall.
    expect(
      measureSlotText("abcde fghij", style({ maxLines: 2 })),
    ).toMatchObject({ overflow: true, reason: "height" });
    expect(
      measureSlotText("abcde fghij", style({ maxLines: 2, height: 220 })),
    ).toMatchObject({ overflow: false });
  });

  it("flags a single word wider than the box", () => {
    expect(
      measureSlotText("abcdefghijk", style({ maxLines: 3, height: 400 })),
    ).toMatchObject({ overflow: true, reason: "width", widest: 550 });
  });

  it("collapses space runs and honours newlines in words mode (pre-line)", () => {
    expect(measureSlotText("ab    cd", style()).lines).toEqual(["ab cd"]);
    expect(measured.every((entry) => entry.whiteSpace === undefined)).toBe(
      true,
    );
    expect(measureSlotText("ab\ncd", style())).toMatchObject({
      lines: ["ab", "cd"],
      overflow: true,
      reason: "lines",
    });
    expect(
      measureSlotText("ab\ncd", style({ maxLines: 2, height: 220 })).overflow,
    ).toBe(false);
  });

  it("measures each whole line with spaces kept in none mode (pre)", () => {
    // Several words that would wrap in words mode stay on one line.
    expect(measureSlotText("ab cd ef", style({ wrap: "none" }))).toMatchObject({
      lines: ["ab cd ef"],
      overflow: false,
    });
    expect(
      measureSlotText("ab cd efg hi", style({ wrap: "none", maxLines: 3 })),
    ).toMatchObject({ overflow: true, reason: "width", widest: 600 });
    expect(measured.at(-1)?.whiteSpace).toBe("pre");
    // Kept spaces count: four spaces make the line wider than one.
    expect(measureSlotText("ab    cd", style({ wrap: "none" })).widest).toBe(
      400,
    );
    expect(measureSlotText("ab\ncd", style({ wrap: "none" }))).toMatchObject({
      lines: ["ab", "cd"],
      overflow: true,
      reason: "lines",
    });
  });

  it("applies negative letter spacing as rendered", () => {
    // 11 characters: 550px at 0, 440px at -10px per character.
    expect(
      measureSlotText("abcde fghij", style({ wrap: "none" })).overflow,
    ).toBe(true);
    expect(
      measureSlotText(
        "abcde fghij",
        style({ wrap: "none", letterSpacing: -10 }),
      ).overflow,
    ).toBe(false);
  });
});

describe("CSS line boxes and white space (supervisor P2-F1, P2-F2)", () => {
  const both = ["words", "none"] as const;

  it("does not count a terminal newline as a line", () => {
    for (const wrap of both) {
      expect(measureSlotText("abc\n", style({ wrap }))).toMatchObject({
        lines: ["abc"],
        overflow: false,
      });
      expect(measureSlotText("abc\n\n", style({ wrap }))).toMatchObject({
        lines: ["abc", ""],
        overflow: true,
        reason: "lines",
      });
      expect(measureSlotText("\n", style({ wrap })).lines).toEqual([""]);
    }
  });

  it("keeps internal blank lines", () => {
    for (const wrap of both) {
      expect(
        measureSlotText("a\n\nb", style({ wrap, maxLines: 3, height: 330 })),
      ).toMatchObject({ lines: ["a", "", "b"], overflow: false });
    }
  });

  it("paints no line for empty text, even in a box shorter than a line", () => {
    for (const wrap of both) {
      expect(measureSlotText("", style({ wrap, height: 50 }))).toMatchObject({
        lines: [],
        overflow: false,
      });
    }
    // Collapsible spaces alone paint nothing in pre-line, one line in pre.
    expect(measureSlotText("   ", style({ height: 50 })).lines).toEqual([]);
    expect(measureSlotText("   ", style({ wrap: "none" })).lines).toEqual([
      "   ",
    ]);
  });

  it("treats CR LF as one break and a lone CR as a space", () => {
    for (const wrap of both) {
      expect(
        measureSlotText("ab\r\ncd", style({ wrap, maxLines: 2, height: 220 }))
          .lines,
      ).toEqual(["ab", "cd"]);
    }
    expect(measureSlotText("ab\rcd", style()).lines).toEqual(["ab cd"]);
    expect(measureSlotText("ab\rcd", style({ wrap: "none" })).widest).toBe(250);
  });

  it("keeps NBSP and other non-collapsible spaces in pre-line", () => {
    const nbsp = "\u00a0\u00a0WWWW\u00a0\u00a0";
    // 8 characters at 50px: 400px in a 350px box.
    expect(measureSlotText(nbsp, style({ width: 350 }))).toMatchObject({
      lines: [nbsp],
      overflow: true,
      reason: "width",
      widest: 400,
    });
    // Ordinary spaces at the edges collapse away: 200px fits.
    expect(measureSlotText("  WWWW  ", style({ width: 350 }))).toMatchObject({
      lines: ["WWWW"],
      overflow: false,
      widest: 200,
    });
    const ideographic = "\u3000ab\u3000";
    expect(measureSlotText(ideographic, style()).lines).toEqual([ideographic]);
    expect(measureSlotText(ideographic, style()).widest).toBe(200);
    // Tabs are collapsible in pre-line.
    expect(measureSlotText("ab\t\tcd", style()).lines).toEqual(["ab cd"]);
  });
});

const recipeDraft = (
  width: number,
  textSlots: CompiledTextSlot[] | undefined,
): CompiledDraft =>
  ({
    schemaVersion: 1,
    mode: "draft",
    width,
    height: (width * 16) / 9,
    fps: 30,
    totalFrames: 30,
    scope: { type: "project" },
    timelineScope: "project",
    label: "DRAFT • NO AUDIO",
    sourceRevision: "a".repeat(64),
    assemblyKey: "b".repeat(64),
    profile: {
      id: "probe",
      version: "1.0.0",
      render: {
        palette: {
          background: "#000000",
          surface: "#111111",
          text: "#ffffff",
          accent: "#ff0000",
        },
        typography: {
          fontFamily: "Probe Face",
          headingWeight: 700,
          bodyWeight: 400,
        },
        safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.06,
        },
      },
    },
    assets: {},
    fonts: [],
    scenes: [
      {
        id: "card",
        startFrame: 0,
        endFrame: 30,
        visual: {
          type: "recipe",
          recipe: "probe",
          executor: "naraframe-recipe/2",
          version: "1.0.0",
          codeSha256: "c".repeat(64),
          params: {},
          assets: {},
          ...(textSlots ? { textSlots } : {}),
        },
        layers: [],
        beats: [],
        transitionOut: { type: "cut" },
      },
    ],
  }) as unknown as CompiledDraft;

const slots: CompiledTextSlot[] = [
  {
    id: "title",
    param: "/title",
    style: style(),
    instances: [{ pointer: "/title", text: "abcde fghij" }],
  },
  {
    id: "point",
    param: "/points",
    style: style({ wrap: "none" }),
    instances: [
      { pointer: "/points/0", text: "abc" },
      { pointer: "/points/1", text: "abcdefghijk" },
    ],
  },
];

describe("recipe text fit in the visual preflight", () => {
  it("refuses an overflowing slot instance at its params path", () => {
    const { report } = resolveVisualPreflight(recipeDraft(1080, slots));
    const byEntity = (id: string) =>
      report.issues.find((issue) => issue.entityId === id);
    expect(
      report.issues
        .map((issue) => [
          issue.code,
          issue.severity,
          issue.path,
          issue.entityId,
        ])
        .sort(),
    ).toEqual([
      [
        "RECIPE_TEXT_OVERFLOW",
        "error",
        "/scenes/0/visual/params/points/1",
        "point",
      ],
      [
        "RECIPE_TEXT_OVERFLOW",
        "error",
        "/scenes/0/visual/params/title",
        "title",
      ],
    ]);
    expect(byEntity("title")?.message).toContain("needs 2 lines");
    expect(byEntity("title")?.message).toContain("Probe Face 700 100px");
    expect(byEntity("point")?.message).toContain("line 550px wide");
  });

  it("gives the same verdict for a 540 and a 1080 preview", () => {
    const at540 = resolveVisualPreflight(recipeDraft(540, slots)).report.issues;
    const at1080 = resolveVisualPreflight(recipeDraft(1080, slots)).report
      .issues;
    expect(at540).toEqual(at1080);
  });

  it("reports an unloaded face instead of measuring", () => {
    fontsLoaded.value = false;
    expect(
      resolveVisualPreflight(recipeDraft(1080, slots))
        .report.issues.map((issue) => [issue.code, issue.entityId])
        .sort(),
    ).toEqual([
      ["FONT_NOT_LOADED", "point"],
      ["FONT_NOT_LOADED", "title"],
    ]);
  });

  it("leaves a recipe without slots unmeasured", () => {
    expect(
      resolveVisualPreflight(recipeDraft(1080, undefined)).report.issues,
    ).toEqual([]);
  });
});

describe("slot font family", () => {
  it("resolves like a text layer of the same role", async () => {
    const { resolveTextSlotStyle } = await import("@naraframe/core");
    const { fontFamilyForRole } = await import(
      "../../src/remotion/typography.js"
    );
    const base = recipeDraft(1080, undefined).profile.render;
    const token = {
      fontSize: 40,
      fontWeight: 500,
      lineHeight: 1.1,
      letterSpacing: 0,
    };
    const variants = [
      base,
      {
        ...base,
        typography: { ...base.typography, displayFontFamily: "Display" },
      },
      {
        ...base,
        typography: {
          ...base.typography,
          displayFontFamily: "Display",
          roles: {
            display: { ...token, fontFamily: "Role Display" },
            heading: { ...token, fontFamily: "Role Heading" },
            body: token,
            label: token,
          },
        },
      },
    ];
    for (const render of variants) {
      for (const role of ["display", "heading", "body", "label"] as const) {
        const slot = {
          id: "s",
          param: "/s",
          role,
          fontSize: 40,
          lineHeight: 48,
          box: { width: 100, height: 48 },
          maxLines: 1,
          wrap: "words" as const,
        };
        expect(resolveTextSlotStyle(render, slot).fontFamily).toBe(
          fontFamilyForRole(render, role),
        );
      }
    }
  });
});
