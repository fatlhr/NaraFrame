import { z } from "zod";
import { IdSchema, SchemaVersionSchema, VersionSchema } from "./primitives.js";
import { TypographyRoleSchema } from "./scene.js";

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

/** Profile fields a recipe parameter may declare it carries. */
export const RECIPE_BINDING_FIELDS = [
  "brand.name",
  "brand.cta.label",
  "brand.cta.url",
  "render.palette.background",
  "render.palette.surface",
  "render.palette.text",
  "render.palette.accent",
] as const;

export type RecipeBindingField = (typeof RECIPE_BINDING_FIELDS)[number];

/**
 * One identity value inside a scene's recipe params: an explicit JSON
 * pointer (no wildcards or expressions) and the profile field it must equal.
 */
export const RecipeBindingSchema = z
  .object({
    param: z
      .string()
      .regex(
        /^(?:\/[A-Za-z0-9_-]+){1,16}$/,
        'A binding names one params location as a JSON pointer such as "/brand/name"',
      ),
    field: z.enum(RECIPE_BINDING_FIELDS),
  })
  .strict();

export type RecipeBinding = z.infer<typeof RecipeBindingSchema>;

const ParamPointerSchema = z
  .string()
  .regex(
    /^(?:\/[A-Za-z0-9_-]+){1,16}$/,
    'A text slot names one params location as a JSON pointer such as "/headline"',
  );

/**
 * One text slot the recipe draws and NaraFrame measures. Every length is a
 * CSS pixel in the 1080×1920 design frame: lineHeight is the pixel distance
 * between lines (CSS line-height in px), letterSpacing a pixel value that may
 * be zero or negative. `param` points at a string, or at an array whose
 * elements are each one instance of the slot.
 */
export const RecipeTextSlotSchema = z
  .object({
    id: IdSchema,
    param: ParamPointerSchema,
    role: TypographyRoleSchema,
    fontSize: z.number().positive().max(1000),
    lineHeight: z.number().positive().max(2000),
    letterSpacing: z.number().min(-200).max(200).optional(),
    fontWeight: z.number().int().min(100).max(900).optional(),
    box: z
      .object({
        width: z.number().positive().max(1080),
        height: z.number().positive().max(1920),
      })
      .strict(),
    maxLines: z.number().int().min(1).max(50),
    /** words: CSS white-space pre-line; none: CSS white-space pre. */
    wrap: z.enum(["words", "none"]),
  })
  .strict();

export type RecipeTextSlot = z.infer<typeof RecipeTextSlotSchema>;

/**
 * `recipe.json` inside a recipe directory: the entry and every code file the
 * recipe may load. Only these files are hashed, snapshotted and bundled.
 * `bindings` declares which params carry brand identity; recipe.json is
 * hashed with the code, so changing or removing them needs trust again.
 */
export const RecipeManifestSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    version: VersionSchema,
    entry: CodeFileSchema,
    files: z.array(CodeFileSchema).min(1).max(64),
    description: z.string().trim().min(1).optional(),
    bindings: z.array(RecipeBindingSchema).max(64).optional(),
    textSlots: z.array(RecipeTextSlotSchema).max(32).optional(),
  })
  .strict()
  .superRefine((manifest, context) => {
    const slots = manifest.textSlots ?? [];
    slots.forEach((slot, index) => {
      if (slots.findIndex((other) => other.id === slot.id) !== index) {
        context.addIssue({
          code: "custom",
          message: `Text slot id ${slot.id} is declared more than once`,
          path: ["textSlots", index, "id"],
        });
      }
      const clash = slots.find(
        (other, otherIndex) =>
          otherIndex !== index &&
          (other.param === slot.param ||
            slot.param.startsWith(`${other.param}/`)),
      );
      if (clash) {
        context.addIssue({
          code: "custom",
          message:
            clash.param === slot.param
              ? `Params location ${slot.param} is a text slot more than once`
              : `Text slot ${slot.id} at ${slot.param} lies inside slot ${clash.id} at ${clash.param}`,
          path: ["textSlots", index, "param"],
        });
      }
    });
    const params = (manifest.bindings ?? []).map((binding) => binding.param);
    params.forEach((param, index) => {
      const clash = params.find(
        (other, otherIndex) =>
          otherIndex !== index &&
          (other === param || param.startsWith(`${other}/`)),
      );
      if (clash) {
        context.addIssue({
          code: "custom",
          message:
            clash === param
              ? `Params location ${param} is bound more than once`
              : `Params location ${param} lies inside ${clash}, which is bound as a whole`,
          path: ["bindings", index, "param"],
        });
      }
    });
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
  /** Declared identity params; absent for a recipe that declares none. */
  bindings?: RecipeBinding[];
  /** Declared measured text slots; absent for a recipe that declares none. */
  textSlots?: RecipeTextSlot[];
}
