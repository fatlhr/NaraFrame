import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyProfile,
  brandSummary,
  checkProductionReadiness,
  checkRecipeTrust,
  compileDraft,
  createProject,
  editProject,
  loadPlanProject,
  planProfileApply,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { cardParams, png, sha } from "./recipe-fixture.js";

const fixtureRecipe = fileURLToPath(
  new URL("../../../../test-fixtures/recipes/frame-card", import.meta.url),
);

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const tmp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-recipe-bindings-"));
  dirs.push(dir);
  return dir;
};

const writeProfile = async (
  id: string,
  options: {
    brand: Record<string, unknown>;
    accent: string;
    overridable?: string[];
  },
): Promise<string> => {
  const dir = await tmp();
  await mkdir(join(dir, "assets"), { recursive: true });
  await writeFile(join(dir, "assets", "logo.png"), png(64, 64));
  await writeFile(
    join(dir, "profile.json"),
    JSON.stringify({
      schemaVersion: 1,
      id,
      version: "1.0.0",
      render: {
        palette: {
          background: "#111111",
          surface: "#EEEEEE",
          text: "#FFFFFF",
          accent: options.accent,
        },
        typography: {
          fontFamily: "Arial, sans-serif",
          headingWeight: 800,
          bodyWeight: 500,
        },
        safeZone: { top: 80, right: 44, bottom: 100, left: 44 },
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.06,
        },
      },
      production: {
        voiceStyleSignature: "voice-v1",
        illustrationStyleSignature: "illustration-v1",
        timing: { wordLevelRequired: false },
        assetPolicy: { allowPlannedInDraft: true },
      },
      duration: { preferredMinMs: 500, preferredMaxMs: 30_000 },
      brand: options.brand,
      lockedPaths: ["format.design", "format.draft"],
      overridablePaths: options.overridable ?? ["render.palette"],
      assets: [
        {
          id: `${id}-logo`,
          kind: "png",
          path: "assets/logo.png",
          role: "logo",
        },
      ],
    }),
  );
  await writeFile(join(dir, "direction.md"), `Direction for ${id}.`);
  return dir;
};

const brandA = {
  name: "Brand A",
  cta: { label: "Call Brand A", url: "brand-a.example" },
};
const brandB = {
  name: "Brand B",
  cta: { label: "Start with Brand B", url: "brand-b.example" },
};

const BINDINGS = [
  { param: "/brand/name", field: "brand.name" },
  { param: "/brand/cta/label", field: "brand.cta.label" },
  { param: "/brand/cta/url", field: "brand.cta.url" },
  { param: "/colors/rule", field: "render.palette.accent" },
];

const identity = (brand: typeof brandA, rule: unknown) => ({
  brand: { name: brand.name, cta: { ...brand.cta } },
  colors: { rule },
});

const profileSource = { kind: "local" as const, identity: "test" };

/** A brand-managed project with one recipe scene that carries identity params. */
const makeProject = async (
  profileDirectory: string,
  options: {
    params?: Record<string, unknown>;
    bindings?: unknown[] | null;
    overrides?: Record<string, unknown>;
  } = {},
): Promise<string> => {
  const root = join(await tmp(), "project");
  const created = await createProject({
    destination: root,
    projectId: "project",
    title: "Project",
    profileDirectory,
    profileSource,
  });
  if (!created.ok) throw new Error(created.issues.map((i) => i.code).join());
  const recipeDir = join(root, "recipes", "frame-card");
  await cp(fixtureRecipe, recipeDir, { recursive: true });
  const manifest = JSON.parse(
    await readFile(join(recipeDir, "recipe.json"), "utf8"),
  );
  if (options.bindings !== null) {
    manifest.bindings = options.bindings ?? BINDINGS;
  }
  await writeFile(
    join(recipeDir, "recipe.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const photo = png(200, 300);
  await writeFile(join(root, "assets", "photo.png"), photo);
  await writeFile(
    join(root, "assets", "manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      assets: [
        {
          id: "photo",
          status: "ready",
          kind: "png",
          path: "assets/photo.png",
          sha256: sha(photo),
          binding: "neutral",
          origin: { type: "generated" },
        },
      ],
    }),
  );
  const config = JSON.parse(
    await readFile(join(root, "naraframe.json"), "utf8"),
  );
  await writeFile(
    join(root, "naraframe.json"),
    JSON.stringify({
      ...config,
      audioMode: "silent",
      recipes: [{ id: "frame-card", path: "recipes/frame-card" }],
      ...(options.overrides ? { overrides: options.overrides } : {}),
    }),
  );
  await writeFile(
    join(root, "scenes.json"),
    JSON.stringify(scenes(options.params ?? identity(brandA, "#FF5500"))),
  );
  return root;
};

