import { z } from "zod";
import { CaptionModeSchema } from "./captions.js";
import {
  ColorSchema,
  ConfigPathSchema,
  IdSchema,
  PositiveIntegerSchema,
  SafeRelativePathSchema,
  SchemaVersionSchema,
  Sha256Schema,
  VersionSchema,
} from "./primitives.js";
import { ShadowSchema, StrokeSchema } from "./scene.js";

const TypographyRoleTokenSchema = z
  .object({
    /** Overrides the profile family for this role; must be a bundled font. */
    fontFamily: z.string().trim().min(1).optional(),
    fontSize: z.number().min(12).max(320),
    fontWeight: z.number().int().min(100).max(900),
    lineHeight: z.number().min(0.8).max(2),
    letterSpacing: z.number().min(-20).max(40),
  })
  .strict();

const AppearanceTokensSchema = z
  .object({
    radius: z
      .object({
        small: z.number().min(0).max(960),
        medium: z.number().min(0).max(960),
        large: z.number().min(0).max(960),
      })
      .strict(),
    stroke: StrokeSchema,
    shadow: ShadowSchema,
    media: z
      .object({
        fit: z.enum(["cover", "contain"]),
        cornerRadius: z.number().min(0).max(960),
      })
      .strict(),
  })
  .strict();

/**
 * Bounds on how much a project may repeat itself. Absent fields fall back to
 * VARIETY_DEFAULTS in the compiler; `severity` decides whether a repetition
 * finding blocks publication or only reports.
 */
/**
 * A profile-declared vocabulary of permitted choices — the menu bang-motion
 * enforces through advisory prompt rules, made checkable instead: a scene
 * whose reveal direction, transition type, or focus camera falls outside
 * the declared set is a compile-time error, not a style opinion an agent
 * may ignore. Absent (the default) means unrestricted, so existing
 * profiles are unaffected until they opt in.
 */
const ChoiceMenuSchema = z
  .object({
    entryDirections: z
      .array(z.enum(["up", "down", "left", "right"]))
      .min(1)
      .optional(),
    transitionTypes: z
      .array(z.enum(["cut", "push-through", "mask-reveal", "match-cut"]))
      .min(1)
      .optional(),
    focusCameras: z
      .array(z.enum(["push", "pan", "zoom"]))
      .min(1)
      .optional(),
  })
  .strict();

const VarietyPolicySchema = z
  .object({
    maxConsecutiveSameEntry: z.number().int().min(1).max(20).optional(),
    maxScenesWithoutViewpointChange: z.number().int().min(1).max(20).optional(),
    requireMultipleTransitionTypes: z.boolean().optional(),
    requireMultipleTypeRoles: z.boolean().optional(),
    severity: z.enum(["warning", "error"]).optional(),
    menu: ChoiceMenuSchema.optional(),
  })
  .strict();

export const RenderTokensSchema = z
  .object({
    palette: z
      .object({
        background: ColorSchema,
        surface: ColorSchema,
        text: ColorSchema,
        accent: ColorSchema,
      })
      .strict(),
    typography: z
      .object({
        fontFamily: z.string().trim().min(1),
        /** Applied to `role: "display"` text (and scene-level "text"
         * visuals) only, so a project can use one distinct display face
         * without touching body/heading/label. Must match a bundled
         * `assets[].family` of `kind: "font"`, or a real collision/overflow
         * check can never load it and FONT_NOT_LOADED fires honestly. */
        displayFontFamily: z.string().trim().min(1).optional(),
        headingWeight: z.number().int().min(100).max(900),
        bodyWeight: z.number().int().min(100).max(900),
        minimumFontSize: z.number().min(12).max(160).optional(),
        roles: z
          .object({
            display: TypographyRoleTokenSchema,
            heading: TypographyRoleTokenSchema,
            body: TypographyRoleTokenSchema,
            label: TypographyRoleTokenSchema,
          })
          .strict()
          .optional(),
      })
      .strict(),
    appearance: AppearanceTokensSchema.optional(),
    /** Caption style in design pixels; unset fields use renderer defaults. */
    captions: z
      .object({
        mode: CaptionModeSchema.optional(),
        fontSize: z.number().int().min(16).max(96).optional(),
        maxLines: z.number().int().min(1).max(4).optional(),
        bottomOffset: z.number().int().nonnegative().optional(),
        sideOffset: z.number().int().nonnegative().optional(),
        scrimOpacity: z.number().min(0).max(1).optional(),
        lineHeight: z.number().min(1).max(3).optional(),
      })
      .strict()
      .optional(),
    variety: VarietyPolicySchema.optional(),
    safeZone: z
      .object({
        top: z.number().int().nonnegative(),
        right: z.number().int().nonnegative(),
        bottom: z.number().int().nonnegative(),
        left: z.number().int().nonnegative(),
      })
      .strict(),
    spacingUnit: PositiveIntegerSchema,
    motion: z
      .object({
        revealDurationMs: PositiveIntegerSchema,
        emphasizeScale: z.number().min(1).max(2),
        focusScale: z.number().min(1).max(2),
      })
      .strict(),
  })
  .strict();

export const ProductionProfileSchema = z
  .object({
    voiceStyleSignature: z.string().trim().min(1),
    illustrationStyleSignature: z.string().trim().min(1),
    timing: z.object({ wordLevelRequired: z.boolean() }).strict(),
    assetPolicy: z.object({ allowPlannedInDraft: z.boolean() }).strict(),
    requireSourcing: z.boolean().optional(),
    /** Default audio mode for this profile's projects; lock it to require it. */
    audioMode: z.enum(["voice", "music", "silent"]).optional(),
  })
  .strict();

