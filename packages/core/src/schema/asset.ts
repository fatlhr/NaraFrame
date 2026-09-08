import { z } from "zod";
import {
  IdSchema,
  RelativePngPathSchema,
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

const PlannedAssetSchema = z
  .object({
    id: IdSchema,
    status: z.literal("planned"),
    kind: z.literal("png"),
    purpose: z.string().trim().min(1),
    intendedOrigin: AssetOriginTypeSchema,
  })
  .strict();

const ReadyAssetSchema = z
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

export const AssetSchema = z.discriminatedUnion("status", [
  PlannedAssetSchema,
  ReadyAssetSchema,
]);

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
