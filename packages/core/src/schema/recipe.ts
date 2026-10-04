import { z } from "zod";
import { IdSchema, SchemaVersionSchema, VersionSchema } from "./primitives.js";

const CodeFileSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.tsx?$/,
    "Recipe files are .ts or .tsx paths inside the recipe directory",
  );

/** Where a project keeps one trusted local recipe. */
export const RecipeDeclarationSchema = z
  .object({
    id: IdSchema,
    path: z
      .string()
      .regex(
        /^recipes\/[A-Za-z0-9_-]+$/,
        "A recipe lives in its own directory under recipes/",
      ),
  })
  .strict();

/**
 * `recipe.json` inside a recipe directory: the entry and every code file the
 * recipe may load. Only these files are hashed, snapshotted and bundled.
 */
export const RecipeManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    entry: CodeFileSchema,
    files: z.array(CodeFileSchema).min(1).max(64),
    description: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((manifest, context) => {
    if (!manifest.files.includes(manifest.entry)) {
      context.addIssue({
        code: "custom",
        message: "The entry must be one of the listed files",
        path: ["entry"],
      });
    }
    if (new Set(manifest.files).size !== manifest.files.length) {
      context.addIssue({
        code: "custom",
        message: "Recipe files must be unique",
        path: ["files"],
      });
    }
  });

export type RecipeDeclaration = z.infer<typeof RecipeDeclarationSchema>;
export type RecipeManifest = z.infer<typeof RecipeManifestSchema>;

/** A recipe as read from disk: its manifest and the hash of each file. */
export interface LoadedRecipe {
  id: string;
  version: string;
  path: string;
  entry: string;
  /** recipe.json plus every listed file, project-relative, with hashes. */
  files: Array<{ path: string; sha256: string }>;
  /** One hash over all of the above; trust and render keys bind to it. */
  codeSha256: string;
}