export const DurationProfileSchema = z
  .object({
    preferredMinMs: PositiveIntegerSchema,
    preferredMaxMs: PositiveIntegerSchema,
  })
  .strict()
  .refine((value) => value.preferredMinMs <= value.preferredMaxMs, {
    message: "preferredMinMs must not exceed preferredMaxMs",
    path: ["preferredMinMs"],
  });

/** What a brand asset is for; a profile switch replaces it by role. */
export const BrandRoleSchema = z.enum([
  "logo",
  "person",
  "product",
  "illustration",
  "background",
]);

/**
 * Identity a profile carries beyond its look: who it speaks to, editorial
 * rules, and the call to action. Scenes bind to these values explicitly; a
 * profile switch reports them for review and never rewrites copy by itself.
 */
export const BrandSchema = z
  .object({
    name: z.string().trim().min(1),
    audience: z.string().trim().min(1).optional(),
    editorial: z.array(z.string().trim().min(1)).max(12).optional(),
    cta: z
      .object({
        label: z.string().trim().min(1),
        url: z.string().trim().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

const ProfileAssetBaseSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(["font", "png"]),
    /** PNG-only: the brand role this image fills. */
    role: BrandRoleSchema.optional(),
    path: SafeRelativePathSchema,
    sha256: Sha256Schema.optional(),
    /** Font-only: the CSS family name the renderer registers this face
     * under. Required for `kind: "font"`, forbidden otherwise. */
    family: z.string().trim().min(1).optional(),
    weight: z.number().int().min(100).max(900).optional(),
  })
  .strict()
  .superRefine((asset, context) => {
    const lowerPath = asset.path.toLowerCase();
    const hasExpectedExtension =
      asset.kind === "png"
        ? lowerPath.endsWith(".png")
        : [".ttf", ".otf", ".woff2"].some((extension) =>
            lowerPath.endsWith(extension),
          );

    if (!hasExpectedExtension) {
      context.addIssue({
        code: "custom",
        message:
          asset.kind === "png"
            ? "PNG profile assets must end in .png"
            : "Font profile assets must end in .ttf, .otf, or .woff2",
        path: ["path"],
      });
    }

    if (asset.kind === "font" && !asset.family) {
      context.addIssue({
        code: "custom",
        message: "Font profile assets must declare a family name",
        path: ["family"],
      });
    }
    if (asset.kind === "font" && asset.role) {
      context.addIssue({
        code: "custom",
        message: "Font profile assets cannot declare a brand role",
        path: ["role"],
      });
    }
    if (asset.kind === "png" && (asset.family || asset.weight !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "PNG profile assets cannot declare family or weight",
        path: ["family"],
      });
    }
  });

export const ProfileSourceSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    render: RenderTokensSchema,
    production: ProductionProfileSchema,
    duration: DurationProfileSchema,
    brand: BrandSchema.optional(),
    lockedPaths: z.array(ConfigPathSchema),
    overridablePaths: z.array(ConfigPathSchema),
    assets: z.array(ProfileAssetBaseSchema).default([]),
  })
  .strict()
  .superRefine(validateProfileCollections);

export const LockedProfileAssetSchema = ProfileAssetBaseSchema.safeExtend({
  sha256: Sha256Schema,
}).strict();

export const ProfileLockSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    source: z
      .object({
        kind: z.enum(["repository", "local"]),
        identity: z.string().trim().min(1),
      })
      .strict(),
    direction: z
      .object({
        text: z
          .string()
          .refine(
            (value) => value.trim().length > 0,
            "Direction cannot be empty",
          ),
        sha256: Sha256Schema,
      })
      .strict(),
    render: RenderTokensSchema,
    production: ProductionProfileSchema,
    duration: DurationProfileSchema,
    brand: BrandSchema.optional(),
    lockedPaths: z.array(ConfigPathSchema),
    overridablePaths: z.array(ConfigPathSchema),
    assets: z.array(LockedProfileAssetSchema).default([]),
  })
  .strict()
  .superRefine(validateProfileCollections);

function validateProfileCollections(
  profile: {
    lockedPaths: string[];
    overridablePaths: string[];
    assets: Array<{ id: string; path: string }>;
  },
  context: z.RefinementCtx,
) {
  const lockedPaths = new Set<string>();

  profile.lockedPaths.forEach((path, index) => {
    if (lockedPaths.has(path)) {
      context.addIssue({
        code: "custom",
        message: "Locked configuration paths must be unique",
        path: ["lockedPaths", index],
      });
    }
    lockedPaths.add(path);
  });

  const overridablePaths = new Set<string>();
  profile.overridablePaths.forEach((path, index) => {
    if (overridablePaths.has(path) || lockedPaths.has(path)) {
      context.addIssue({
        code: "custom",
        message: "Overridable paths must be unique and cannot also be locked",
        path: ["overridablePaths", index],
      });
    }
    overridablePaths.add(path);
  });

  const assetIds = new Set<string>();
  const assetPaths = new Set<string>();
  profile.assets.forEach((asset, index) => {
    if (assetIds.has(asset.id) || assetPaths.has(asset.path)) {
      context.addIssue({
        code: "custom",
        message: "Profile asset IDs and paths must be unique",
        path: ["assets", index],
      });
    }
    assetIds.add(asset.id);
    assetPaths.add(asset.path);
  });
}

export type RenderTokens = z.infer<typeof RenderTokensSchema>;
export type ProfileSource = z.infer<typeof ProfileSourceSchema>;
export type LockedProfileAsset = z.infer<typeof LockedProfileAssetSchema>;
export type ProfileLock = z.infer<typeof ProfileLockSchema>;
