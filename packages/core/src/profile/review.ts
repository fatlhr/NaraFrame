import type { PlanSource } from "../schema/export-schema.js";
import type { PaletteToken } from "../schema/primitives.js";
import type { ProfileLock } from "../schema/profile.js";
import type { Layer } from "../schema/scene.js";

type Palette = ProfileLock["render"]["palette"];

/** A layer colour that names a palette slot whose value this switch changes. */
export interface PaletteBoundLayer {
  sceneId: string;
  layerId: string;
  /** Which colour of the layer: `color`, `fill` or `stroke.color`. */
  property: string;
  token: PaletteToken;
  before: string;
  after: string;
}

/** A layer colour written as a hex value: the switch does not repaint it. */
export interface LiteralColorLayer {
  sceneId: string;
  layerId: string;
  property: string;
  color: string;
}

/** An image layer to look at against the new palette, direction or style. */
export interface ReviewImageLayer {
  sceneId: string;
  layerId: string;
  assetId: string;
}

/**
 * Where the new profile meets existing scene content, found by reading
 * `scenes.json` and never by rendering. It names things to look at; nothing
 * here is rewritten by apply. Shadow colours are not listed.
 */
export interface ProfileReview {
  /** Layers painted from a palette slot whose colour changes. */
  paletteBound: PaletteBoundLayer[];
  /** Hex colours on layers, listed when the palette or direction changes. */
  literalColors: LiteralColorLayer[];
  /** Image layers, listed when palette, direction or illustration style changes. */
  imageLayers: ReviewImageLayer[];
}

const isToken = (value: string): value is PaletteToken =>
  value.startsWith("palette.");

const sameColor = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

/** The colour properties a layer carries, by type, with their values. */
const layerColors = (
  layer: Layer,
): Array<{ property: string; value: string }> => {
  switch (layer.type) {
    case "text":
      return layer.color ? [{ property: "color", value: layer.color }] : [];
    case "shape":
      return [
        { property: "fill", value: layer.fill },
        ...(layer.stroke
          ? [{ property: "stroke.color", value: layer.stroke.color }]
          : []),
      ];
    case "path":
      return [
        { property: "stroke.color", value: layer.stroke.color },
        ...(layer.fill ? [{ property: "fill", value: layer.fill }] : []),
      ];
    case "image":
      return layer.stroke
        ? [{ property: "stroke.color", value: layer.stroke.color }]
        : [];
    default:
      return [];
  }
};

export const planProfileReview = (
  source: PlanSource,
  palettes: { before: Palette; after: Palette },
  changed: { direction: boolean; illustration: boolean },
): ProfileReview | undefined => {
  const slots = Object.keys(palettes.after) as Array<keyof Palette>;
  const paletteChanged = slots.some(
    (slot) => !sameColor(palettes.before[slot], palettes.after[slot]),
  );
  const review: ProfileReview = {
    paletteBound: [],
    literalColors: [],
    imageLayers: [],
  };

  for (const scene of source.scenes.scenes) {
    if (scene.visual.type !== "composition") continue;
    for (const layer of scene.visual.layers) {
      for (const { property, value } of layerColors(layer)) {
        if (isToken(value)) {
          const slot = value.slice("palette.".length) as keyof Palette;
          const before = palettes.before[slot];
          const after = palettes.after[slot];
          if (
            before !== undefined &&
            after !== undefined &&
            !sameColor(before, after)
          ) {
            review.paletteBound.push({
              sceneId: scene.id,
              layerId: layer.id,
              property,
              token: value,
              before,
              after,
            });
          }
        } else if (paletteChanged || changed.direction) {
          review.literalColors.push({
            sceneId: scene.id,
            layerId: layer.id,
            property,
            color: value,
          });
        }
      }
      if (
        layer.type === "image" &&
        (paletteChanged || changed.direction || changed.illustration)
      ) {
        review.imageLayers.push({
          sceneId: scene.id,
          layerId: layer.id,
          assetId: layer.assetId,
        });
      }
    }
  }

  return review.paletteBound.length +
    review.literalColors.length +
    review.imageLayers.length >
    0
    ? review
    : undefined;
};
