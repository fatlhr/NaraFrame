import { z } from "zod";
import {
  ColorSchema,
  ConfigPathSchema,
  IdSchema,
  PositiveIntegerSchema,
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
        text: z.string().trim().min(1),
        sha256: Sha256Schema,
      })
      .strict(),
    render: RenderTokensSchema,
    production: z
      .object({
        voiceStyleSignature: z.string().trim().min(1),
        illustrationStyleSignature: z.string().trim().min(1),
        timing: z.object({ wordLevelRequired: z.boolean() }).strict(),
        assetPolicy: z.object({ allowPlannedInDraft: z.boolean() }).strict(),
      })
      .strict(),
    duration: z
      .object({
        preferredMinMs: PositiveIntegerSchema,
        preferredMaxMs: PositiveIntegerSchema,
      })
      .strict()
      .refine((value) => value.preferredMinMs <= value.preferredMaxMs, {
        message: "preferredMinMs must not exceed preferredMaxMs",
        path: ["preferredMinMs"],
      }),
    lockedPaths: z.array(ConfigPathSchema),
    overridablePaths: z.array(ConfigPathSchema),
  })
  .strict()
  .superRefine((profile, context) => {
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
  });

export type RenderTokens = z.infer<typeof RenderTokensSchema>;
export type ProfileLock = z.infer<typeof ProfileLockSchema>;
