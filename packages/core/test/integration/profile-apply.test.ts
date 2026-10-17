import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlanSource } from "@naraframe/core";
import {
  applyProfile,
  checkProductionReadiness,
  compileDraft,
  createProject,
  loadPlanProject,
  narrationTextHash,
  pendingGeneration,
  planProfileApply,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const tmp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-profile-"));
  dirs.push(dir);
  return dir;
};

const profileJson = (patch: {
  version: string;
  accent?: string;
  text?: string;
  voice?: string;
  illustration?: string;
  lockedPaths?: string[];
  fontWeight?: number;
  overridablePaths?: string[];
}) => ({
  schemaVersion: 1,
  id: "test-profile",
  version: patch.version,
  render: {
    palette: {
      background: "#111111",
      surface: "#EEEEEE",
      text: patch.text ?? "#FFFFFF",
      accent: patch.accent ?? "#FF5500",
    },
    typography: {
      fontFamily: "Arial, sans-serif",
      headingWeight: patch.fontWeight ?? 800,
      bodyWeight: 500,
    },
    safeZone: { top: 80, right: 44, bottom: 100, left: 44 },
    spacingUnit: 8,
    motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.06 },
  },
  production: {
    voiceStyleSignature: patch.voice ?? "voice-v1",
    illustrationStyleSignature: patch.illustration ?? "illustration-v1",
    timing: { wordLevelRequired: false },
    assetPolicy: { allowPlannedInDraft: true },
  },
  duration: { preferredMinMs: 15_000, preferredMaxMs: 30_000 },
  lockedPaths: patch.lockedPaths ?? ["format.design", "format.draft"],
  overridablePaths: patch.overridablePaths ?? [
    "render.palette",
    "render.motion",
  ],
  assets: [],
});

const writeProfile = async (
  patch: Parameters<typeof profileJson>[0],
  direction = "Direction one.",
): Promise<string> => {
  const dir = await tmp();
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "profile.json"),
    JSON.stringify(profileJson(patch)),
  );
  await writeFile(join(dir, "direction.md"), direction);
  return dir;
};

const source = { kind: "local" as const, identity: "test-profile" };

const makeProject = async (
  overrides?: Record<string, unknown>,
): Promise<string> => {
  const profileDirectory = await writeProfile({ version: "1.0.0" });
  const parent = await tmp();
  const root = join(parent, "project");
  const created = await createProject({
    destination: root,
    projectId: "project",
    title: "Project",
    profileDirectory,
    profileSource: source,
  });
  if (!created.ok) throw new Error(created.issues.map((i) => i.code).join());
  if (overrides) {
    const path = join(root, "naraframe.json");
    const project = JSON.parse(await readFile(path, "utf8"));
    project.overrides = overrides;
    await writeFile(path, JSON.stringify(project, null, 2));
  }
  return root;
};

const read = async (root: string, file: string) =>
  JSON.parse(await readFile(join(root, file), "utf8"));