const scenes = (identityParams: Record<string, unknown>) => ({
  schemaVersion: 1,
  scenes: [
    {
      id: "card",
      narrativeRole: "cta",
      durationMs: 1000,
      carriesFactualClaim: false,
      visual: {
        type: "recipe",
        recipe: "frame-card",
        params: cardParams(identityParams),
      },
      beats: [],
      transition: { type: "cut" },
    },
  ],
});

const RECIPE_CODES = [
  "RECIPE_BINDING_MISMATCH",
  "RECIPE_BINDING_PATH_MISSING",
  "RECIPE_BINDING_TYPE_INVALID",
  "BRAND_FIELD_MISSING",
  "RECIPE_BINDING_COVERAGE",
];

/** Binding issues of a draft compile and errors of a final export check. */
const check = async (root: string) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(loaded.issues.map((i) => i.code).join());
  const final = compileDraft(
    loaded.value.source,
    { type: "project" },
    { mode: "final" },
  );
  if (!final.ok) throw new Error(final.issues.map((i) => i.code).join());
  const recipeIssues = final.issues.filter((issue) =>
    RECIPE_CODES.includes(issue.code),
  );
  return {
    source: loaded.value.source,
    draft: final.value,
    draftIssues: recipeIssues.map((issue) => ({
      code: issue.code,
      severity: issue.severity,
      path: issue.path,
    })),
    coverage: recipeIssues.find(
      (issue) => issue.code === "RECIPE_BINDING_COVERAGE",
    ),
    finalErrors: checkProductionReadiness(
      loaded.value.source,
      final.value,
      final.issues,
      { finalExport: true },
    )
      .filter(
        (issue) =>
          issue.severity === "error" && RECIPE_CODES.includes(issue.code),
      )
      .map((issue) => `${issue.code}:${issue.path}`)
      .sort(),
  };
};

const at = (param: string) => `/scenes/0/visual/params${param}`;

/** The current revision id, or null before the first one is captured. */
const currentRevision = async (root: string): Promise<string | null> =>
  readFile(join(root, "revisions", "current.json"), "utf8").then(
    (text) => JSON.parse(text).revisionId as string,
    () => null,
  );

