import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type CompiledDraft,
  checkProductionReadiness,
  checkRecipeTrust,
  compileDraft,
  loadPlanProject,
  RecipeManifestSchema,
  resolveTextSlotStyle,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { cardParams, makeRecipeProject } from "./recipe-fixture.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const TITLE_SLOT = {
  id: "title",
  param: "/title",
  role: "display",
  fontSize: 104,
  lineHeight: 112,
  letterSpacing: -2,
  box: { width: 888, height: 118 },
  maxLines: 1,
  wrap: "words",
};
const POINT_SLOT = {
  id: "point",
  param: "/points",
  role: "body",
  fontSize: 44,
  lineHeight: 52,
  box: { width: 770, height: 52 },
  maxLines: 1,
  wrap: "none",
};

/** The frame-card fixture with text slots declared in its recipe.json. */
const project = async (
  params: Record<string, unknown>,
  textSlots: unknown[] | null = [TITLE_SLOT, POINT_SLOT],
): Promise<string> => {
  const root = await makeRecipeProject(cardParams(params), {
    track: (path) => roots.push(path),
  });
  const manifestPath = join(root, "recipes", "frame-card", "recipe.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (textSlots) manifest.textSlots = textSlots;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return root;
};

const compile = async (root: string) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(loaded.issues.map((i) => i.code).join());
  const final = compileDraft(
    loaded.value.source,
    { type: "project" },
    { mode: "final" },
  );
  if (!final.ok) throw new Error(final.issues.map((i) => i.code).join());
  const visual = final.value.scenes[0]?.visual;
  if (visual?.type !== "recipe") throw new Error("fixture");
  const slotIssues = (severity?: string) =>
    final.issues
      .filter(
        (issue) =>
          issue.code.startsWith("RECIPE_TEXT") &&
          (!severity || issue.severity === severity),
      )
      .map((issue) => `${issue.code}:${issue.severity}:${issue.path}`)
      .sort();
  return {
    source: loaded.value.source,
    draft: final.value,
    visual,
    issues: final.issues,
    slotIssues,
    productionErrors: checkProductionReadiness(
      loaded.value.source,
      final.value,
      final.issues,
      { finalExport: true },
    )
      .filter(
        (issue) =>
          issue.severity === "error" && issue.code.startsWith("RECIPE_TEXT"),
      )
      .map((issue) => `${issue.code}:${issue.path}`)
      .sort(),
  };
};

const manifest = (textSlots: unknown[]) =>
  RecipeManifestSchema.safeParse({
    schemaVersion: 1,
    id: "frame-card",
    version: "1.0.0",
    entry: "index.tsx",
    files: ["index.tsx"],
    textSlots,
  });

