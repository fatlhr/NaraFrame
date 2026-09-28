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

const entryWith = (
  layers: Layer[],
  extra: Partial<VarietyScene["scene"]> = {},
): VarietyScene[] => [
  {
    scene: {
      id: "probe",
      narrativeRole: "context",
      durationMs: 3000,
      visual: { type: "composition", layers: [] },
      beats: [],
      transition: { type: "cut" },
      ...extra,
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

// F1: text is judged against what can actually be painted under it; where
// that is an image or anything else this model cannot see, the contrast is
// reported as unverified instead of a ratio against the page background.
const WHITE = "#FFFFFF";
const INK = "#101A37";
const canvas = { width: 1080, height: 1920 };

const panel = (
  overrides: Partial<Extract<Layer, { type: "shape" }>> & { id: string },
): Extract<Layer, { type: "shape" }> => ({
  type: "shape",
  shape: "rectangle",
  fill: WHITE,
  frame: { x: 0, y: 0, width: 400, height: 200 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

const image = (
  overrides: Partial<Extract<Layer, { type: "image" }>> & { id: string },
): Extract<Layer, { type: "image" }> => ({
  type: "image",
  assetId: "report-card",
  fit: "contain",
  frame: { x: 0, y: 0, width: 400, height: 200 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

const row = (color?: string) =>
  textLayer({
    id: "row",
    frame: { x: 40, y: 40, width: 300, height: 66 },
    fontSize: 52,
    zIndex: 2,
    ...(color ? { color } : {}),
  });

const contrastCodes = (issues: ReturnType<typeof checkContrast>) =>
  issues.map((issue) => `${issue.code}:${issue.entityId}`);

describe("checkContrast backdrops (F1)", () => {
  it("reports light profile text over an image as unverified, not as passing", () => {
    // Retrial condition 1: light rows on the white report-card SVG raised nothing.
    const issues = checkContrast(
      entryWith([image({ id: "card", zIndex: 1 }), row()]),
      baseRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        severity: "info",
        entityId: "row",
        path: "/scenes/0/visual/layers/1",
        message:
          "Contrast of text layer row in scene probe is not checked: image card lies under it, and image pixels are not analysed.",
      }),
    ]);
  });

  it("does not measure dark text over an image against the page background", () => {
    // Retrial condition 2: readable ink on the card warned 1.09:1 "against the background".
    const issues = checkContrast(
      entryWith([image({ id: "card", zIndex: 1 }), row(INK)]),
      baseRender,
      canvas,
    );

    expect(contrastCodes(issues)).toEqual(["CONTRAST_UNVERIFIED:row"]);
  });

  it("still checks text against the page when an image is nowhere under it", () => {
    const issues = checkContrast(
      entryWith([
        image({
          id: "far",
          frame: { x: 600, y: 900, width: 200, height: 200 },
        }),
        row("#141610"),
      ]),
      baseRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        entityId: "row",
        message: expect.stringContaining("against the background"),
      }),
    ]);
  });

  it("measures text on an opaque panel against the panel", () => {
    const low = checkContrast(
      entryWith([panel({ id: "card-panel", zIndex: 1 }), row()]),
      baseRender,
      canvas,
    );
    const high = checkContrast(
      entryWith([panel({ id: "card-panel", zIndex: 1 }), row(INK)]),
      baseRender,
      canvas,
    );

    expect(low).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message:
          "Text layer row in scene probe has a 1.13:1 contrast ratio against panel card-panel, below the 3:1 WCAG minimum for its size.",
        suggestion: "Choose a text or backdrop color with more contrast.",
      }),
    ]);
    expect(high).toEqual([]);
  });

  it("counts a rounded panel as covering text whose box reaches its corner", () => {
    // Legible label near the bottom of a radius-44 panel (project-current-issues map scene).
    const issues = checkContrast(
      entryWith([
        panel({
          id: "map-panel",
          frame: { x: 88, y: 300, width: 904, height: 700 },
          cornerRadius: 44,
        }),
        textLayer({
          id: "map-label",
          color: "#11130F",
          frame: { x: 128, y: 900, width: 824, height: 60 },
          fontSize: 32,
          zIndex: 4,
        }),
      ]),
      { ...baseRender, palette: { ...baseRender.palette, surface: "#E8E0D2" } },
      canvas,
    );

    expect(issues).toEqual([]);
  });

  it("uses both the panel and the page when a panel only partly covers the text", () => {
    const issues = checkContrast(
      entryWith([
        panel({ id: "half", frame: { x: 0, y: 0, width: 200, height: 200 } }),
        row(INK),
      ]),
      baseRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
  });

  it("ignores a panel painted above the text, following the renderer's group order", () => {
    // A group at the same zIndex paints after top-level layers, so its panel is on top.
    const issues = checkContrast(
      entryWith([
        row(INK),
        panel({ id: "over", zIndex: 2 }),
        {
          type: "group",
          id: "over-group",
          memberIds: ["over"],
          zIndex: 2,
        } as Layer,
      ]),
      baseRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
  });

  it("bounds a follower by its path: far away it is ignored, under the text it is not", () => {
    const route = (y: number): Layer => ({
      type: "path",
      id: "route",
      d: "M 0 0 L 100 0",
      viewBox: { minX: 0, minY: 0, width: 100, height: 10 },
      frame: { x: 0, y, width: 400, height: 40 },
      stroke: { color: WHITE, width: 4 },
      opacity: 1,
      rotationDeg: 0,
      zIndex: 0,
    });
    const badge = image({
      id: "badge",
      frame: { x: 0, y: 0, width: 60, height: 60 },
      zIndex: 1,
    });
    const travel = {
      beats: [
        {
          id: "travel",
          targetId: "badge",
          action: "follow" as const,
          startMs: 0,
          durationMs: 1000,
          params: { pathId: "route" },
        },
      ],
    };
    const text = textLayer({
      id: "headline",
      color: "#F5F1E8",
      frame: { x: 0, y: 400, width: 400, height: 100 },
      fontSize: 52,
      zIndex: 5,
    });

    const far = checkContrast(
      entryWith([route(1200), badge, text], travel),
      baseRender,
      canvas,
    );
    const near = checkContrast(
      entryWith([route(420), badge, text], travel),
      baseRender,
      canvas,
    );

    expect(far).toEqual([]);
    expect(contrastCodes(near)).toEqual(["CONTRAST_UNVERIFIED:headline"]);
  });

  it("uses the camera's moves to decide whether another depth reaches overlay text", () => {
    const world = (y: number) =>
      panel({
        id: "plate",
        fill: "#E8E0D2",
        frame: { x: 0, y, width: 1080, height: 200 },
        space: "world",
        parallax: 0.5,
      });
    const title = textLayer({
      id: "title",
      color: "#F5F1E8",
      frame: { x: 100, y: 100, width: 800, height: 120 },
      fontSize: 52,
      zIndex: 5,
    });
    const camera = {
      camera: {
        initial: { x: 0, y: 0, zoom: 1 },
        moves: [
          {
            id: "push",
            startMs: 0,
            durationMs: 1000,
            to: { x: 0, y: 200, zoom: 1.2 },
          },
        ],
      },
    } as Partial<VarietyScene["scene"]>;

    const clear = checkContrast(
      entryWith([world(1500), title], camera),
      baseRender,
      canvas,
    );
    // At (0, 200, 1.2) a depth-0.5 plate drawn at y 300 rises past y 220.
    const passes = checkContrast(
      entryWith([world(300), title], camera),
      baseRender,
      canvas,
    );
    const noCanvas = checkContrast(
      entryWith([world(1500), title], camera),
      baseRender,
    );

    expect(clear).toEqual([]);
    expect(passes).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message:
          "Contrast of text layer title in scene probe is not checked: the camera moves shape plate under it from another depth.",
      }),
    ]);
    expect(contrastCodes(noCanvas)).toEqual(["CONTRAST_UNVERIFIED:title"]);
  });

  it("checks an accent run against the backdrop too", () => {
    const issues = checkContrast(
      entryWith([
        textLayer({
          id: "headline",
          text: "Satu tutor, jadwal kamu.",
          spans: [
            { text: "Satu tutor, " },
            { text: "jadwal kamu.", emphasis: "accent" },
          ],
          fontSize: 112,
        }),
      ]),
      { ...baseRender, palette: { ...baseRender.palette, accent: "#1A1C18" } },
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining('(accent run "jadwal kamu.")'),
      }),
    ]);
  });

  it("leaves text over a shadow it is not covered from unverified", () => {
    const issues = checkContrast(
      entryWith([
        panel({
          id: "button",
          frame: { x: 0, y: 0, width: 400, height: 100 },
          shadow: {
            color: "#000000",
            opacity: 0.18,
            offsetX: 0,
            offsetY: 20,
            blur: 40,
          },
        }),
        textLayer({
          id: "caption",
          color: "#F5F1E8",
          frame: { x: 0, y: 110, width: 400, height: 40 },
          fontSize: 32,
          zIndex: 2,
        }),
      ]),
      baseRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("the shadow of button falls under it"),
      }),
    ]);
  });

  it("only suggests a larger size when the text is below the large-text size", () => {
    const small = checkContrast(
      entryWith([textLayer({ id: "small", color: "#6e6e6e", fontSize: 20 })]),
      baseRender,
    );

    expect(small[0]?.suggestion).toContain("at or above 24px");
  });
});

