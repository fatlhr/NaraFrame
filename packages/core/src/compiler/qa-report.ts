import type { CompiledDraft } from "../schema/compiled.js";
import { contrastRatio, contrastThresholdFor } from "./contrast.js";

/**
 * Summary counts for the M0.10.5 visual QA report — measured from the final
 * `CompiledDraft` a build actually published, so the artifact reflects what
 * shipped rather than what was declared before compilation resolved
 * defaults. This mirrors the sameness signals `checkVariety` gates on, but
 * as numbers for a reviewer to read rather than pass/fail issues.
 */
export interface VarietyMetrics {
  sceneCount: number;
  distinctEntrySignatures: number;
  transitionTypesUsed: string[];
  focusCamerasUsed: string[];
  distinctFontSizesUsed: number;
}

type CompiledBeat = CompiledDraft["scenes"][number]["beats"][number];

const entrySignature = (beats: CompiledBeat[]): string => {
  const earliest = beats.reduce<CompiledBeat | undefined>(
    (best, beat) => (!best || beat.startFrame < best.startFrame ? beat : best),
    undefined,
  );
  if (!earliest) return "static";
  if (earliest.action === "reveal")
    return `reveal:${earliest.params.direction}`;
  if (earliest.action === "focus") return `focus:${earliest.params.camera}`;
  return earliest.action;
};

export const computeVarietyMetrics = (draft: CompiledDraft): VarietyMetrics => {
  const entrySignatures = new Set<string>();
  const transitionTypes = new Set<string>();
  const focusCameras = new Set<string>();
  const fontSizes = new Set<number>();

  draft.scenes.forEach((scene) => {
    entrySignatures.add(entrySignature(scene.beats));
    transitionTypes.add(scene.transitionOut.type);
    scene.beats.forEach((beat) => {
      if (beat.action === "focus") focusCameras.add(beat.params.camera);
    });
    scene.layers.forEach((layer) => {
      if (layer.type === "text" && layer.fontSize) {
        fontSizes.add(Math.round(layer.fontSize));
      }
    });
  });

  return {
    sceneCount: draft.scenes.length,
    distinctEntrySignatures: entrySignatures.size,
    transitionTypesUsed: [...transitionTypes].sort(),
    focusCamerasUsed: [...focusCameras].sort(),
    distinctFontSizesUsed: fontSizes.size,
  };
};

export interface ContrastSample {
  sceneId: string;
  layerId: string;
  ratio: number;
  threshold: number;
  meetsThreshold: boolean;
}

export interface ReadabilityMetrics {
  /** Smallest text size across the project, expressed at the fixed 1080px
   * final render width (M0's only supported final size), not the 540px
   * draft-preview width the layer was actually measured at. */
  smallestFontSizeAtFinalWidthPx: number | null;
  contrastSamples: ContrastSample[];
}

/** M0 only ever renders 9:16 at a fixed 1080x1920 final / 540x960 draft; see
 * docs/plan.md §1. There is no schema path to a different final size yet. */
const FINAL_WIDTH_PX = 1080;

export const computeReadabilityMetrics = (
  draft: CompiledDraft,
): ReadabilityMetrics => {
  const scaleToFinal = FINAL_WIDTH_PX / draft.width;
  let smallestDraftFontSize: number | null = null;
  const contrastSamples: ContrastSample[] = [];

  draft.scenes.forEach((scene) => {
    scene.layers.forEach((layer) => {
      if (layer.type !== "text" || !layer.fontSize) return;
      if (
        smallestDraftFontSize === null ||
        layer.fontSize < smallestDraftFontSize
      ) {
        smallestDraftFontSize = layer.fontSize;
      }
      const textColor = layer.color ?? draft.profile.render.palette.text;
      const ratio = contrastRatio(
        textColor,
        draft.profile.render.palette.background,
      );
      const threshold = contrastThresholdFor(layer.fontSize);
      contrastSamples.push({
        sceneId: scene.id,
        layerId: layer.id,
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        meetsThreshold: ratio >= threshold,
      });
    });
  });

  return {
    smallestFontSizeAtFinalWidthPx:
      smallestDraftFontSize === null
        ? null
        : Math.round(smallestDraftFontSize * scaleToFinal),
    contrastSamples,
  };
};