describe("profile apply", () => {
  it("dry-run reports the diff and effects and changes nothing", async () => {
    const root = await makeProject({ "render.palette.text": "#EEEEEE" });
    const next = await writeProfile(
      {
        version: "2.0.0",
        accent: "#00AA55",
        voice: "voice-v2",
        fontWeight: 700,
      },
      "Direction two.",
    );
    const before = await readFile(join(root, "profile.lock.json"), "utf8");

    const plan = await planProfileApply({
      root,
      profileDirectory: next,
      profileSource: source,
    });
    expect(plan.ok, JSON.stringify(plan.issues)).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.from.version).toBe("1.0.0");
    expect(plan.value.to.version).toBe("2.0.0");
    expect(plan.value.changes.map((c) => c.path)).toEqual([
      "production.voiceStyleSignature",
      "render.palette.accent",
      "render.typography.headingWeight",
    ]);
    // A project created from a profile has no narration, so the voice
    // signature change names no `regenerate-narration` effect.
    expect(plan.value.effects).toEqual([
      "editorial-review",
      "recompile",
      "revalidate-layout",
    ]);
    expect(plan.value.preservedOverrides).toEqual(["render.palette.text"]);
    expect(plan.value.blocked).toBe(false);
    expect(await readFile(join(root, "profile.lock.json"), "utf8")).toBe(
      before,
    );
    expect((await read(root, "naraframe.json")).profile.version).toBe("1.0.0");
  });

  it("applies as one revision, keeps allowed overrides, and undo restores the old profile", async () => {
    const root = await makeProject({ "render.palette.text": "#EEEEEE" });
    const oldLock = await readFile(join(root, "profile.lock.json"), "utf8");
    const next = await writeProfile({ version: "2.0.0", accent: "#00AA55" });

    const applied = await applyProfile({
      root,
      profileDirectory: next,
      profileSource: source,
    });
    expect(applied.ok, JSON.stringify(applied.issues)).toBe(true);

    const project = await read(root, "naraframe.json");
    expect(project.profile.version).toBe("2.0.0");
    expect(project.overrides).toEqual({ "render.palette.text": "#EEEEEE" });
    const loaded = await loadPlanProject(root);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.source.profile.render.palette.accent).toBe("#00AA55");
      expect(loaded.value.source.profile.render.palette.text).toBe("#EEEEEE");
    }

    const undone = await undoProject({ root });
    expect(undone.ok, JSON.stringify(undone.issues)).toBe(true);
    expect(await readFile(join(root, "profile.lock.json"), "utf8")).toBe(
      oldLock,
    );
    expect((await read(root, "naraframe.json")).profile.version).toBe("1.0.0");
  });

  it("blocks on an override the new profile locks, and never touches source", async () => {
    const root = await makeProject({ "render.palette.text": "#EEEEEE" });
    const next = await writeProfile({
      version: "2.0.0",
      lockedPaths: ["format.design", "format.draft", "render.palette"],
      overridablePaths: ["render.motion"],
    });
    const before = await readFile(join(root, "naraframe.json"), "utf8");

    const plan = await planProfileApply({
      root,
      profileDirectory: next,
      profileSource: source,
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.value.blocked).toBe(true);
      expect(plan.value.conflicts).toEqual([
        { path: "render.palette.text", value: "#EEEEEE", reason: "locked" },
      ]);
    }
    expect(plan.issues.map((i) => i.code)).toEqual(["OVERRIDE_CONFLICT"]);

    const applied = await applyProfile({
      root,
      profileDirectory: next,
      profileSource: source,
    });
    expect(applied.ok).toBe(false);
    expect(await readFile(join(root, "naraframe.json"), "utf8")).toBe(before);
  });

  it("drops a conflicting override only when asked, and undo brings it back", async () => {
    const root = await makeProject({ "render.palette.text": "#EEEEEE" });
    const next = await writeProfile({
      version: "2.0.0",
      lockedPaths: ["format.design", "format.draft", "render.palette"],
      overridablePaths: ["render.motion"],
    });

    const applied = await applyProfile({
      root,
      profileDirectory: next,
      profileSource: source,
      resetConflicts: true,
    });
    expect(applied.ok, JSON.stringify(applied.issues)).toBe(true);
    if (applied.ok) {
      expect(applied.value.plan.resetOverrides).toEqual([
        "render.palette.text",
      ]);
    }
    expect((await read(root, "naraframe.json")).overrides).toBeUndefined();

    await undoProject({ root });
    expect((await read(root, "naraframe.json")).overrides).toEqual({
      "render.palette.text": "#EEEEEE",
    });
  });
});

const sampleRoot = (name: string): string =>
  new URL(`../../../../samples/${name}`, import.meta.url).pathname;

/** A copy of a sample project, pinned to the sample's own profile lock. */
const copySample = async (name: string, entries: string[]): Promise<string> => {
  const root = await tmp();
  for (const entry of entries) {
    await cp(join(sampleRoot(name), entry), join(root, entry), {
      recursive: true,
    });
  }
  return root;
};

