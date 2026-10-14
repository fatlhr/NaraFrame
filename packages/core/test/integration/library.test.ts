import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  capabilityRegistry,
  checkRecipeTrust,
  compileDraft,
  computeSceneRenderKeys,
  createProject,
  editProject,
  inspectLibrary,
  type LibraryCatalog,
  LibraryCatalogSchema,
  loadPlanProject,
  readApprovals,
  readRecipeTrust,
  recordApproval,
  type StageLibraryOptions,
  stageLibrary,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { hashValue } from "../../src/project/hash.js";

const dirs: string[] = [];
const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("Required fixture value missing");
  return value;
};
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const temporary = async () => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-library-test-"));
  dirs.push(dir);
  return dir;
};
const json = async (root: string, path: string) =>
  JSON.parse(await readFile(join(root, path), "utf8"));
const write = async (root: string, path: string, value: unknown) => {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), JSON.stringify(value, null, 2));
};
const values = { title: "One clear idea", pose: "pose-left", "crop-x": 60 };
const setup = async () => {
  const parent = await temporary(),
    root = join(parent, "project"),
    catalogRoot = join(parent, "catalog");
  await cp(resolve("library/starter"), catalogRoot, { recursive: true });
  const created = await createProject({
    destination: root,
    projectId: "episode",
    title: "Episode",
    profileDirectory: resolve("profiles/current-issues"),
    profileSource: { kind: "repository", identity: "profiles/current-issues" },
  });
  expect(created.ok, JSON.stringify(created.issues)).toBe(true);
  return { root, catalogRoot, from: join(catalogRoot, "catalog.json") };
};
const stage = async (options: StageLibraryOptions) => {
  const result = await stageLibrary(options);
  if (result.ok) dirs.push(result.value.staging);
  return result;
};
const imported = async () => {
  const fixture = await setup();
  const staged = await stage({
    ...fixture,
    pattern: "anchored-note",
    version: "1.0.0",
    instance: "lesson",
    scene: "asset-swap",
    params: values,
  });
  expect(staged.ok, JSON.stringify(staged.issues)).toBe(true);
  if (!staged.ok) throw new Error("stage");
  const edited = await editProject({
    root: fixture.root,
    from: staged.value.staging,
    expect: staged.value.sourceRevision,
    summary: "Import library",
  });
  expect(edited.ok, JSON.stringify(edited.issues)).toBe(true);
  if (!edited.ok) throw new Error("edit");
  return {
    ...fixture,
    revision: edited.value.revisionId,
    receipt: staged.value.receipt,
  };
};
const compiled = async (root: string, resolution: 540 | 1080 = 540) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
  const result = compileDraft(
    loaded.value.source,
    { type: "project" },
    { resolution },
  );
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
};
const catalogChange = async (
  fixture: { catalogRoot: string },
  change: (catalog: LibraryCatalog) => void,
) => {
  const catalog = (await json(
    fixture.catalogRoot,
    "catalog.json",
  )) as LibraryCatalog;
  change(catalog);
  await write(fixture.catalogRoot, "catalog.json", catalog);
};