// Supervisor review 2026-09-28: four schema-valid probes where the backdrop
// is not the one the check assumed. Black page, white surface, black text.
const probeRender: RenderTokens = {
  ...baseRender,
  palette: {
    background: "#000000",
    surface: "#FFFFFF",
    text: "#000000",
    accent: "#ff0000",
  },
};

const whitePanel = (
  overrides: Partial<Extract<Layer, { type: "shape" }>> = {},
): Extract<Layer, { type: "shape" }> =>
  panel({
    id: "panel",
    frame: { x: 100, y: 100, width: 400, height: 400 },
    ...overrides,
  });

const blackText = (
  frame: { x: number; y: number; width: number; height: number },
  overrides: Partial<Extract<Layer, { type: "text" }>> = {},
) =>
  textLayer({
    id: "copy",
    text: "M",
    color: "#000000",
    frame,
    fontSize: 24,
    zIndex: 2,
    ...overrides,
  });

const group = (
  memberIds: string[],
  transform = { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
): Layer =>
  ({ type: "group", id: "set", memberIds, transform, zIndex: 0 }) as Layer;

describe("checkContrast supervisor probes (F1 review)", () => {
  it("does not treat a rounded corner as covered", () => {
    // Radius 200 on a 400 square: the text box sits in the cut-away corner.
    const corner = checkContrast(
      entryWith([
        whitePanel({ cornerRadius: 200 }),
        blackText({ x: 110, y: 110, width: 45, height: 45 }),
      ]),
      probeRender,
      canvas,
    );
    // Control: the same rounded panel still covers a label well inside it.
    const inside = checkContrast(
      entryWith([
        whitePanel({ cornerRadius: 200 }),
        blackText({ x: 250, y: 250, width: 100, height: 50 }),
      ]),
      probeRender,
      canvas,
    );

    expect(corner).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
    expect(inside).toEqual([]);
  });

  it("leaves a label whose box fills a rounded button unverified, not measured against the page", () => {
    // CTA style: the label box is the button's frame, so its corners reach
    // past the rounded fill; white on a light page would be a false warning.
    const issues = checkContrast(
      entryWith([
        whitePanel({
          fill: "#168A52",
          frame: { x: 84, y: 1580, width: 912, height: 124 },
          cornerRadius: 62,
        }),
        blackText(
          { x: 84, y: 1580, width: 912, height: 124 },
          { color: "#FFFFFF", fontSize: 40 },
        ),
      ]),
      {
        ...probeRender,
        palette: { ...probeRender.palette, background: "#FBFAF7" },
      },
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining(
          "its box reaches past the curved edge of panel panel",
        ),
      }),
    ]);
  });

  it("reads text in the corner of a circle's frame against what is behind the circle", () => {
    const issues = checkContrast(
      entryWith([
        whitePanel({ shape: "circle" }),
        blackText({ x: 105, y: 105, width: 40, height: 40 }),
      ]),
      probeRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
  });

  it("follows a group member that moves on its own", () => {
    const panelLeaves = {
      beats: [
        {
          id: "away",
          targetId: "panel",
          action: "transform" as const,
          startMs: 0,
          durationMs: 1000,
          params: { to: { x: 600 } },
        },
      ],
    };
    const moved = checkContrast(
      entryWith(
        [
          whitePanel(),
          blackText({ x: 150, y: 150, width: 80, height: 50 }),
          group(["panel", "copy"]),
        ],
        panelLeaves,
      ),
      probeRender,
      canvas,
    );
    // Control: the whole group moving keeps the text on its panel.
    const together = checkContrast(
      entryWith(
        [
          whitePanel(),
          blackText({ x: 150, y: 150, width: 80, height: 50 }),
          group(["panel", "copy"]),
        ],
        {
          beats: [
            {
              id: "slide",
              targetId: "set",
              action: "transform" as const,
              startMs: 0,
              durationMs: 1000,
              params: { to: { x: 600 } },
            },
          ],
        },
      ),
      probeRender,
      canvas,
    );

    expect(moved).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
    expect(together).toEqual([]);
  });

  it("takes the group's opacity into account", () => {
    const withGroupOpacity = (opacity: number) =>
      checkContrast(
        entryWith([
          whitePanel(),
          group(["panel"], { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity }),
          blackText({ x: 150, y: 150, width: 80, height: 50 }),
        ]),
        probeRender,
        canvas,
      );

    // Invisible panel: the text is on the black page.
    expect(withGroupOpacity(0)).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
    // Half-transparent panel: a blend this check does not compute.
    expect(withGroupOpacity(0.5)).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("translucent shape panel"),
      }),
    ]);
    // Control: a fully opaque group keeps the panel as the backdrop.
    expect(withGroupOpacity(1)).toEqual([]);
  });

  it("bounds a turning layer by the disk it sweeps, not its end poses", () => {
    const bar = image({
      id: "bar",
      frame: { x: 100, y: 300, width: 400, height: 40 },
      zIndex: 0,
    });
    const whiteText = textLayer({
      id: "copy",
      text: "M",
      color: "#FFFFFF",
      frame: { x: 290, y: 150, width: 30, height: 30 },
      fontSize: 24,
      zIndex: 2,
    });
    const turn = (to: { rotationDeg?: number; x?: number }) => ({
      beats: [
        {
          id: "turn",
          targetId: "bar",
          action: "transform" as const,
          startMs: 0,
          durationMs: 1000,
          params: { to },
        },
      ],
    });

    // At 90 degrees the bar stands over (280, 120, 40, 400) and covers the text.
    const turning = checkContrast(
      entryWith([bar, whiteText], turn({ rotationDeg: 180 })),
      probeRender,
      canvas,
    );
    // Control: sliding without turning stays below the text.
    const sliding = checkContrast(
      entryWith([bar, whiteText], turn({ x: 100 })),
      probeRender,
      canvas,
    );

    expect(turning).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("image bar lies under it"),
      }),
    ]);
    expect(sliding).toEqual([]);
  });

  it("uses a panel that is revealed before the text, but not one that fades in under it", () => {
    const reveal = (targetId: string, startMs: number) => ({
      id: `${targetId}-in`,
      targetId,
      action: "reveal" as const,
      startMs,
      durationMs: 300,
      params: { direction: "up" as const, distance: 20 },
    });
    const layers = [
      whitePanel(),
      blackText({ x: 150, y: 150, width: 80, height: 50 }),
    ];

    const together = checkContrast(
      entryWith(layers, { beats: [reveal("panel", 0), reveal("copy", 0)] }),
      probeRender,
      canvas,
    );
    const panelFirst = checkContrast(
      entryWith(layers, { beats: [reveal("panel", 0), reveal("copy", 500)] }),
      probeRender,
      canvas,
    );
    const textFirst = checkContrast(
      entryWith(layers, { beats: [reveal("copy", 0), reveal("panel", 500)] }),
      probeRender,
      canvas,
    );

    // Revealed together: the text is judged once both are fully shown.
    expect(together).toEqual([]);
    expect(panelFirst).toEqual([]);
    expect(textFirst).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining(
          "shape panel fades in or out while the text is visible",
        ),
      }),
    ]);
  });
});