describe("recipe text slot declarations", () => {
  it("accepts pixel line height and zero or negative letter spacing", () => {
    expect(manifest([TITLE_SLOT]).success).toBe(true);
    expect(manifest([{ ...TITLE_SLOT, letterSpacing: 0 }]).success).toBe(true);
    expect(manifest([{ ...TITLE_SLOT, letterSpacing: -12.5 }]).success).toBe(
      true,
    );
  });

  it("refuses ambiguous, open-ended or non-finite declarations", () => {
    const refused: unknown[][] = [
      [TITLE_SLOT, { ...POINT_SLOT, id: "title" }],
      [TITLE_SLOT, { ...POINT_SLOT, param: "/title" }],
      [TITLE_SLOT, { ...POINT_SLOT, id: "nested", param: "/title/0" }],
      [{ ...TITLE_SLOT, param: "/title/*" }],
      [{ ...TITLE_SLOT, param: "title" }],
      [{ ...TITLE_SLOT, role: "caption" }],
      [{ ...TITLE_SLOT, lineHeight: 0 }],
      [{ ...TITLE_SLOT, lineHeight: Number.POSITIVE_INFINITY }],
      [{ ...TITLE_SLOT, letterSpacing: Number.NaN }],
      [{ ...TITLE_SLOT, maxLines: 1.5 }],
      [{ ...TITLE_SLOT, wrap: "auto" }],
      [{ ...TITLE_SLOT, box: { width: 0, height: 118 } }],
      [{ ...TITLE_SLOT, shrink: true }],
    ];
    for (const slots of refused) {
      expect(manifest(slots).success, JSON.stringify(slots)).toBe(false);
    }
  });

  it("resolves weight slot → role → profile, and the family like text layers", () => {
    const render = {
      palette: {
        background: "#000000",
        surface: "#111111",
        text: "#FFFFFF",
        accent: "#FF0000",
      },
      typography: {
        fontFamily: "Body Face",
        displayFontFamily: "Display Face",
        headingWeight: 800,
        bodyWeight: 400,
      },
      safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
      spacingUnit: 8,
      motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.06 },
    } as Parameters<typeof resolveTextSlotStyle>[0];
    const slot = (overrides: Record<string, unknown>) =>
      RecipeManifestSchema.parse({
        schemaVersion: 1,
        id: "frame-card",
        version: "1.0.0",
        entry: "index.tsx",
        files: ["index.tsx"],
        textSlots: [{ ...TITLE_SLOT, ...overrides }],
      }).textSlots?.[0];
    const style = (
      overrides: Record<string, unknown>,
      tokens: typeof render = render,
    ) => {
      const declared = slot(overrides);
      if (!declared) throw new Error("fixture");
      return resolveTextSlotStyle(tokens, declared);
    };
    // No roles: display uses the display family and the heading weight.
    expect(style({})).toMatchObject({
      fontFamily: "Display Face",
      fontWeight: 800,
      lineHeight: 112,
      letterSpacing: -2,
      width: 888,
      height: 118,
      wrap: "words",
    });
    expect(style({ role: "heading" }).fontFamily).toBe("Body Face");
    expect(style({ role: "label" }).fontWeight).toBe(400);
    expect(style({ letterSpacing: undefined }).letterSpacing).toBe(0);
    // Roles override the profile; the slot's own weight overrides both.
    const roleToken = {
      fontSize: 40,
      fontWeight: 500,
      lineHeight: 1.1,
      letterSpacing: 0,
    };
    const withRoles = {
      ...render,
      typography: {
        ...render.typography,
        roles: {
          display: {
            ...roleToken,
            fontFamily: "Role Display",
            fontWeight: 600,
          },
          heading: roleToken,
          body: roleToken,
          label: roleToken,
        },
      },
    };
    expect(style({}, withRoles)).toMatchObject({
      fontFamily: "Role Display",
      fontWeight: 600,
    });
    expect(style({ fontWeight: 900 }, withRoles).fontWeight).toBe(900);
    expect(style({ role: "body" }, withRoles)).toMatchObject({
      fontFamily: "Body Face",
      fontWeight: 500,
    });
  });
});

