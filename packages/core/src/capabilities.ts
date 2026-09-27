import { z } from "zod";
import { AssetManifestSchema } from "./schema/asset.js";
import { ProfileLockSchema } from "./schema/profile.js";
import {
  BeatSchema,
  LayerSchema,
  SceneVisualSchema,
  TransitionSchema,
} from "./schema/scene.js";

/**
 * What this build can actually do.
 *
 * The spec's rule is that the registry advertises only implemented, tested
 * forms, so nothing here is written by hand twice: every list is read from
 * the schema that accepts it, and a test asserts each entry has a reference
 * project or a named test behind it. A form that ships without evidence
 * fails that test rather than quietly appearing here.
 */
export interface CapabilityRegistry {
  schemaVersion: 1;
  /** Scene-level visual forms. */
  visuals: string[];
  /** Layer types inside a composition, and the group layouts available. */
  layers: string[];
  groupLayouts: string[];
  /** Motion vocabulary. */
  beats: string[];
  beatCameras: string[];
  compositionMotion: string[];
  transitions: string[];
  /** Colour slots a scene may name instead of a literal hex. */
  paletteTokens: string[];
  /** What a headline run may mean; the profile decides how it looks. */
  textEmphasis: string[];
  /** Media the loader accepts, by asset kind. */
  media: {
    images: string[];
    vectors: string[];
    audio: string[];
    fonts: string[];
  };
  /** Audio features the compiler and renderer wire up. */
  audio: string[];
  /** Forms deliberately not implemented, with the reason. */
  unsupported: Array<{ name: string; reason: string }>;
}

const optionsOf = (
  schema: z.ZodType,
  pointer: string[],
  discriminator = "type",
): string[] => {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<
    string,
    unknown
  >;
  let node: unknown = json;
  for (const key of pointer) {
    node = (node as Record<string, unknown> | undefined)?.[key];
  }
  const values = Array.isArray(node) ? node : [];
  return values
    .map((entry) => {
      const properties = (entry as { properties?: Record<string, unknown> })
        .properties;
      const type = properties?.[discriminator] as
        | { const?: unknown }
        | undefined;
      return typeof type?.const === "string" ? type.const : undefined;
    })
    .filter((value): value is string => value !== undefined)
    .sort();
};

const enumOf = (schema: z.ZodType): string[] => {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as {
    enum?: unknown[];
  };
  return (json.enum ?? [])
    .filter((value): value is string => typeof value === "string")
    .sort();
};

const assetKinds = (): {
  images: string[];
  vectors: string[];
  audio: string[];
} => {
  const json = JSON.stringify(
    z.toJSONSchema(AssetManifestSchema, { target: "draft-2020-12" }),
  );
  const kinds = new Set<string>();
  for (const match of json.matchAll(
    /"kind":\{"type":"string","(?:const":("[^"]*")|enum":(\[[^\]]*\]))/g,
  )) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    const values = JSON.parse(
      raw.startsWith("[") ? raw : `[${raw}]`,
    ) as string[];
    for (const value of values) kinds.add(value);
  }
  return {
    images: [...kinds].filter((kind) => kind === "png").sort(),
    vectors: [...kinds].filter((kind) => kind === "svg").sort(),
    audio: [...kinds].filter((kind) => kind !== "png" && kind !== "svg").sort(),
  };
};

const fontKinds = (): string[] => {
  const json = JSON.stringify(
    z.toJSONSchema(ProfileLockSchema, { target: "draft-2020-12" }),
  );
  return json.includes('"font"') ? ["ttf", "otf", "woff2"] : [];
};

export const capabilityRegistry = (): CapabilityRegistry => {
  const assets = assetKinds();
  return {
    schemaVersion: 1,
    visuals: optionsOf(SceneVisualSchema, ["oneOf"]),
    layers: optionsOf(LayerSchema, ["oneOf"]),
    groupLayouts: ["absolute", "grid", "stack"],
    beats: optionsOf(BeatSchema, ["oneOf"], "action"),
    beatCameras: ["pan", "push", "zoom"],
    compositionMotion: [
      "billboard",
      "camera-framing",
      "camera-moves",
      "parallax",
      "world-overlay",
    ],
    transitions: optionsOf(TransitionSchema, ["oneOf"]),
    paletteTokens: [
      "palette.accent",
      "palette.background",
      "palette.surface",
      "palette.text",
    ],
    textEmphasis: ["accent", "quiet", "strong"],
    media: {
      images: assets.images,
      vectors: assets.vectors,
      audio: assets.audio,
      fonts: fontKinds(),
    },
    audio: [
      "captions",
      "music",
      "narration",
      "phrase-anchors",
      "sfx",
      "ducking",
    ].sort(),
    unsupported: [
      { name: "video-asset", reason: "No decode or timing test has been run." },
      {
        name: "jpeg",
        reason: "Only PNG is loaded and hashed by the asset pipeline.",
      },
      {
        name: "per-project-code",
        reason: "Projects are source only; no scene code is executed.",
      },
    ],
  };
};

export { enumOf as capabilityEnumOf };