// Supervisor correction review 2026-09-28: motion the check did not bound.
describe("checkContrast motion the correction review found (F1)", () => {
  const route: Layer = {
    type: "path",
    id: "route",
    d: "M 0 0 L 100 0",
    viewBox: { minX: 0, minY: 0, width: 100, height: 10 },
    frame: { x: 100, y: 100, width: 100, height: 10 },
    stroke: { color: "#FFFFFF", width: 4 },
    opacity: 1,
    rotationDeg: 0,
    zIndex: 0,
  };
  const photo = image({
    id: "photo",
    frame: { x: 0, y: 0, width: 20, height: 20 },
    zIndex: 1,
  });
  const whiteText = (frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) =>
    textLayer({
      id: "copy",
      text: "M",
      color: "#FFFFFF",
      frame,
      fontSize: 24,
      zIndex: 2,
    });
  const followThen = (to: { x?: number; y?: number }) => ({
    beats: [
      {
        id: "ride",
        targetId: "photo",
        action: "follow" as const,
        startMs: 0,
        durationMs: 1000,
        params: { pathId: "route" },
      },
      {
        id: "leave",
        targetId: "photo",
        action: "transform" as const,
        startMs: 1000,
        durationMs: 1000,
        params: { to },
      },
    ],
  });

  it("follows the axis a transform sets after a follow (x only)", () => {
    // The renderer puts the image at the text after the x-only move.
    const issues = checkContrast(
      entryWith(
        [route, photo, whiteText({ x: 600, y: 90, width: 30, height: 30 })],
        followThen({ x: 600 }),
      ),
      probeRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("image photo lies under it"),
      }),
    ]);
  });

  it("follows the axis a transform sets after a follow (y only)", () => {
    const issues = checkContrast(
      entryWith(
        [route, photo, whiteText({ x: 140, y: 500, width: 30, height: 30 })],
        followThen({ y: 500 }),
      ),
      probeRender,
      canvas,
    );

    expect(issues).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("image photo lies under it"),
      }),
    ]);
  });

  it("still clears text the moved image provably never reaches", () => {
    // Control: x-only move to 600 keeps y on the route band (100–110).
    const issues = checkContrast(
      entryWith(
        [route, photo, whiteText({ x: 600, y: 700, width: 30, height: 30 })],
        followThen({ x: 600 }),
      ),
      probeRender,
      canvas,
    );

    expect(issues).toEqual([]);
  });

  it("does not trust a panel that a focus beat moves", () => {
    const text = blackText({ x: 450, y: 200, width: 30, height: 30 });
    const focus = (targetId: string) => ({
      beats: [
        {
          id: "look",
          targetId,
          action: "focus" as const,
          startMs: 0,
          durationMs: 1000,
          params: { camera: "pan" as const, intensity: 1 },
        },
      ],
    });

    const focused = checkContrast(
      entryWith([whitePanel(), text], focus("panel")),
      probeRender,
      canvas,
    );
    const groupFocused = checkContrast(
      entryWith([whitePanel(), group(["panel"]), text], focus("set")),
      probeRender,
      canvas,
    );
    // Control: the same panel without the focus covers the text.
    const still = checkContrast(
      entryWith([whitePanel(), text]),
      probeRender,
      canvas,
    );

    expect(focused).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("a focus beat moves panel"),
      }),
    ]);
    expect(groupFocused).toEqual([
      expect.objectContaining({
        code: "CONTRAST_UNVERIFIED",
        message: expect.stringContaining("moves with its group set"),
      }),
    ]);
    expect(still).toEqual([]);
  });

  it("bounds a group's emphasize by scaling its members about their centre", () => {
    // A small dark marker group pulsing (scale 1.5 about its members' centre).
    const marker = panel({
      id: "dot",
      fill: "#000000",
      frame: { x: 100, y: 100, width: 40, height: 40 },
    });
    const pulse = {
      beats: [
        {
          id: "pulse",
          targetId: "set",
          action: "emphasize" as const,
          startMs: 0,
          durationMs: 500,
          params: { scale: 1.5 },
        },
      ],
    };
    const onWhite = {
      ...probeRender,
      palette: { ...probeRender.palette, background: "#FFFFFF" },
    };
    const text = (x: number) =>
      textLayer({
        id: "copy",
        text: "M",
        color: "#000000",
        frame: { x, y: 110, width: 20, height: 20 },
        fontSize: 24,
        zIndex: 2,
      });

    // Far away: measured against the page, not left unverified.
    const far = checkContrast(
      entryWith([marker, group(["dot"]), text(600)], pulse),
      onWhite,
      canvas,
    );
    // Next to it: the pulse reaches x 150, so the marker counts.
    const near = checkContrast(
      entryWith([marker, group(["dot"]), text(145)], pulse),
      onWhite,
      canvas,
    );

    expect(far).toEqual([]);
    expect(near).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("panel dot"),
      }),
    ]);
  });

  it("bounds the whole sweep of an off-centre member under a group emphasize", () => {
    // Supervisor pass-2 probe: the group centre is (370, 220), so the marker
    // slides from x 600–640 to 715–775 and crosses the text on the way.
    const members = (fill: string) => [
      panel({
        id: "marker",
        fill,
        frame: { x: 600, y: 200, width: 40, height: 40 },
      }),
      panel({
        id: "other",
        fill,
        frame: { x: 100, y: 200, width: 40, height: 40 },
      }),
      {
        type: "group",
        id: "set",
        memberIds: ["marker", "other"],
        transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
        zIndex: 0,
      } as Layer,
    ];
    const pulse = {
      beats: [
        {
          id: "pulse",
          targetId: "set",
          action: "emphasize" as const,
          startMs: 0,
          durationMs: 1000,
          params: { scale: 1.5 },
        },
      ],
    };
    const text = (frame: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) =>
      textLayer({
        id: "copy",
        text: "M",
        color: "#000000",
        frame,
        fontSize: 24,
        zIndex: 2,
      });
    const onWhite = {
      ...probeRender,
      palette: { ...probeRender.palette, background: "#FFFFFF" },
    };

    const between = checkContrast(
      entryWith(
        [
          ...members("#000000"),
          text({ x: 675, y: 205, width: 20, height: 20 }),
        ],
        pulse,
      ),
      onWhite,
      canvas,
    );
    // The sweep is reach, not cover: a white marker over the text at rest
    // slides away as the group scales, leaving black text on the black page.
    const leaves = checkContrast(
      entryWith(
        [
          ...members("#FFFFFF"),
          text({ x: 620, y: 210, width: 10, height: 10 }),
        ],
        pulse,
      ),
      probeRender,
      canvas,
    );

    expect(between).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("panel marker"),
      }),
    ]);
    expect(leaves).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("against the background"),
      }),
    ]);
  });

  it("grows an emphasized backdrop's reach but keeps its cover", () => {
    const pulse = (targetId: string) => ({
      beats: [
        {
          id: "pulse",
          targetId,
          action: "emphasize" as const,
          startMs: 0,
          durationMs: 500,
          params: { scale: 1.5 },
        },
      ],
    });
    // A dark shape next to the text reaches under it only while emphasized.
    const near = panel({
      id: "near",
      fill: "#000000",
      frame: { x: 100, y: 100, width: 100, height: 100 },
    });
    const text = textLayer({
      id: "copy",
      text: "M",
      color: "#000000",
      frame: { x: 215, y: 120, width: 20, height: 20 },
      fontSize: 24,
      zIndex: 2,
    });
    const onWhite = {
      palette: { ...probeRender.palette, background: "#FFFFFF" },
    };

    const pulsing = checkContrast(
      entryWith([near, text], pulse("near")),
      { ...probeRender, ...onWhite },
      canvas,
    );
    const resting = checkContrast(
      entryWith([near, text]),
      { ...probeRender, ...onWhite },
      canvas,
    );
    // An emphasized panel under the text still covers it.
    const covering = checkContrast(
      entryWith(
        [whitePanel(), blackText({ x: 150, y: 150, width: 80, height: 50 })],
        pulse("panel"),
      ),
      probeRender,
      canvas,
    );

    expect(pulsing).toEqual([
      expect.objectContaining({
        code: "CONTRAST_INSUFFICIENT",
        message: expect.stringContaining("panel near"),
      }),
    ]);
    expect(resting).toEqual([]);
    expect(covering).toEqual([]);
  });
});
