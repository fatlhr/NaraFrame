import { z } from "zod";
import {
  IdSchema,
  RelativeAudioPathSchema,
  RelativePngPathSchema,
  RelativeSvgPathSchema,
  SchemaVersionSchema,
  Sha256Schema,
} from "./primitives.js";

const AssetOriginTypeSchema = z.enum([
  "web",
  "licensed",
  "generated",
  "user",
  "bundled",
]);

const PlannedPngAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("planned"),
    kind: z.literal("png"),
    purpose: z.string().trim().min(1),
    intendedOrigin: AssetOriginTypeSchema,
  })
  .strict();

const PlannedAudioAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("planned"),
    kind: z.enum(["mp3", "wav", "m4a"]),
    purpose: z.string().trim().min(1),
    intendedOrigin: AssetOriginTypeSchema,
  })
  .strict();

const PlannedVectorAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("planned"),
    kind: z.literal("svg"),
    purpose: z.string().trim().min(1),
    intendedOrigin: AssetOriginTypeSchema,
  })
  .strict();

const PlannedAssetSchema = z.union([
  PlannedPngAssetSchema,
  PlannedVectorAssetSchema,
  PlannedAudioAssetSchema,
]);

const ReadyPngAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("ready"),
    kind: z.literal("png"),
    path: RelativePngPathSchema,
    sha256: Sha256Schema,
    origin: z
      .object({
        type: AssetOriginTypeSchema,
        source: z.string().trim().min(1).optional(),
        license: z.string().trim().min(1).optional(),
      })
      .strict(),
  })
  .strict();

const ReadyAudioAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("ready"),
    kind: z.enum(["mp3", "wav", "m4a"]),
    path: RelativeAudioPathSchema,
    sha256: Sha256Schema,
    /** What the clip was spoken from, so edited text cannot reuse stale voice. */
    generation: z
      .object({
        textSha256: Sha256Schema,
        voiceStyleSignature: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),
    origin: z
      .object({
        type: AssetOriginTypeSchema,
        source: z.string().trim().min(1).optional(),
        license: z.string().trim().min(1).optional(),
      })
      .strict(),
  })
  .strict();

/** Vector artwork. It is passive data: the loader refuses anything runnable. */
const ReadyVectorAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("ready"),
    kind: z.literal("svg"),
    path: RelativeSvgPathSchema,
    sha256: Sha256Schema,
    origin: z
      .object({
        type: AssetOriginTypeSchema,
        source: z.string().trim().min(1).optional(),
        license: z.string().trim().min(1).optional(),
      })
      .strict(),
  })
  .strict();

const ReadyAssetSchema = z.union([
  ReadyPngAssetSchema,
  ReadyAudioAssetSchema,
  ReadyVectorAssetSchema,
]);

export const AssetSchema = z.union([PlannedAssetSchema, ReadyAssetSchema]);

export const AssetManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    assets: z.array(AssetSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = new Set<string>();
    manifest.assets.forEach((asset, index) => {
      if (ids.has(asset.id)) {
        context.addIssue({
          code: "custom",
          message: "Asset IDs must be unique",
          path: ["assets", index, "id"],
        });
      }
      ids.add(asset.id);
    });
  });

export type Asset = z.infer<typeof AssetSchema>;
export type AssetManifest = z.infer<typeof AssetManifestSchema>;
