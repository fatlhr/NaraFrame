import type { Issue } from "../model/issue.js";
import type { RenderTokens } from "../schema/profile.js";
import type { Layer } from "../schema/scene.js";
import type { VarietyScene } from "./variety.js";

/**
 * WCAG 2.x relative-luminance contrast math. Pure color arithmetic — no
 * DOM, no canvas, no render — so it runs during `validate`, not only after
 * a full browser render. It checks resolved text color against the
 * project's background: either the flat `palette.background`, or the fill
 * of an opaque shape painted under the text and covering it, which is how
 * editorial layouts put dark type on a light panel. An image behind a layer
 * is still not sampled — its pixels are unknown here — so a text layer over
 * a photograph is left alone rather than judged against the page.
 */

const srgbChannelToLinear = (channel8Bit: number): number => {
  const channel = channel8Bit / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hexColor: string): number => {
  const r = Number.parseInt(hexColor.slice(1, 3), 16);
  const g = Number.parseInt(hexColor.slice(3, 5), 16);
  const b = Number.parseInt(hexColor.slice(5, 7), 16);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
};

export const contrastRatio = (hexA: string, hexB: string): number => {
  const lighter = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const darker = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
};

const covers = (
  outer: { x: number; y: number; width: number; height: number },
  inner: { x: number; y: number; width: number; height: number },
): boolean =>
  outer.x <= inner.x &&
  outer.y <= inner.y &&
  outer.x + outer.width >= inner.x + inner.width &&
  outer.y + outer.height >= inner.y + inner.height;

/**
 * What the text is actually read against: the last opaque rectangle painted
 * under it that covers it, or the page background when there is none. A
 * circle is not used — its corners leave the text over whatever is behind.
 */
const backdropFor = (
  layers: readonly Layer[],
  textIndex: number,
  render: RenderTokens,
): { color: string; layerId?: string } => {
  const text = layers[textIndex];
  if (text?.type !== "text") return { color: render.palette.background };
  let backdrop: { color: string; layerId?: string } = {
    color: render.palette.background,
  };
  layers.forEach((layer, index) => {
    if (index === textIndex) return;
    if (layer.type === "image") return;
    if (layer.type !== "shape" || layer.shape !== "rectangle") return;
    if ((layer.opacity ?? 1) < 1) return;
    const under =
      (layer.zIndex ?? 0) < (text.zIndex ?? 0) ||
      ((layer.zIndex ?? 0) === (text.zIndex ?? 0) && index < textIndex);
    if (!under || !covers(layer.frame, text.frame)) return;
    backdrop = { color: layer.fill, layerId: layer.id };
  });
  return backdrop;
};

/** WCAG 2.x: 18pt/24px regular (or 14pt/~19px bold) counts as "large text". */
const LARGE_TEXT_PX = 24;
const CONTRAST_MINIMUM_LARGE_TEXT = 3;
const CONTRAST_MINIMUM_NORMAL_TEXT = 4.5;

export const contrastThresholdFor = (fontSizePx: number): number =>
  fontSizePx >= LARGE_TEXT_PX
    ? CONTRAST_MINIMUM_LARGE_TEXT
    : CONTRAST_MINIMUM_NORMAL_TEXT;

/** Runs unconditionally (not gated by scope): a contrast defect on a single
 * scene is real whether or not the rest of the project is compiled with it. */
export const checkContrast = (
  entries: VarietyScene[],
  render: RenderTokens,
): Issue[] => {
  const issues: Issue[] = [];
  entries.forEach(({ scene, sceneIndex, resolvedLayers }) => {
    resolvedLayers.forEach((layer, layerIndex) => {
      if (layer.type !== "text") return;
      const textColor = layer.color ?? render.palette.text;
      const fontSize = layer.fontSize ?? 34;
      const backdrop = backdropFor(resolvedLayers, layerIndex, render);
      const ratio = contrastRatio(textColor, backdrop.color);
      const threshold = contrastThresholdFor(fontSize);
      if (ratio < threshold) {
        issues.push({
          code: "CONTRAST_INSUFFICIENT",
          severity: "warning",
          responsible: "agent",
          artifact: "scenes.json",
          path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}`,
          entityId: layer.id,
          message: `Text layer ${layer.id} in scene ${scene.id} has a ${ratio.toFixed(2)}:1 contrast ratio against ${backdrop.layerId ? `panel ${backdrop.layerId}` : "the background"}, below the ${threshold}:1 WCAG minimum for its size.`,
          suggestion:
            "Choose a text or background color with more contrast, or size the text at or above 24px to use the large-text threshold.",
        });
      }
    });
  });
  return issues;
};
