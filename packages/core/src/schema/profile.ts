import { z } from "zod";
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
        headingWeight: z.number().int().min(100).max(900),
        bodyWeight: z.number().int().min(100).max(900),
      })
      .strict(),
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

const ProfileAssetBaseSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(["font", "png"]),
    path: SafeRelativePathSchema,
    sha256: Sha256Schema.optional(),
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
  });

export const ProfileSourceSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    render: RenderTokensSchema,
    production: ProductionProfileSchema,
    duration: DurationProfileSchema,
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
