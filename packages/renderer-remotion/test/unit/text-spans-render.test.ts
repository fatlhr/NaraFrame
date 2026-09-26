import type { CompiledDraft, Layer } from "@naraframe/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayerView } from "../../src/remotion/draft-video.js";

const render: CompiledDraft["profile"]["render"] = {
  palette: {
    background: "#FBFAF7",
    surface: "#E9EEF8",
    text: "#101A37",
    accent: "#805900",
  },
  typography: {
    fontFamily: "Arial",
    headingWeight: 600,
    bodyWeight: 400,
  },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.05, focusScale: 1.08 },
};

const textLayer = (
  spans?: Array<{ text: string; emphasis?: "accent" | "strong" | "quiet" }>,
): Extract<Layer, { type: "text" }> => ({
  id: "statement",
  type: "text",
  text: "Progres anak kelihatan.",
  ...(spans ? { spans } : {}),
  frame: { x: 42, y: 150, width: 456, height: 130 },
  fontSize: 56,
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
});

const markupFor = (layer: Extract<Layer, { type: "text" }>): string => {
  const scene: CompiledDraft["scenes"][number] = {
    id: "probe",
    startFrame: 0,
    endFrame: 15,
    visual: { type: "composition" },
    layers: [layer],
    beats: [],
    transitionOut: { type: "cut" },
  };
  const draft: CompiledDraft = {
    schemaVersion: 1,
    mode: "draft",
    width: 540,
    height: 960,
    fps: 30,
    totalFrames: 15,
    scope: { type: "project" },
    timelineScope: "project",
    label: "DRAFT • NO AUDIO",
    sourceRevision: "a".repeat(64),
    assemblyKey: "b".repeat(64),
    profile: { id: "probe", version: "0.1.0", render },
    assets: {},
    fonts: [],
    scenes: [scene],
  };
  return renderToStaticMarkup(
    createElement(LayerView, { draft, layer, localFrame: 10, scene }),
  );
};

/** The children of the text box, i.e. what the column layout arranges. */
const boxChildren = (markup: string): string => {
  const open = markup.indexOf(">") + 1;
  return markup.slice(open, markup.lastIndexOf("</div>"));
};

describe("headline spans render as one line of text", () => {
  const spans = [
    { text: "Progres anak " },
    { text: "kelihatan", emphasis: "accent" as const },
    { text: "." },
  ];

  it("gives the column box a single child, so the runs wrap together", () => {
    const children = boxChildren(markupFor(textLayer(spans)));
    // One wrapper element holding every run. Runs placed directly in the
    // column became one flex item each, i.e. one line each, and the final
    // "." was pushed to a third line and clipped.
    expect(children.startsWith("<div>")).toBe(true);
    expect(children.endsWith("</div>")).toBe(true);
    expect(children.match(/<span[\s>]/g)).toHaveLength(3);
    expect(children.slice("<div>".length, -"</div>".length)).not.toMatch(
      /<\/div>/,
    );
  });

  it("keeps the trailing run, with the accent only on its own word", () => {
    const markup = markupFor(textLayer(spans));
    expect(markup).toContain(">kelihatan</span>");
    expect(markup).toContain(">.</span>");
    const accented = markup.match(/<span style="([^"]*)">kelihatan<\/span>/);
    expect(accented?.[1]).toContain("color:#805900");
    // The period takes the statement's own ink: an unstyled run.
    expect(markup).toContain("<span>.</span>");
  });

  it("leaves a layer without spans rendered as plain text", () => {
    const children = boxChildren(markupFor(textLayer()));
    expect(children).toBe("Progres anak kelihatan.");
  });
});