describe("recipe text slots in compile and validate", () => {
  it("compiles one instance per string and per array element", async () => {
    const result = await compile(
      await project({ title: "Short", points: ["One", "Two words"] }),
    );
    expect(
      result.visual.textSlots?.map((slot) => [
        slot.id,
        slot.style.fontFamily,
        slot.instances,
      ]),
    ).toEqual([
      [
        "title",
        "Arial, Helvetica, sans-serif",
        [{ pointer: "/title", text: "Short" }],
      ],
      [
        "point",
        "Arial, Helvetica, sans-serif",
        [
          { pointer: "/points/0", text: "One" },
          { pointer: "/points/1", text: "Two words" },
        ],
      ],
    ]);
    expect(result.slotIssues()).toEqual([
      "RECIPE_TEXT_FIT_COVERAGE:info:/scenes/0/visual/params",
    ]);
    // The rules version is part of slot recipes' keys only.
    expect(result.visual.textFitRules).toBe("naraframe-text-fit/2");
    const coverage = result.issues.find(
      (issue) => issue.code === "RECIPE_TEXT_FIT_COVERAGE",
    );
    expect(coverage?.message).toContain("title (1), point (2)");
    expect(coverage?.message).toContain("not their combined height");
    expect(coverage?.message).toContain("cannot verify");
    expect(result.productionErrors).toEqual([]);
  });

  it("reports missing and non-text values where they are, without crashing", async () => {
    const result = await compile(
      await project({
        title: undefined,
        points: ["One", 42, { text: "nested" }],
      }),
    );
    // title: undefined drops the fixture title from the JSON: /title is missing.
    expect(result.slotIssues("warning")).toEqual([
      "RECIPE_TEXT_SLOT_PATH_MISSING:warning:/scenes/0/visual/params/title",
      "RECIPE_TEXT_SLOT_TYPE_INVALID:warning:/scenes/0/visual/params/points/1",
      "RECIPE_TEXT_SLOT_TYPE_INVALID:warning:/scenes/0/visual/params/points/2",
    ]);
    // The valid element is still measured.
    expect(result.visual.textSlots?.[1]?.instances).toEqual([
      { pointer: "/points/0", text: "One" },
    ]);
    expect(result.productionErrors).toEqual([
      "RECIPE_TEXT_SLOT_PATH_MISSING:/scenes/0/visual/params/title",
      "RECIPE_TEXT_SLOT_TYPE_INVALID:/scenes/0/visual/params/points/1",
      "RECIPE_TEXT_SLOT_TYPE_INVALID:/scenes/0/visual/params/points/2",
    ]);

    const object = await compile(await project({ title: { text: "x" } }));
    expect(object.slotIssues("warning")).toContain(
      "RECIPE_TEXT_SLOT_TYPE_INVALID:warning:/scenes/0/visual/params/title",
    );
  });

  it("keeps a recipe without slots compiling as before and says fit is unchecked", async () => {
    const root = await project({ title: "Card" }, null);
    const result = await compile(root);
    expect("textSlots" in result.visual).toBe(false);
    expect("textFitRules" in result.visual).toBe(false);
    expect(
      result.source.recipes?.every((recipe) => !("textSlots" in recipe)),
    ).toBe(true);
    const coverage = result.issues.find(
      (issue) => issue.code === "RECIPE_TEXT_FIT_COVERAGE",
    );
    expect(coverage?.severity).toBe("info");
    expect(coverage?.message).toContain("declares no text slots");
    expect(result.productionErrors).toEqual([]);
  });

  it("changes keys for copy edits, and the trusted hash for slot changes", async () => {
    const root = await project({ title: "Short", points: ["One"] });
    const first = await compile(root);
    const trusted = [
      {
        recipeId: "frame-card",
        codeSha256: first.visual.codeSha256,
        authorizedBy: "Owner",
        trustedAt: "2026-10-06T00:00:00.000Z",
      },
    ];
    expect(checkRecipeTrust(first.draft, trusted)).toEqual([]);

    // A copy edit: same code, new texts, so new keys for the scene.
    const scenesPath = join(root, "scenes.json");
    const scenes = JSON.parse(await readFile(scenesPath, "utf8"));
    scenes.scenes[0].visual.params.title = "A longer title";
    await writeFile(scenesPath, JSON.stringify(scenes));
    const edited = await compile(root);
    expect(edited.visual.codeSha256).toBe(first.visual.codeSha256);
    expect(edited.draft.assemblyKey).not.toBe(first.draft.assemblyKey);

    // A slot change is a code change: trust no longer covers it.
    const manifestPath = join(root, "recipes", "frame-card", "recipe.json");
    const recipe = JSON.parse(await readFile(manifestPath, "utf8"));
    recipe.textSlots[0].box.width = 600;
    await writeFile(manifestPath, JSON.stringify(recipe));
    const changed = await compile(root);
    expect(changed.visual.codeSha256).not.toBe(first.visual.codeSha256);
    expect(
      checkRecipeTrust(changed.draft as CompiledDraft, trusted).map(
        (issue) => issue.code,
      ),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);
    // Removing the slots is a code change too.
    delete recipe.textSlots;
    await writeFile(manifestPath, JSON.stringify(recipe));
    expect(
      checkRecipeTrust((await compile(root)).draft, trusted).map(
        (issue) => issue.code,
      ),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);
  });
});
