import type { CompiledDraft } from "@naraframe/core";
import { measureText } from "@remotion/layout-utils";

export const CAPTION_LINE_HEIGHT = 1.3;

export interface CaptionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptionLayout {
  lines: string[];
  unbreakableOverflow: boolean;
  box: CaptionBox;
}

type CaptionStyle = NonNullable<CompiledDraft["captions"]>["style"];

export const captionPadding = (fontSize: number) => ({
  x: Math.round(fontSize * 0.5),
  y: Math.round(fontSize * 0.25),
});

/**
 * Wraps one cue exactly as the renderer will show it, so the renderer and
 * visual preflight agree on line count and on where the caption sits.
 */
export const captionLayoutFor = (
  draft: CompiledDraft,
  style: CaptionStyle,
  text: string,
): CaptionLayout => {
  const render = draft.profile.render;
  const padding = captionPadding(style.fontSize);
  const textWidth = draft.width - 2 * style.side - 2 * padding.x;
  const measure = (value: string): number =>
    measureText({
      text: value,
      fontFamily: render.typography.fontFamily,
      fontSize: style.fontSize,
      fontWeight: render.typography.headingWeight,
    }).width;

  const lines: string[] = [];
  let unbreakableOverflow = false;
  let line = "";
  for (const word of text
    .replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/gu, "")
    .split(/[ \t\r\n\f]+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= textWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (measure(word) > textWidth) unbreakableOverflow = true;
    line = word;
  }
  if (line) lines.push(line);

  const widest = Math.max(0, ...lines.map(measure));
  const width = Math.max(
    0,
    Math.min(draft.width - 2 * style.side, widest + 2 * padding.x),
  );
  const height =
    lines.length * style.fontSize * (style.lineHeight ?? CAPTION_LINE_HEIGHT) +
    2 * padding.y;
  return {
    lines,
    unbreakableOverflow,
    box: {
      x: (draft.width - width) / 2,
      y: draft.height - style.bottom - height,
      width,
      height,
    },
  };
};
