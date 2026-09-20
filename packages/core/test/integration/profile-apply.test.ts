import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  voice?: string;
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
      text: "#FFFFFF",
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
    illustrationStyleSignature: "illustration-v1",
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
    expect(plan.value.effects).toEqual([
      "editorial-review",
      "recompile",
      "regenerate-narration",
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
