import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  compileDraft,
  loadPlanProject,
  recordRecipeTrust,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { makeRecipeProject } from "../../../core/test/integration/recipe-fixture.js";
import { prepareRecipeEntry } from "../../src/render-draft.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const filesUnder = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)))
    .sort();
};

/** A trusted recipe project compiled from disk, as the CLI would render it. */
const trustedProject = async () => {
  const root = await makeRecipeProject(undefined, {
    track: (path) => roots.push(path),
  });
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(loaded.issues.map((i) => i.code).join());
  const draft = compileDraft(loaded.value.source);
  if (!draft.ok) throw new Error(draft.issues.map((i) => i.code).join());
  const visual = draft.value.scenes[0]?.visual;
  if (visual?.type !== "recipe") throw new Error("fixture");
  const trusted = await recordRecipeTrust(root, {
    recipeId: visual.recipe,
    codeSha256: visual.codeSha256,
    authorizedBy: "Owner",
    trustedAt: new Date().toISOString(),
  });
  expect(trusted.ok).toBe(true);
  return { root, draft: draft.value };
};

const baseEntry = join(import.meta.dirname, "../../src/remotion/entry.tsx");

describe("recipe staging for the bundle", () => {
  it("bundles only the listed files, byte for byte, never an unlisted sibling", async () => {
    const { root, draft } = await trustedProject();
    const recipeDir = join(root, "recipes", "frame-card");
    // Unlisted files a resolver could otherwise prefer for "./crop".
    await writeFile(
      join(recipeDir, "crop.tsx"),
      'throw new Error("unlisted");\n',
    );
    await writeFile(join(recipeDir, "extra.ts"), "export const x = 1;\n");

    const staged = await prepareRecipeEntry(draft, root, baseEntry);
    if (!staged) throw new Error("expected a staged entry");
    roots.push(staged.directory);
    expect(await filesUnder(staged.directory)).toEqual([
      "entry.tsx",
      "recipes/frame-card/crop.ts",
      "recipes/frame-card/index.tsx",
      "recipes/frame-card/recipe.json",
    ]);
    for (const file of ["crop.ts", "index.tsx", "recipe.json"]) {
      expect(
        await readFile(join(staged.directory, "recipes", "frame-card", file)),
      ).toEqual(await readFile(join(recipeDir, file)));
    }
    const entry = await readFile(join(staged.directory, "entry.tsx"), "utf8");
    expect(entry).toContain(
      JSON.stringify(
        join(staged.directory, "recipes", "frame-card", "index.tsx"),
      ),
    );
    expect(entry).not.toContain(JSON.stringify(recipeDir));
  });

  it("refuses code changed after it was compiled and trusted", async () => {
    const { root, draft } = await trustedProject();
    const index = join(root, "recipes", "frame-card", "index.tsx");
    await writeFile(index, `${await readFile(index, "utf8")}\n// changed\n`);
    await expect(prepareRecipeEntry(draft, root, baseEntry)).rejects.toThrow(
      /changed on disk|not been accepted/,
    );
  });

  it("refuses untrusted code before staging anything", async () => {
    const root = await makeRecipeProject(undefined, {
      track: (path) => roots.push(path),
    });
    const loaded = await loadPlanProject(root);
    if (!loaded.ok) throw new Error("fixture");
    const draft = compileDraft(loaded.value.source);
    if (!draft.ok) throw new Error("fixture");
    await expect(
      prepareRecipeEntry(draft.value, root, baseEntry),
    ).rejects.toThrow(/has not been accepted/);
  });
});