describe("passive pinned library imports", () => {
  it("advertises only the demonstrated library and PNG geometry forms", () => {
    expect(capabilityRegistry().library).toContain("pinned-import");
    expect(capabilityRegistry().imageLayout).toEqual([
      "png-source-pixel-metadata",
      "png-source-pixel-crop",
    ]);
  });
  it("leaves an approval scoped to its prior revision and brings it back through undo", async () => {
    const fixture = await imported(),
      before = await compiled(fixture.root);
    await recordApproval(fixture.root, {
      sourceRevision: before.sourceRevision,
      assemblyKey: before.assemblyKey,
      scope: { type: "project" },
      previewBuildId: "test-fixture-reviewed-preview",
      autonomy: null,
      approvedAt: "2026-10-14T00:00:00.000Z",
    });
    const staged = await stage({
      root: fixture.root,
      instance: "lesson",
      params: { ...values, title: "New copy" },
    });
    if (!staged.ok) throw new Error(JSON.stringify(staged.issues));
    await editProject({
      root: fixture.root,
      from: staged.value.staging,
      expect: staged.value.sourceRevision,
      summary: "new copy",
    });
    const after = await compiled(fixture.root);
    expect(await readApprovals(fixture.root, after.sourceRevision)).toEqual([]);
    expect(
      await readApprovals(fixture.root, before.sourceRevision),
    ).toHaveLength(1);
    await undoProject({ root: fixture.root });
    expect(
      await readApprovals(
        fixture.root,
        (await compiled(fixture.root)).sourceRevision,
      ),
    ).toHaveLength(1);
  });
  it("captures bytes without touching source; later catalog edits cannot change the staged import", async () => {
    const fixture = await setup(),
      before = await readFile(join(fixture.root, "naraframe.json"));
    const result = await stage({
      ...fixture,
      pattern: "anchored-note",
      version: "1.0.0",
      instance: "lesson",
      scene: "asset-swap",
      params: values,
    });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    expect(await readFile(join(fixture.root, "naraframe.json"))).toEqual(
      before,
    );
    await writeFile(
      join(fixture.catalogRoot, "pose-left.png"),
      "changed after staging",
    );
    const applied = await editProject({
      root: fixture.root,
      from: result.value.staging,
      expect: result.value.sourceRevision,
      summary: "captured bytes",
    });
    expect(applied.ok, JSON.stringify(applied.issues)).toBe(true);
    const asset = result.value.receipt.assets[0];
    if (asset?.status === "ready")
      expect(await readFile(join(fixture.root, asset.path))).toEqual(
        await readFile(resolve("library/starter/pose-left.png")),
      );
    expect(result.value.receipt.assets[0]).toMatchObject({
      binding: "neutral",
      origin: { type: "user", license: "Repository example use" },
    });
  });
  it("pins both pose choices locally; regenerates anchors after the catalog is hidden; undo restores source/key", async () => {
    const fixture = await imported(),
      before = await compiled(fixture.root, 1080);
    await rename(fixture.from, `${fixture.from}.hidden`);
    const result = await stage({
      root: fixture.root,
      instance: "lesson",
      params: { ...values, pose: "pose-right" },
    });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    const scenes = await json(result.value.staging, "scenes.json");
    expect(scenes.scenes[0].visual.layers[1].frame.x).toBe(596);
    expect(result.value.receipt.disposition).toBe("regenerate");
    const edit = await editProject({
      root: fixture.root,
      from: result.value.staging,
      expect: result.value.sourceRevision,
      summary: "pose",
    });
    expect(edit.ok).toBe(true);
    expect((await compiled(fixture.root, 1080)).assemblyKey).not.toBe(
      before.assemblyKey,
    );
    const undo = await undoProject({ root: fixture.root });
    expect(undo.ok).toBe(true);
    expect((await compiled(fixture.root, 1080)).sourceRevision).toBe(
      before.sourceRevision,
    );
    expect((await compiled(fixture.root, 1080)).assemblyKey).toBe(
      before.assemblyKey,
    );
  });
  it("keeps an old project stable when catalog advances and requires explicit update", async () => {
    const fixture = await imported(),
      before = await compiled(fixture.root);
    await catalogChange(fixture, (c) => {
      c.version = "1.1.0";
      required(c.patterns[0]).version = "1.1.0";
      required(c.patterns[0]).description = "Updated source provenance context";
    });
    expect((await compiled(fixture.root)).assemblyKey).toBe(before.assemblyKey);
    expect((await compiled(fixture.root)).sourceRevision).toBe(
      before.sourceRevision,
    );
    const silent = await stage({
      ...fixture,
      pattern: "anchored-note",
      version: "1.1.0",
      instance: "lesson",
      params: values,
    });
    expect(silent.issues.map((i) => i.code)).toContain(
      "LIBRARY_INSTANCE_EXISTS",
    );
    const update = await stage({
      ...fixture,
      pattern: "anchored-note",
      version: "1.1.0",
      instance: "lesson",
      params: values,
      update: true,
    });
    expect(update.ok, JSON.stringify(update.issues)).toBe(true);
    if (!update.ok) return;
    expect(update.value.receipt.disposition).toBe("update");
    expect(update.value.receipt.catalog.sha256).not.toBe(
      fixture.receipt.catalog.sha256,
    );
    await editProject({
      root: fixture.root,
      from: update.value.staging,
      expect: update.value.sourceRevision,
      summary: "catalog update",
    });
    expect((await compiled(fixture.root)).sourceRevision).not.toBe(
      before.sourceRevision,
    );
    await undoProject({ root: fixture.root });
    expect((await compiled(fixture.root)).sourceRevision).toBe(
      before.sourceRevision,
    );
  });
  it("refuses to overwrite ordinary manual edits and preserves them", async () => {
    const fixture = await imported(),
      scenes = await json(fixture.root, "scenes.json");
    scenes.scenes[0].note = "Manual authorship";
    await write(fixture.root, "scenes.json", scenes);
    const result = await stage({
      root: fixture.root,
      instance: "lesson",
      params: values,
    });
    expect(result.issues.map((i) => i.code)).toContain(
      "LIBRARY_LOCAL_EDIT_CONFLICT",
    );
    expect((await json(fixture.root, "scenes.json")).scenes[0].note).toBe(
      "Manual authorship",
    );
  });
  it.each([
    { instance: "Bad_ID", code: "LIBRARY_ID_INVALID" },
    { version: "current", code: "LIBRARY_SELECTION_REQUIRED" },
    { version: "9.0.0", code: "LIBRARY_PATTERN_UNKNOWN" },
    {
      params: { ...values, pose: "missing" },
      code: "LIBRARY_PARAMETER_INVALID",
    },
    {
      params: { ...values, unexpected: "x" },
      code: "LIBRARY_PARAMETER_UNKNOWN",
    },
    { params: { ...values, "crop-x": 121 }, code: "IMAGE_CROP_INVALID" },
  ])(
    "rejects invalid selection/parameters $code",
    async ({ code, ...patch }) => {
      const fixture = await setup();
      const result = await stage({
        ...fixture,
        pattern: "anchored-note",
        version: "1.0.0",
        instance: "lesson",
        scene: "asset-swap",
        params: values,
        ...patch,
      });
      expect(result.ok).toBe(false);
      expect(result.issues.map((i) => i.code)).toContain(code);
    },
  );
  it("reports missing, escaping, symlinked, hash-mismatched and dimension-mismatched dependencies before staging", async () => {
    const fixture = await setup();
    const original = await json(fixture.catalogRoot, "catalog.json");
    for (const [path, code] of [
      ["missing.png", "ASSET_FILE_MISSING"],
      ["../pose-left.png", "SCHEMA_INVALID"],
      ["escape.png", "ASSET_PATH_UNSAFE"],
    ]) {
      if (path === "escape.png")
        await symlink(
          resolve("library/starter/pose-left.png"),
          join(fixture.catalogRoot, path),
        );
      const next = structuredClone(original);
      next.assets[0].path = path;
      await write(fixture.catalogRoot, "catalog.json", next);
      const result = await inspectLibrary(fixture.from);
      expect(result.ok).toBe(false);
      if (code !== "SCHEMA_INVALID")
        expect(result.issues.map((i) => i.code)).toContain(code);
    }
    const wrongHash = structuredClone(original);
    wrongHash.assets[0].sha256 = "a".repeat(64);
    await write(fixture.catalogRoot, "catalog.json", wrongHash);
    expect(
      (await inspectLibrary(fixture.from)).issues.map((i) => i.code),
    ).toContain("LIBRARY_DEPENDENCY_HASH_MISMATCH");
    const wrongSize = structuredClone(original);
    wrongSize.assets[0].layout.width = 321;
    await write(fixture.catalogRoot, "catalog.json", wrongSize);
    expect(
      (await inspectLibrary(fixture.from)).issues.map((i) => i.code),
    ).toContain("PNG_LAYOUT_SIZE_MISMATCH");
  });
  it("rejects pointer overlap, duplicate selection IDs, dependency paths and unsupported attachment graphs", async () => {
    const fixture = await setup(),
      original = await json(fixture.catalogRoot, "catalog.json");
    for (const change of [
      (c: LibraryCatalog) => {
        required(required(c.patterns[0]).parameters.title).pointers.push(
          "/visual/layers/2/text",
        );
      },
      (c: LibraryCatalog) => {
        c.patterns.push(required(c.patterns[0]));
      },
      (c: LibraryCatalog) => {
        const attachments = required(required(c.patterns[0]).attachments);
        attachments.push(required(attachments[0]));
      },
      (c: LibraryCatalog) => {
        required(required(c.patterns[0]).attachments).push({
          targetLayer: "note",
          targetAnchor: "grip",
          propLayer: "object",
          propAnchor: "hand",
        });
      },
    ]) {
      const changed = structuredClone(original);
      change(changed);
      expect(LibraryCatalogSchema.safeParse(changed).success).toBe(false);
    }
    const duplicatePath = structuredClone(original);
    duplicatePath.assets[1] = { ...duplicatePath.assets[0], id: "other" };
    await write(fixture.catalogRoot, "catalog.json", duplicatePath);
    expect(
      (await inspectLibrary(fixture.from)).issues.map((i) => i.code),
    ).toContain("LIBRARY_DEPENDENCY_PATH_CONFLICT");
  });
  it("refuses unsupported attachment relationships and missing/clipped anchors", async () => {
    const fixture = await setup();
    await catalogChange(fixture, (c) => {
      const p = required(c.patterns[0]);
      if (p.template.visual.type === "composition")
        required(p.template.visual.layers[0]).rotationDeg = 15;
    });
    const options = {
      ...fixture,
      pattern: "anchored-note",
      version: "1.0.0",
      instance: "lesson",
      scene: "asset-swap",
      params: values,
    };
    expect((await stage(options)).issues.map((i) => i.code)).toContain(
      "LIBRARY_ATTACHMENT_UNSUPPORTED",
    );
    await catalogChange(fixture, (c) => {
      const p = required(c.patterns[0]);
      if (p.template.visual.type !== "composition")
        throw new Error("Expected composition fixture");
      required(p.template.visual.layers[0]).rotationDeg = 0;
      required(required(p.attachments)[0]).targetAnchor = "missing";
    });
    expect((await stage(options)).issues.map((i) => i.code)).toContain(
      "LIBRARY_ANCHOR_UNKNOWN",
    );
    await catalogChange(fixture, (c) => {
      required(required(required(c.patterns[0]).attachments)[0]).targetAnchor =
        "hand";
      const asset = required(c.assets[0]);
      if (
        asset.status !== "ready" ||
        asset.kind !== "png" ||
        !asset.layout?.anchors
      )
        throw new Error("Expected PNG layout fixture");
      asset.layout.anchors.hand = { x: 40, y: 190 };
    });
    expect((await stage(options)).issues.map((i) => i.code)).toContain(
      "LIBRARY_ANCHOR_CLIPPED",
    );
  });
  it("marks crop slots only and keeps source pixel crop identical at native/half resolutions", async () => {
    const fixture = await imported(),
      native = await compiled(fixture.root, 1080),
      half = await compiled(fixture.root);
    const a = required(required(native.scenes[0]).layers[0]),
      b = required(required(half.scenes[0]).layers[0]);
    expect(a.type).toBe("image");
    expect(b.type).toBe("image");
    if (a.type !== "image" || b.type !== "image") return;
    expect(a.crop).toEqual(b.crop);
    expect(b.frame.width).toBe(a.frame.width / 2);
    expect(b.sourceSize).toEqual({ width: 320, height: 400 });
    expect(b.cropRules).toBe("naraframe-image-crop/1");
    const source = await loadPlanProject(fixture.root);
    if (!source.ok) throw new Error(JSON.stringify(source.issues));
    const bare = structuredClone(source.value.source);
    const bareScene = required(bare.scenes.scenes[0]);
    if (bareScene.visual.type === "composition")
      for (const layer of bareScene.visual.layers)
        if (layer.type === "image") delete layer.crop;
    const legacy = compileDraft(bare);
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) throw new Error(JSON.stringify(legacy.issues));
    expect(
      required(legacy.value.scenes[0])
        .layers.filter((l) => l.type === "image")
        .every((l) => !("cropRules" in l) && !("sourceSize" in l)),
    ).toBe(true);
    delete bare.project.libraryImports;
    delete bare.imageSizes;
    for (const asset of bare.assets.assets)
      if (asset.status === "ready" && asset.kind === "png") delete asset.layout;
    const optedOut = compileDraft(bare);
    expect(optedOut.ok).toBe(true);
    if (!optedOut.ok) throw new Error(JSON.stringify(optedOut.issues));
    expect(computeSceneRenderKeys(optedOut.value)).toEqual(
      computeSceneRenderKeys(legacy.value),
    );
    const invalid = structuredClone(source.value.source);
    const invalidScene = required(invalid.scenes.scenes[0]);
    if (invalidScene.visual.type === "composition") {
      const layer = invalidScene.visual.layers[0];
      if (layer?.type === "image")
        layer.crop = { x: 200, y: 0, width: 200, height: 300 };
    }
    expect(compileDraft(invalid).issues.map((i) => i.code)).toContain(
      "IMAGE_CROP_INVALID",
    );
  });
  it("captures optional recipe code/manifest without transferring trust and restores it with undo", async () => {
    const fixture = await setup();
    await cp(
      resolve("test-fixtures/recipes/frame-card"),
      join(fixture.catalogRoot, "recipes/frame-card"),
      { recursive: true },
    );
    await catalogChange(fixture, (c) => {
      c.recipes = [{ id: "frame-card", path: "recipes/frame-card" }];
      const p = required(c.patterns[0]);
      p.template.visual = {
        type: "recipe",
        recipe: "frame-card",
        params: {
          title: "Recipe note",
          image: {
            assetId: "pose-left",
            crop: { x: 60, y: 50, width: 200, height: 300 },
          },
        },
      };
      p.template.beats = [];
      delete p.attachments;
      p.parameters = {
        title: {
          type: "string",
          pointers: ["/visual/params/title"],
          description: "Title",
        },
      };
    });
    const staged = await stage({
      ...fixture,
      pattern: "anchored-note",
      version: "1.0.0",
      instance: "lesson",
      scene: "asset-swap",
      params: { title: "Recipe note" },
    });
    expect(staged.ok, JSON.stringify(staged.issues)).toBe(true);
    if (!staged.ok) return;
    expect(staged.value.receipt.recipeDependencies.length).toBeGreaterThan(1);
    await editProject({
      root: fixture.root,
      from: staged.value.staging,
      expect: staged.value.sourceRevision,
      summary: "recipe dependency",
    });
    const loaded = await loadPlanProject(fixture.root);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(await readRecipeTrust(fixture.root)).toEqual([]);
    expect(
      checkRecipeTrust(await compiled(fixture.root), []).map((i) => i.code),
    ).toContain("RECIPE_NOT_TRUSTED");
    const before = hashValue(loaded.value.source);
    const local = await stage({
      root: fixture.root,
      instance: "lesson",
      params: { title: "Updated title" },
    });
    expect(local.ok).toBe(true);
    if (!local.ok) return;
    await editProject({
      root: fixture.root,
      from: local.value.staging,
      expect: local.value.sourceRevision,
      summary: "copy",
    });
    await undoProject({ root: fixture.root });
    const restored = await loadPlanProject(fixture.root);
    if (!restored.ok) throw new Error(JSON.stringify(restored.issues));
    expect(hashValue(restored.value.source)).toBe(before);
    const oldRecipe = required(restored.value.source.recipes?.[0]);
    const oldTrust = [
      {
        recipeId: oldRecipe.id,
        codeSha256: oldRecipe.codeSha256,
        authorizedBy: "Test fixture",
        trustedAt: "2026-10-14T00:00:00.000Z",
      },
    ];
    expect(checkRecipeTrust(await compiled(fixture.root), oldTrust)).toEqual(
      [],
    );
    const manifest = await json(
      fixture.catalogRoot,
      "recipes/frame-card/recipe.json",
    );
    const entry = join(
      fixture.catalogRoot,
      "recipes/frame-card",
      manifest.entry,
    );
    await writeFile(
      entry,
      `${await readFile(entry, "utf8")}\n// changed library code\n`,
    );
    await catalogChange(fixture, (c) => {
      c.version = "1.1.0";
      required(c.patterns[0]).version = "1.1.0";
    });
    const updated = await stage({
      ...fixture,
      pattern: "anchored-note",
      version: "1.1.0",
      instance: "lesson",
      params: { title: "Recipe note" },
      update: true,
    });
    expect(updated.ok, JSON.stringify(updated.issues)).toBe(true);
    if (!updated.ok) throw new Error(JSON.stringify(updated.issues));
    const applied = await editProject({
      root: fixture.root,
      from: updated.value.staging,
      expect: updated.value.sourceRevision,
      summary: "changed recipe dependency",
    });
    expect(applied.ok, JSON.stringify(applied.issues)).toBe(true);
    expect(
      checkRecipeTrust(await compiled(fixture.root), oldTrust).map(
        (i) => i.code,
      ),
    ).toContain("RECIPE_NOT_TRUSTED");
    expect(await readRecipeTrust(fixture.root)).toEqual([]);
    const undone = await undoProject({ root: fixture.root });
    expect(undone.ok).toBe(true);
    expect(checkRecipeTrust(await compiled(fixture.root), oldTrust)).toEqual(
      [],
    );
  });
});