describe("profile apply and narration", () => {
  const next = () =>
    writeProfile({ version: "2.0.0", voice: "voice-v2" }, "Direction one.");

  it("omits regenerate-narration for a project without narration", async () => {
    const root = await copySample("krakatau-draft", [
      "naraframe.json",
      "profile.lock.json",
      "scenes.json",
      "assets",
    ]);
    const plan = await planProfileApply({
      root,
      profileDirectory: await next(),
      profileSource: source,
    });
    expect(plan.ok, JSON.stringify(plan.issues)).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.changes.map((c) => c.path)).toContain(
      "production.voiceStyleSignature",
    );
    expect(plan.value.effects).not.toContain("regenerate-narration");
  });

  it("lists regenerate-narration when the voice signature changes and narration exists", async () => {
    const root = await copySample("krakatau-narrated", [
      "naraframe.json",
      "profile.lock.json",
      "scenes.json",
      "narration.json",
      "assets",
      "audio",
    ]);
    const plan = await planProfileApply({
      root,
      profileDirectory: await next(),
      profileSource: source,
    });
    expect(plan.ok, JSON.stringify(plan.issues)).toBe(true);
    if (plan.ok) expect(plan.value.effects).toContain("regenerate-narration");
  });
});

describe("profile apply review", () => {
  /**
   * A project made from `test-profile@1.0.0` (bg #111111, surface #EEEEEE,
   * text #FFFFFF, accent #FF5500) holding the Krakatau scenes, with two layers
   * repainted from the palette: the eruption ring (accent) and the copy (text).
   */
  const reviewed = async (): Promise<string> => {
    const root = await makeProject();
    await cp(
      join(sampleRoot("krakatau-draft"), "assets"),
      join(root, "assets"),
      {
        recursive: true,
        force: true,
      },
    );
    const scenes = JSON.parse(
      await readFile(join(sampleRoot("krakatau-draft"), "scenes.json"), "utf8"),
    );
    const layers = scenes.scenes.find(
      (scene: { id: string }) => scene.id === "context",
    ).visual.layers;
    for (const layer of layers) {
      if (layer.id === "eruption-ring") layer.fill = "palette.accent";
      if (layer.id === "context-copy") layer.color = "palette.text";
    }
    await writeFile(join(root, "scenes.json"), JSON.stringify(scenes, null, 2));
    return root;
  };

  const planFor = async (
    root: string,
    patch: Parameters<typeof profileJson>[0],
    direction = "Direction one.",
  ) => {
    const plan = await planProfileApply({
      root,
      profileDirectory: await writeProfile(patch, direction),
      profileSource: source,
    });
    expect(plan.ok, JSON.stringify(plan.issues)).toBe(true);
    if (!plan.ok) throw new Error("plan failed");
    return plan.value;
  };

  it("names palette-bound layers with before and after, literal colours and image layers", async () => {
    const root = await reviewed();
    const plan = await planFor(root, { version: "2.0.0", accent: "#00AA55" });
    expect(plan.review?.paletteBound).toEqual([
      {
        sceneId: "context",
        layerId: "eruption-ring",
        property: "fill",
        token: "palette.accent",
        before: "#FF5500",
        after: "#00AA55",
      },
    ]);
    expect(plan.review?.literalColors).toEqual([
      {
        sceneId: "context",
        layerId: "map-panel",
        property: "fill",
        color: "#E8E0D2",
      },
      {
        sceneId: "context",
        layerId: "eruption-core",
        property: "fill",
        color: "#FF5A36",
      },
    ]);
    expect(plan.review?.imageLayers).toEqual([
      { sceneId: "context", layerId: "map-image", assetId: "krakatau-map" },
    ]);
  });

  it("sees the project's surviving overrides on both sides", async () => {
    // The text override holds under both profiles, so the copy stays listed
    // as unchanged and only the accent move is reported.
    const root = await reviewed();
    const project = await read(root, "naraframe.json");
    project.overrides = { "render.palette.text": "#CCCCCC" };
    await writeFile(join(root, "naraframe.json"), JSON.stringify(project));
    const plan = await planFor(root, {
      version: "2.0.0",
      accent: "#00AA55",
      text: "#ABCDEF",
    });
    expect(plan.review?.paletteBound.map((layer) => layer.layerId)).toEqual([
      "eruption-ring",
    ]);
  });

  it("lists literal colours and images but no bound layers when only the direction changes", async () => {
    const root = await reviewed();
    const unchanged = await planFor(root, { version: "1.0.0" });
    expect(unchanged.review).toBeUndefined();

    const plan = await planFor(root, { version: "1.0.0" }, "Direction two.");
    expect(plan.directionChanged).toBe(true);
    expect(plan.review?.paletteBound).toEqual([]);
    expect(plan.review?.literalColors).toHaveLength(2);
    expect(plan.review?.imageLayers).toHaveLength(1);
  });

  it("lists only image layers when only the illustration signature changes", async () => {
    const root = await reviewed();
    const plan = await planFor(root, {
      version: "2.0.0",
      illustration: "illustration-v2",
    });
    expect(plan.effects).toContain("replace-assets");
    expect(plan.review?.paletteBound).toEqual([]);
    expect(plan.review?.literalColors).toEqual([]);
    expect(plan.review?.imageLayers).toEqual([
      { sceneId: "context", layerId: "map-image", assetId: "krakatau-map" },
    ]);
  });

  it("adds nothing when palette, direction and illustration are unchanged", async () => {
    const root = await reviewed();
    const plan = await planFor(root, { version: "2.0.0", fontWeight: 700 });
    expect(plan.review).toBeUndefined();
    expect(JSON.stringify(plan)).not.toContain('"review"');
  });

  it("carries the same review into the applied result and leaves the sources alone", async () => {
    const root = await reviewed();
    const scenes = await readFile(join(root, "scenes.json"), "utf8");
    const applied = await applyProfile({
      root,
      profileDirectory: await writeProfile({
        version: "2.0.0",
        accent: "#00AA55",
      }),
      profileSource: source,
    });
    expect(applied.ok, JSON.stringify(applied.issues)).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.plan.review?.paletteBound).toHaveLength(1);
    expect(await readFile(join(root, "scenes.json"), "utf8")).toBe(scenes);
  });
});

