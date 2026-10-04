import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { Issue } from "../model/issue.js";
import type { CompiledDraft } from "../schema/compiled.js";
import {
  IdSchema,
  SchemaVersionSchema,
  Sha256Schema,
} from "../schema/primitives.js";
import { atomicWrite, revisionsDirectory } from "./store.js";

/**
 * The owner's acceptance of one exact recipe code hash for this project.
 * Project state, not source: editing source files never grants trust, and an
 * undo back to accepted code needs no new acceptance.
 */
export const RecipeTrustSchema = z
  .object({
    recipeId: IdSchema,
    codeSha256: Sha256Schema,
    authorizedBy: z.string().trim().min(1),
    note: z.string().trim().min(1).optional(),
    trustedAt: z.string().datetime(),
  })
  .strict();

const RecipeTrustLogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    trusted: z.array(RecipeTrustSchema),
  })
  .strict();

export type RecipeTrust = z.infer<typeof RecipeTrustSchema>;

const trustPath = (root: string): string =>
  join(revisionsDirectory(root), "recipe-trust.json");

export const readRecipeTrust = async (root: string): Promise<RecipeTrust[]> => {
  try {
    const parsed = RecipeTrustLogSchema.safeParse(
      JSON.parse(await readFile(trustPath(root), "utf8")),
    );
    return parsed.success ? parsed.data.trusted : [];
  } catch {
    return [];
  }
};

/** Append-only, like approvals: trust is a fact about a moment. */
export const recordRecipeTrust = async (
  root: string,
  trust: RecipeTrust,
): Promise<RecipeTrust> => {
  const valid = RecipeTrustSchema.parse(trust);
  const existing = await readRecipeTrust(root);
  await atomicWrite(
    trustPath(root),
    `${JSON.stringify({ schemaVersion: 1, trusted: [...existing, valid] }, null, 2)}\n`,
  );
  return valid;
};

/**
 * Recipe scenes in a compiled draft whose exact code hash the owner has not
 * accepted. Checked before anything is bundled or executed.
 */
export const checkRecipeTrust = (
  draft: CompiledDraft,
  trusted: readonly RecipeTrust[],
): Issue[] => {
  const issues: Issue[] = [];
  const reported = new Set<string>();
  draft.scenes.forEach((scene) => {
    if (scene.visual.type !== "recipe") return;
    const { recipe, codeSha256 } = scene.visual;
    if (reported.has(recipe)) return;
    if (
      trusted.some(
        (entry) => entry.recipeId === recipe && entry.codeSha256 === codeSha256,
      )
    ) {
      return;
    }
    reported.add(recipe);
    issues.push({
      code: "RECIPE_NOT_TRUSTED",
      severity: "error",
      responsible: "user",
      artifact: "naraframe.json",
      path: "/recipes",
      entityId: recipe,
      message: `Recipe ${recipe} code ${codeSha256.slice(0, 12)} has not been accepted for this project, so it is not run.`,
      suggestion: `Have the owner review the recipe code, then run: naraframe recipe trust <project> --recipe ${recipe} --authorized-by <name>.`,
    });
  });
  return issues;
};
