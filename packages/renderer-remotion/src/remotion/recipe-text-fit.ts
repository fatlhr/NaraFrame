import type { CompiledDraft, CompiledTextSlot, Issue } from "@naraframe/core";
import { measureText } from "@remotion/layout-utils";

type Style = CompiledTextSlot["style"];

export interface SlotMetrics {
  lines: string[];
  /** Widest measured line, in design pixels. */
  widest: number;
  overflow: boolean;
  reason: "lines" | "height" | "width" | null;
}

const widthOf = (text: string, style: Style, whiteSpace: "pre" | "normal") =>
  measureText({
    text,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: `${style.letterSpacing}px`,
    ...(whiteSpace === "pre"
      ? { additionalStyles: { whiteSpace: "pre" } }
      : {}),
  }).width;

/** CSS-collapsible white space in pre-line: spaces and tabs (a lone CR counts as a space). */
const COLLAPSIBLE = /[ \t\r]+/gu;

/**
 * The text's segments between forced breaks (CR LF and LF are one break
 * each). Empty text has none. Whether a segment is a line box is decided by
 * the caller: one followed by a break always is, the last only if it paints.
 */
const segmentsOf = (text: string): string[] =>
  text.length === 0 ? [] : text.replace(/\r\n/gu, "\n").split("\n");

/**
 * How a slot's text lays out under the recipe's CSS, in design pixels.
 * words = white-space: pre-line: runs of spaces/tabs collapse and drop at
 * line edges, NBSP and other non-collapsible characters stay, lines wrap at
 * spaces. none = white-space: pre: nothing collapses or wraps; each segment
 * is measured whole (a lone CR as a space). A segment followed by a forced
 * break is a line box even when empty; the last one only when it paints.
 */
export const measureSlotText = (text: string, style: Style): SlotMetrics => {
  const lines: string[] = [];
  let widest = 0;
  let tooWide = false;
  const segments = segmentsOf(text);
  segments.forEach((segment, index) => {
    const forcedBreakAfter = index < segments.length - 1;
    if (style.wrap === "none") {
      if (segment.length === 0 && !forcedBreakAfter) return;
      const shown = segment.replaceAll("\r", " ");
      const width = shown.length > 0 ? widthOf(shown, style, "pre") : 0;
      widest = Math.max(widest, width);
      if (width > style.width) tooWide = true;
      lines.push(shown);
      return;
    }
    const words = segment
      .replace(COLLAPSIBLE, " ")
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length === 0) {
      if (forcedBreakAfter) lines.push("");
      return;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const candidateWidth = widthOf(candidate, style, "normal");
      if (candidateWidth <= style.width) {
        line = candidate;
        widest = Math.max(widest, candidateWidth);
        continue;
      }
      if (line) lines.push(line);
      const wordWidth = widthOf(word, style, "normal");
      widest = Math.max(widest, wordWidth);
      if (wordWidth > style.width) tooWide = true;
      line = word;
    }
    if (line) lines.push(line);
  });
  const reason =
    lines.length > style.maxLines
      ? "lines"
      : lines.length * style.lineHeight > style.height + 0.5
        ? "height"
        : tooWide
          ? "width"
          : null;
  return { lines, widest, overflow: reason !== null, reason };
};

const issue = (
  code: string,
  path: string,
  entityId: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "scenes.json",
  path,
  entityId,
  message,
  suggestion,
});

/**
 * Measures every declared text slot of a recipe scene in the loaded profile
 * face. Only declared slots are measured; the recipe must draw them with
 * props.textSlots for the verdict to describe its frames.
 */
export const recipeTextFit = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  sceneIndex: number,
  loadedFontFamilies: ReadonlySet<string>,
): Issue[] => {
  if (scene.visual.type !== "recipe" || !scene.visual.textSlots) return [];
  const recipe = scene.visual.recipe;
  const issues: Issue[] = [];
  for (const slot of scene.visual.textSlots) {
    const { style } = slot;
    const bundled = draft.fonts.some(
      (font) => font.family === style.fontFamily,
    );
    const loaded =
      (!bundled || loadedFontFamilies.has(style.fontFamily)) &&
      document.fonts.check(`${style.fontSize}px ${style.fontFamily}`);
    if (!loaded) {
      issues.push(
        issue(
          "FONT_NOT_LOADED",
          `/scenes/${sceneIndex}/visual/params${slot.param}`,
          slot.id,
          `The font ${style.fontFamily} for text slot ${slot.id} of recipe ${recipe} was not loaded before measurement.`,
          "Provision the profile font locally and wait for it before previewing.",
        ),
      );
      continue;
    }
    for (const instance of slot.instances) {
      const metrics = measureSlotText(instance.text, style);
      if (!metrics.overflow) continue;
      const detail =
        metrics.reason === "lines"
          ? `needs ${metrics.lines.length} lines; the slot allows ${style.maxLines}`
          : metrics.reason === "height"
            ? `needs ${metrics.lines.length} × ${style.lineHeight}px = ${metrics.lines.length * style.lineHeight}px of height; the box is ${style.height}px`
            : `has a ${style.wrap === "none" ? "line" : "word"} ${Math.ceil(metrics.widest)}px wide; the box is ${style.width}px`;
      issues.push(
        issue(
          "RECIPE_TEXT_OVERFLOW",
          `/scenes/${sceneIndex}/visual/params${instance.pointer}`,
          slot.id,
          `Recipe ${recipe} in scene ${scene.id}, text slot ${slot.id} at ${instance.pointer}: "${instance.text}" in ${style.fontFamily} ${style.fontWeight} ${style.fontSize}px (letter spacing ${style.letterSpacing}px, wrap ${style.wrap}) ${detail} (design pixels, box ${style.width}×${style.height}).`,
          "Shorten or split this copy for the current profile through an edit, or use a profile whose face fits. Changing the slot box or size is a recipe code change that needs trust again. NaraFrame does not shrink or rewrite text.",
        ),
      );
    }
  }
  return issues;
};
