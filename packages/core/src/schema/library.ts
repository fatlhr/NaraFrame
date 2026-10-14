import { z } from "zod";
import { AssetSchema } from "./asset.js";
import {
  IdSchema,
  SafeRelativePathSchema,
  SchemaVersionSchema,
  Sha256Schema,
  VersionSchema,
} from "./primitives.js";
import { RecipeDeclarationSchema } from "./recipe.js";
import { SceneSchema } from "./scene.js";

const PointerSchema = z.string().regex(/^(?:\/[A-Za-z0-9_-]+){1,24}$/);
const ParameterSchema = z
  .object({
    type: z.enum(["string", "number", "asset"]),
    pointers: z.array(PointerSchema).min(1),
    description: z.string().min(1),
    choices: z.array(IdSchema).min(1).optional(),
  })
  .strict();
const AttachmentSchema = z
  .object({
    targetLayer: IdSchema,
    targetAnchor: IdSchema,
    propLayer: IdSchema,
    propAnchor: IdSchema,
    offset: z
      .object({ x: z.number().finite(), y: z.number().finite() })
      .strict()
      .optional(),
  })
  .strict();
export const LibraryPatternSchema = z
  .object({
    id: IdSchema,
    version: VersionSchema,
    description: z.string().min(1),
    template: SceneSchema,
    parameters: z.record(IdSchema, ParameterSchema),
    attachments: z.array(AttachmentSchema).optional(),
  })
  .strict()
  .superRefine((pattern, ctx) => {
    const pointers = Object.values(pattern.parameters).flatMap(
      (p) => p.pointers,
    );
    pointers.forEach((pointer, i) => {
      if (
        pointer === "/id" ||
        pointers.some(
          (other, j) =>
            j !== i && (pointer === other || pointer.startsWith(`${other}/`)),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["parameters"],
          message:
            "Parameter pointers must be distinct, non-nested existing fields and cannot replace scene ID",
        });
    });
    const writers = new Set<string>(),
      edges = new Map<string, string>();
    for (const attachment of pattern.attachments ?? []) {
      if (
        writers.has(attachment.propLayer) ||
        attachment.propLayer === attachment.targetLayer
      )
        ctx.addIssue({
          code: "custom",
          path: ["attachments"],
          message: "Each prop has one distinct target writer",
        });
      writers.add(attachment.propLayer);
      edges.set(attachment.propLayer, attachment.targetLayer);
    }
    for (const start of edges.keys()) {
      const visited = new Set<string>();
      let current: string | undefined = start;
      while (current && edges.has(current)) {
        if (visited.has(current)) {
          ctx.addIssue({
            code: "custom",
            path: ["attachments"],
            message: "Attachment cycles are unsupported",
          });
          break;
        }
        visited.add(current);
        current = edges.get(current);
      }
    }
    if ([...edges.values()].some((target) => writers.has(target)))
      ctx.addIssue({
        code: "custom",
        path: ["attachments"],
        message:
          "Attachment chains are unsupported; use siblings attached to a fixed target",
      });
  });
export const LibraryCatalogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    provenance: z
      .object({ source: z.string().min(1), license: z.string().min(1) })
      .strict(),
    assets: z.array(AssetSchema),
    recipes: z.array(RecipeDeclarationSchema).optional(),
    patterns: z.array(LibraryPatternSchema).min(1),
  })
  .strict()
  .superRefine((catalog, ctx) => {
    for (const [key, values] of [
      ["assets", catalog.assets],
      ["recipes", catalog.recipes ?? []],
    ] as const) {
      const seen = new Set<string>();
      values.forEach((v, i) => {
        if (seen.has(v.id))
          ctx.addIssue({
            code: "custom",
            path: [key, i, "id"],
            message: "IDs must be unique",
          });
        seen.add(v.id);
      });
    }
    const seen = new Set<string>();
    catalog.patterns.forEach((p, i) => {
      const key = `${p.id}@${p.version}`;
      if (seen.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["patterns", i],
          message: "Pattern ID/version must be unique",
        });
      seen.add(key);
    });
    catalog.assets.forEach((a, i) => {
      if (a.status !== "ready")
        ctx.addIssue({
          code: "custom",
          path: ["assets", i],
          message: "Catalog dependencies must be ready",
        });
    });
  });
const DependencySchema = z
  .object({ id: IdSchema, path: SafeRelativePathSchema, sha256: Sha256Schema })
  .strict();
export const LibraryImportSchema = z
  .object({
    instance: IdSchema,
    sceneId: IdSchema,
    catalog: z
      .object({
        id: IdSchema,
        version: VersionSchema,
        sha256: Sha256Schema,
        provenance: z
          .object({ source: z.string().min(1), license: z.string().min(1) })
          .strict(),
      })
      .strict(),
    pattern: LibraryPatternSchema,
    patternSha256: Sha256Schema,
    values: z.record(IdSchema, z.union([z.string(), z.number().finite()])),
    assets: z.array(AssetSchema),
    assetDependencies: z.array(DependencySchema),
    recipes: z.array(RecipeDeclarationSchema),
    recipeDependencies: z.array(DependencySchema),
    sceneSha256: Sha256Schema,
    disposition: z.enum(["import", "regenerate", "update"]),
  })
  .strict();
export type LibraryCatalog = z.infer<typeof LibraryCatalogSchema>;
export type LibraryPattern = z.infer<typeof LibraryPatternSchema>;
export type LibraryImport = z.infer<typeof LibraryImportSchema>;