describe("recipe identity bindings", () => {
  it("accepts identity params that match the pinned profile and reports coverage", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const result = await check(await makeProject(a));
    expect(result.draftIssues).toEqual([
      {
        code: "RECIPE_BINDING_COVERAGE",
        severity: "info",
        path: "/scenes/0/visual/params",
      },
    ]);
    expect(result.coverage?.message).toContain(
      "4 identity param(s) are compared with profile brand-a",
    );
    // The title is copy the recipe draws but does not declare as identity.
    expect(result.coverage?.message).toContain("/title");
    expect(result.finalErrors).toEqual([]);
  });

  it("warns in a draft and blocks a final export on a mismatched identity param", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const root = await makeProject(a, {
      params: identity({ ...brandA, name: "Brand B" }, "#FF5500"),
    });
    const result = await check(root);
    expect(result.draftIssues).toContainEqual({
      code: "RECIPE_BINDING_MISMATCH",
      severity: "warning",
      path: at("/brand/name"),
    });
    expect(result.finalErrors).toEqual([
      `RECIPE_BINDING_MISMATCH:${at("/brand/name")}`,
    ]);
  });

  it("reports a missing path, a non-text value and a field the profile lacks", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const root = await makeProject(a, {
      params: {
        brand: { name: "Brand A", cta: { label: "Call Brand A" } },
        colors: { rule: 42 },
      },
      bindings: [
        { param: "/brand/name", field: "brand.name" },
        { param: "/brand/cta/url", field: "brand.cta.url" },
        { param: "/colors/rule", field: "render.palette.accent" },
        { param: "/headline/0", field: "brand.name" },
      ],
    });
    const result = await check(root);
    expect(result.draftIssues.map((issue) => issue.severity)).not.toContain(
      "error",
    );
    expect(result.finalErrors).toEqual([
      `RECIPE_BINDING_PATH_MISSING:${at("/brand/cta/url")}`,
      `RECIPE_BINDING_PATH_MISSING:${at("/headline/0")}`,
      `RECIPE_BINDING_TYPE_INVALID:${at("/colors/rule")}`,
    ]);

    const nameOnly = await writeProfile("brand-a", {
      brand: { name: "Brand A" },
      accent: "#FF5500",
    });
    expect((await check(await makeProject(nameOnly))).finalErrors).toEqual([
      `BRAND_FIELD_MISSING:${at("/brand/cta/label")}`,
      `BRAND_FIELD_MISSING:${at("/brand/cta/url")}`,
    ]);
  });

  it("compares palette params with the palette after project overrides, ignoring hex case", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const overridden = await makeProject(a, {
      params: identity(brandA, "#abcdef"),
      overrides: { "render.palette.accent": "#ABCDEF" },
    });
    expect((await check(overridden)).finalErrors).toEqual([]);

    const stale = await makeProject(a, {
      params: identity(brandA, "#FF5500"),
      overrides: { "render.palette.accent": "#ABCDEF" },
    });
    expect((await check(stale)).finalErrors).toEqual([
      `RECIPE_BINDING_MISMATCH:${at("/colors/rule")}`,
    ]);
  });

  it("escapes object keys in uncovered params so a literal key never passes as a bound path", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const withKeys = (name: string) => ({
      brand: {
        name,
        cta: { ...brandA.cta },
        // A key that looks like the bound nested path /brand/cta/url.
        "cta/url": "brand-b.example",
      },
      colors: { rule: "#FF5500" },
      // A key that looks like the bound nested path /brand/name.
      "brand/name": "Brand B",
      "a~b": "tilde key",
      "x~1y": "escaped-looking key",
      points: ["first point", "second point"],
    });
    const root = await makeProject(a, { params: withKeys("Brand A") });
    const result = await check(root);
    const unchecked = brandSummary(result.source).recipes[0]?.unchecked ?? [];
    expect(unchecked).toEqual(
      expect.arrayContaining([
        "/brand~1name",
        "/brand/cta~1url",
        "/a~0b",
        "/x~01y",
        "/points/0",
        "/points/1",
      ]),
    );
    // The real nested bound paths stay bound, not reported as uncovered.
    for (const bound of [
      "/brand/name",
      "/brand/cta/label",
      "/brand/cta/url",
      "/colors/rule",
    ]) {
      expect(unchecked).not.toContain(bound);
    }
    expect(result.coverage?.message).toContain("/brand~1name");
    // Literal keys change coverage only: the binding checks are unchanged.
    expect(result.finalErrors).toEqual([]);
    expect(
      (await check(await makeProject(a, { params: withKeys("Brand B") })))
        .finalErrors,
    ).toEqual([`RECIPE_BINDING_MISMATCH:${at("/brand/name")}`]);
  });

  it("refuses ambiguous or open-ended declarations as an invalid manifest", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const cases: Array<[unknown[], string]> = [
      [
        [
          { param: "/brand/name", field: "brand.name" },
          { param: "/brand/name", field: "brand.cta.label" },
        ],
        "bound more than once",
      ],
      [
        [
          { param: "/brand", field: "brand.name" },
          { param: "/brand/name", field: "brand.name" },
        ],
        "lies inside /brand",
      ],
      [[{ param: "/brand/*", field: "brand.name" }], "JSON pointer"],
      [[{ param: "brand.name", field: "brand.name" }], "JSON pointer"],
      [[{ param: "/brand/name", field: "brand.audience" }], "field"],
      [[{ param: "/brand/name", field: "brand.name", match: "Brand" }], ""],
    ];
    for (const [bindings, text] of cases) {
      const loaded = await loadPlanProject(await makeProject(a, { bindings }));
      expect(loaded.ok).toBe(false);
      if (loaded.ok) continue;
      expect(loaded.issues.map((issue) => issue.code)).toEqual([
        "RECIPE_MANIFEST_INVALID",
      ]);
      expect(loaded.issues[0]?.message).toContain(text);
    }
  });

  it("keeps a recipe without bindings working and reports it as uncovered", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const root = await makeProject(a, {
      params: identity(brandB, "#000000"),
      bindings: null,
    });
    const result = await check(root);
    // Nothing is compared, so another brand's name in params is not caught:
    // the coverage report is what says so.
    expect(result.finalErrors).toEqual([]);
    expect(result.coverage?.severity).toBe("info");
    expect(result.coverage?.message).toContain("0 identity param(s)");
    expect(result.coverage?.message).toContain("/brand/name");
    expect(
      result.source.recipes?.every((recipe) => !("bindings" in recipe)),
    ).toBe(true);
  });

  it("lists every bound param in a switch dry-run without touching the project", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const b = await writeProfile("brand-b", {
      brand: brandB,
      accent: "#00AA55",
    });
    const root = await makeProject(a, {
      params: identity(brandA, "#123456"),
      overrides: { "render.palette.accent": "#123456" },
    });
    const files = [
      "naraframe.json",
      "profile.lock.json",
      "scenes.json",
      "recipes/frame-card/recipe.json",
    ];
    const before = await Promise.all(
      files.map((file) => readFile(join(root, file), "utf8")),
    );
    const revision = await currentRevision(root);
    const plan = await planProfileApply({
      root,
      profileDirectory: b,
      profileSource,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.bindings?.recipeParams).toEqual([
      {
        sceneId: "card",
        recipe: "frame-card",
        param: "/brand/name",
        field: "brand.name",
        current: "Brand A",
        target: "Brand B",
        state: "changes",
      },
      {
        sceneId: "card",
        recipe: "frame-card",
        param: "/brand/cta/label",
        field: "brand.cta.label",
        current: "Call Brand A",
        target: "Start with Brand B",
        state: "changes",
      },
      {
        sceneId: "card",
        recipe: "frame-card",
        param: "/brand/cta/url",
        field: "brand.cta.url",
        current: "brand-a.example",
        target: "brand-b.example",
        state: "changes",
      },
      // The project's accent override survives the switch, so the target
      // value is the override, not brand B's own accent.
      {
        sceneId: "card",
        recipe: "frame-card",
        param: "/colors/rule",
        field: "render.palette.accent",
        current: "#123456",
        target: "#123456",
        state: "unchanged",
      },
    ]);
    expect(plan.value.bindings?.recipeCoverage).toEqual([
      {
        sceneId: "card",
        recipe: "frame-card",
        declared: 4,
        unchecked: ["/title"],
      },
    ]);
    expect(plan.value.effects).toContain("editorial-review");
    expect(
      await Promise.all(
        files.map((file) => readFile(join(root, file), "utf8")),
      ),
    ).toEqual(before);
    expect(await currentRevision(root)).toBe(revision);
  });

  it("ties the declaration to the trusted code hash", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const root = await makeProject(a);
    const first = await check(root);
    const scene = first.draft.scenes[0]?.visual;
    if (scene?.type !== "recipe") throw new Error("fixture");
    const trusted = [
      {
        recipeId: "frame-card",
        codeSha256: scene.codeSha256,
        authorizedBy: "Owner",
        trustedAt: "2026-10-06T00:00:00.000Z",
      },
    ];
    expect(checkRecipeTrust(first.draft, trusted)).toEqual([]);

    // Dropping the declaration is a code change: the old trust no longer
    // covers it, so it cannot be used to skip the identity check silently.
    const manifestPath = join(root, "recipes", "frame-card", "recipe.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    delete manifest.bindings;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const removed = await check(root);
    const removedScene = removed.draft.scenes[0]?.visual;
    expect(removedScene?.type === "recipe" && removedScene.codeSha256).not.toBe(
      scene.codeSha256,
    );
    expect(
      checkRecipeTrust(removed.draft, trusted).map((issue) => issue.code),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);

    manifest.bindings = BINDINGS.slice(0, 2);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    expect(
      checkRecipeTrust((await check(root)).draft, trusted).map(
        (issue) => issue.code,
      ),
    ).toEqual(["RECIPE_NOT_TRUSTED"]);
  });

  it("blocks after a switch, clears after an identity edit and undoes both", async () => {
    const a = await writeProfile("brand-a", {
      brand: brandA,
      accent: "#FF5500",
    });
    const b = await writeProfile("brand-b", {
      brand: brandB,
      accent: "#00AA55",
      overridable: [],
    });
    const root = await makeProject(a);
    const recipeBefore = await readFile(
      join(root, "recipes", "frame-card", "recipe.json"),
      "utf8",
    );
    const scenesBefore = await readFile(join(root, "scenes.json"), "utf8");
    expect((await check(root)).finalErrors).toEqual([]);

    const applied = await applyProfile({
      root,
      profileDirectory: b,
      profileSource,
    });
    expect(applied.ok).toBe(true);
    expect((await check(root)).finalErrors).toEqual([
      `RECIPE_BINDING_MISMATCH:${at("/brand/cta/label")}`,
      `RECIPE_BINDING_MISMATCH:${at("/brand/cta/url")}`,
      `RECIPE_BINDING_MISMATCH:${at("/brand/name")}`,
      `RECIPE_BINDING_MISMATCH:${at("/colors/rule")}`,
    ]);

    const staging = join(await tmp(), "staging");
    await mkdir(staging, { recursive: true });
    await writeFile(
      join(staging, "scenes.json"),
      JSON.stringify(scenes(identity(brandB, "#00aa55"))),
    );
    const edited = await editProject({
      root,
      from: staging,
      expect: (await currentRevision(root)) ?? "",
      summary: "Identity params for brand B",
    });
    expect(edited.ok).toBe(true);
    const afterEdit = await check(root);
    expect(afterEdit.finalErrors).toEqual([]);
    expect(afterEdit.source.profile.id).toBe("brand-b");

    expect((await undoProject({ root })).ok).toBe(true);
    const undoneEdit = await check(root);
    expect(undoneEdit.source.profile.id).toBe("brand-b");
    expect(undoneEdit.finalErrors).toHaveLength(4);

    expect((await undoProject({ root })).ok).toBe(true);
    const undoneSwitch = await check(root);
    expect(undoneSwitch.source.profile.id).toBe("brand-a");
    expect(undoneSwitch.finalErrors).toEqual([]);
    expect(await readFile(join(root, "scenes.json"), "utf8")).toBe(
      scenesBefore,
    );
    expect(
      await readFile(
        join(root, "recipes", "frame-card", "recipe.json"),
        "utf8",
      ),
    ).toBe(recipeBefore);
    expect(undoneSwitch.source.recipes?.[0]?.bindings).toEqual(BINDINGS);
  });
});