describe("a profile change that makes voice stale", () => {
  const stale = (): PlanSource => {
    const base = narratedSource();
    const withSignature = {
      ...base,
      assets: {
        ...base.assets,
        assets: base.assets.assets.map((asset) => {
          if (asset.status !== "ready" || asset.kind === "png") return asset;
          const text = base.narration?.blocks.find(
            (b) => "audioAssetId" in b && b.audioAssetId === asset.id,
          )?.text;
          return text
            ? {
                ...asset,
                generation: {
                  textSha256: narrationTextHash(text),
                  voiceStyleSignature: "an-older-voice",
                },
              }
            : asset;
        }),
      },
    };
    return withSignature;
  };

  it("keeps the draft compiling, lists the blocks to regenerate, and blocks final", () => {
    const source = stale();
    const draft = compileDraft(source);
    expect(draft.ok).toBe(true);
    expect(pendingGeneration(source).map((p) => p.reason)).toEqual([
      "voice-style",
      "voice-style",
    ]);

    const final = compileDraft(source, { type: "project" }, { mode: "final" });
    expect(final.ok).toBe(true);
    if (!final.ok) return;
    const issues = checkProductionReadiness(source, final.value, final.issues);
    expect(
      issues.filter(
        (i) => i.code === "VOICE_STYLE_MISMATCH" && i.severity === "error",
      ),
    ).toHaveLength(2);
  });
});
