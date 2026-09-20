import type { Issue } from "../model/issue.js";
import type { RenderTokens } from "../schema/profile.js";
import type { VarietyScene } from "./variety.js";

/**
 * WCAG 2.x relative-luminance contrast math. Pure color arithmetic — no
 * DOM, no canvas, no render — so it runs during `validate`, not only after
 * a full browser render. It checks resolved text color against the
 * project's flat `palette.background` only: a photo or shape actually
 * behind a layer at render time is not sampled, so this catches the
 * common flat-background mistake, not every real compositing case.
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
      const ratio = contrastRatio(textColor, render.palette.background);
      const threshold = contrastThresholdFor(fontSize);
      if (ratio < threshold) {
        issues.push({
          code: "CONTRAST_INSUFFICIENT",
          severity: "warning",
          responsible: "agent",
          artifact: "scenes.json",
          path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}`,
          entityId: layer.id,
          message: `Text layer ${layer.id} in scene ${scene.id} has a ${ratio.toFixed(2)}:1 contrast ratio against the background, below the ${threshold}:1 WCAG minimum for its size.`,
          suggestion:
            "Choose a text or background color with more contrast, or size the text at or above 24px to use the large-text threshold.",
        });
      }
    });
  });
  return issues;
};
