import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkRecipeTrust,
  compileDraft,
  computeSceneRenderKeys,
  editProject,
  loadPlanProject,
  type PlanSource,
  readRecipeTrust,
  recordRecipeTrust,
  syncWorkingCopy,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  cardParams,
  makeRecipeProject as makeProject,
} from "./recipe-fixture.js";

const roots: string[] = [];
const makeRecipeProject = (
  params?: Record<string, unknown>,
  options: { beats?: unknown[]; declare?: boolean } = {},
) => makeProject(params, { ...options, track: (root) => roots.push(root) });
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const load = async (root: string): Promise<PlanSource> => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok)
    throw new Error(loaded.issues.map((issue) => issue.code).join());
  return loaded.value.source;
};

const loadCodes = async (root: string) => {
  const loaded = await loadPlanProject(root);
  return loaded.ok ? [] : loaded.issues.map((issue) => issue.code);
};

const compiled = (source: PlanSource) => {
  const result = compileDraft(source);
  if (!result.ok)
    throw new Error(result.issues.map((issue) => issue.code).join());
  return result.value;
};

const compileCodes = (source: PlanSource) =>
  compileDraft(source)
    .issues.filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);

describe("recipe projects", () => {
  it("pins every listed code file and the PNG sizes into the source", async () => {
    const source = await load(await makeRecipeProject());
    expect(source.recipes).toHaveLength(1);
    expect(source.recipes?.[0]).toMatchObject({
      id: "frame-card",
      version: "1.0.0",
      entry: "index.tsx",
      files: [
        { path: "recipes/frame-card/recipe.json" },
        { path: "recipes/frame-card/index.tsx" },
        { path: "recipes/frame-card/crop.ts" },
      ],
    });
    expect(source.imageSizes).toEqual({ photo: { width: 200, height: 300 } });
    const draft = compiled(source);
    expect(draft.scenes[0]?.visual).toMatchObject({
      type: "recipe",
      recipe: "frame-card",
      codeSha256: source.recipes?.[0]?.codeSha256,
      assets: {
        photo: { publicPath: "assets/photo.png", width: 200, height: 300 },
      },
    });
  });

  it("leaves a project without recipes exactly as before", async () => {
    const root = await makeRecipeProject();
    await writeFile(
      join(root, "scenes.json"),
      JSON.stringify({
        schemaVersion: 1,
        scenes: [
          {
            id: "card",
            narrativeRole: "cta",
            durationMs: 1000,
            visual: { type: "text", text: "Plain" },
            beats: [],
            transition: { type: "cut" },
          },
        ],
      }),
    );
    const config = JSON.parse(
      await readFile(join(root, "naraframe.json"), "utf8"),
    );
    delete config.recipes;
    await writeFile(join(root, "naraframe.json"), JSON.stringify(config));
    const source = await load(root);
    expect("recipes" in source).toBe(false);
    expect("imageSizes" in source).toBe(false);
  });

  it("changes source revision and render keys when code or params change", async () => {
    const root = await makeRecipeProject();
    const before = compiled(await load(root));
    const index = join(root, "recipes", "frame-card", "index.tsx");
    await writeFile(index, `${await readFile(index, "utf8")}\n// edited\n`);
    const codeChanged = compiled(await load(root));
    expect(codeChanged.sourceRevision).not.toBe(before.sourceRevision);
    expect(codeChanged.assemblyKey).not.toBe(before.assemblyKey);
    expect(computeSceneRenderKeys(codeChanged)[0]?.key).not.toBe(
      computeSceneRenderKeys(before)[0]?.key,
    );

    const paramsChanged = compiled(
      await load(
        await makeRecipeProject(cardParams({ title: "Another title" })),
      ),
    );
    expect(paramsChanged.assemblyKey).not.toBe(before.assemblyKey);
  });

  it("refuses unsafe code at load time", async () => {
    const root = await makeRecipeProject();
    const index = join(root, "recipes", "frame-card", "index.tsx");
    const code = await readFile(index, "utf8");
    await writeFile(index, `import { readFileSync } from "node:fs";\n${code}`);
    expect(await loadCodes(root)).toContain("RECIPE_IMPORT_FORBIDDEN");
    await writeFile(index, `${code}\nconst stamp = Date.now();\n`);
    expect(await loadCodes(root)).toContain("RECIPE_CODE_FORBIDDEN");

    const linked = await makeRecipeProject();
    const crop = join(linked, "recipes", "frame-card", "crop.ts");
    const elsewhere = join(linked, "crop-elsewhere.ts");
    await cp(crop, elsewhere);
    await rm(crop);
    await symlink(elsewhere, crop);
    expect(await loadCodes(linked)).toContain("RECIPE_FILE_INVALID");
  });

  it("checks params: declared recipe, ready PNG, crop inside the image, no beats", async () => {
    const undeclared = await load(
      await makeRecipeProject(cardParams(), { declare: false }),
    );
    expect(compileCodes(undeclared)).toEqual(["RECIPE_UNKNOWN"]);

    const outside = await load(
      await makeRecipeProject(
        cardParams({
          image: {
            assetId: "photo",
            crop: { x: 150, y: 0, width: 100, height: 100 },
            focusCrop: { x: 0, y: 0, width: 10, height: 10 },
          },
        }),
      ),
    );
    expect(compileCodes(outside)).toEqual(["RECIPE_PARAM_INVALID"]);

    const beats = await load(
      await makeRecipeProject(cardParams(), {
        beats: [
          {
            id: "pop",
            targetId: "card",
            startMs: 0,
            durationMs: 300,
            action: "emphasize",
            params: { scale: 1.1 },
          },
        ],
      }),
    );
    expect(compileCodes(beats)).toContain("RECIPE_PARAM_INVALID");
  });

  it("reports malformed crops as parameter errors instead of crashing", async () => {
    const withCrop = (crop: unknown) =>
      cardParams({
        image: {
          assetId: "photo",
          crop,
          focusCrop: { x: 0, y: 0, width: 10, height: 10 },
        },
      });
    for (const [crop, expected] of [
      [null, ["RECIPE_PARAM_INVALID"]],
      [[0, 0, 10, 10], ["RECIPE_PARAM_INVALID"]],
      ["0,0,10,10", ["RECIPE_PARAM_INVALID"]],
      [42, ["RECIPE_PARAM_INVALID"]],
      [{ x: 0, y: 0, width: 10 }, ["RECIPE_PARAM_INVALID"]],
      [{ x: 0, y: 0, width: "10", height: 10 }, ["RECIPE_PARAM_INVALID"]],
      [{ x: 150, y: 0, width: 100, height: 100 }, ["RECIPE_PARAM_INVALID"]],
      [{ x: 0, y: 0, width: 100, height: 100 }, []],
    ] as const) {
      const source = await load(await makeRecipeProject(withCrop(crop)));
      const result = compileDraft(source);
      const errors = result.issues.filter(
        (issue) => issue.severity === "error",
      );
      expect(
        errors.map((issue) => issue.code),
        JSON.stringify(crop),
      ).toEqual(expected);
      if (expected.length > 0) {
        expect(errors[0]?.path).toBe("/scenes/0/visual/params/image/crop");
      }
    }
  });

  it("keeps every concurrent trust append and refuses to overwrite an unreadable log", async () => {
    const root = await makeRecipeProject();
    const entry = (recipeId: string) => ({
      recipeId,
      codeSha256: "a".repeat(64),
      authorizedBy: "Owner",
      trustedAt: new Date().toISOString(),
    });
    expect((await recordRecipeTrust(root, entry("earlier"))).ok).toBe(true);
    const results = await Promise.all(
      ["probe-a", "probe-b", "probe-c"].map((id) =>
        recordRecipeTrust(root, entry(id)),
      ),
    );
    expect(results.map((result) => result.ok)).toEqual([true, true, true]);
    const ids = (await readRecipeTrust(root)).map((trust) => trust.recipeId);
    expect(ids[0]).toBe("earlier");
    expect([...ids].sort()).toEqual([
      "earlier",
      "probe-a",
      "probe-b",
      "probe-c",
    ]);

    const log = join(root, "revisions", "recipe-trust.json");
    await writeFile(log, "{ not json");
    const refused = await recordRecipeTrust(root, entry("later"));
    expect(refused.ok).toBe(false);
    expect(refused.issues.map((issue) => issue.code)).toEqual([
      "RECIPE_TRUST_LOG_INVALID",
    ]);
    expect(await readFile(log, "utf8")).toBe("{ not json");
  });

  it("runs only code the owner trusted, by exact hash", async () => {
    const root = await makeRecipeProject();
    const draft = compiled(await load(root));
    expect(
      checkRecipeTrust(draft, await readRecipeTrust(root)).map((i) => i.code),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);
    const visual = draft.scenes[0]?.visual;
    if (visual?.type !== "recipe") throw new Error("fixture");
    await recordRecipeTrust(root, {
      recipeId: "frame-card",
      codeSha256: visual.codeSha256,
      authorizedBy: "Owner",
      trustedAt: new Date().toISOString(),
    });
    expect(checkRecipeTrust(draft, await readRecipeTrust(root))).toEqual([]);

    const index = join(root, "recipes", "frame-card", "index.tsx");
    await writeFile(index, `${await readFile(index, "utf8")}\n// edited\n`);
    const changed = compiled(await load(root));
    expect(
      checkRecipeTrust(changed, await readRecipeTrust(root)).map((i) => i.code),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);
  });

  it("snapshots recipe code so undo restores the exact files", async () => {
    const root = await makeRecipeProject();
    const synced = await syncWorkingCopy(root);
    if (!synced.ok) throw new Error("baseline");
    const index = join(root, "recipes", "frame-card", "index.tsx");
    const original = await readFile(index, "utf8");
    const staging = await mkdtemp(join(tmpdir(), "naraframe-recipe-edit-"));
    roots.push(staging);
    await mkdir(join(staging, "recipes", "frame-card"), { recursive: true });
    await writeFile(
      join(staging, "recipes", "frame-card", "index.tsx"),
      `${original}\n// revised\n`,
    );
    const edited = await editProject({
      root,
      from: staging,
      expect: synced.value.revisionId,
      summary: "Revise recipe code",
    });
    expect(edited.ok).toBe(true);
    expect(await readFile(index, "utf8")).not.toBe(original);
    const undone = await undoProject({ root });
    expect(undone.ok && undone.value.revisionId).toBe(synced.value.revisionId);
    expect(await readFile(index, "utf8")).toBe(original);
  });
});
