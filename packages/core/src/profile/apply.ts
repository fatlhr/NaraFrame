import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { loadPlanProject } from "../io/load-project.js";
import type { Issue, Result } from "../model/issue.js";
import { buildProfileLock } from "../project/create-project.js";
import { syncWorkingCopy } from "../revision/capture.js";
import { type EditResult, editProject } from "../revision/edit.js";
import { withProjectLock } from "../revision/lock.js";
import { readCurrentRevisionId } from "../revision/store.js";
import { type ProfileLock, ProfileLockSchema } from "../schema/profile.js";
import { type ProjectConfig, ProjectConfigSchema } from "../schema/project.js";
import { type BrandBindingPlan, planBrandBindings } from "./brand-bindings.js";
import { applyProjectOverrides, classifyOverridePath } from "./overrides.js";

export type ProfileEffect =
  | "recompile"
  | "revalidate-layout"
  | "regenerate-narration"
  | "replace-assets"
  | "editorial-review";

export interface ProfileChange {
  path: string;
  before: unknown;
  after: unknown;
}

export interface OverrideConflict {
  path: string;
  value: unknown;
  reason: "locked" | "not-overridable" | "unknown-root" | "invalid";
}

export interface ProfileApplyPlan {
  from: { id: string; version: string };
  to: { id: string; version: string };
  changes: ProfileChange[];
  effects: ProfileEffect[];
  directionChanged: boolean;
  assets: { added: string[]; removed: string[] };
  /** Overrides that stay in force under the new profile. */
  preservedOverrides: string[];
  /** Overrides the new profile no longer accepts. They block apply unless reset. */
  conflicts: OverrideConflict[];
  /** Conflicting overrides that this apply explicitly removes. */
  resetOverrides: string[];
  /**
   * Brand-bound images and text under the new profile: what it can replace
   * by role, what it cannot, what is neutral and what is unknown. Present
   * when either profile manages a brand or the project binds assets/text.
   */
  bindings?: BrandBindingPlan;
  blocked: boolean;
}

export interface ProfileApplyOptions {
  root: string;
  profileDirectory: string;
  profileSource: { kind: "repository" | "local"; identity: string };
  /** Remove overrides the new profile rejects instead of blocking on them. */
  resetConflicts?: boolean;
}

const isPlain = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const leaves = (
  value: unknown,
  prefix: string,
  out: Map<string, unknown>,
): void => {
  if (isPlain(value)) {
    for (const [key, child] of Object.entries(value)) {
      leaves(child, prefix === "" ? key : `${prefix}.${key}`, out);
    }
    return;
  }
  out.set(prefix, value);
};

const flatten = (profile: ProfileLock): Map<string, unknown> => {
  const out = new Map<string, unknown>();
  leaves(profile.render, "render", out);
  leaves(profile.production, "production", out);
  leaves(profile.duration, "duration", out);
  return out;
};

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const LAYOUT_PREFIXES = [
  "render.typography",
  "render.safeZone",
  "render.appearance",
  "render.spacingUnit",
  "render.captions",
];

const startsWithAny = (path: string, prefixes: string[]): boolean =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`));

const fail = (code: string, message: string, suggestion: string): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: "profile",
  path: "/",
  message,
  suggestion,
});

interface Prepared {
  plan: ProfileApplyPlan;
  project: ProjectConfig;
  lock: ProfileLock;
  assets: Array<{ path: string; sourcePath: string }>;
}

const prepare = async (
  options: ProfileApplyOptions,
): Promise<Result<Prepared>> => {
  const root = resolve(options.root);
  let currentProject: ProjectConfig;
  let currentLock: ProfileLock;
  try {
    const project = ProjectConfigSchema.safeParse(
      JSON.parse(await readFile(join(root, "naraframe.json"), "utf8")),
    );
    const lock = ProfileLockSchema.safeParse(
      JSON.parse(await readFile(join(root, "profile.lock.json"), "utf8")),
    );
    if (!project.success || !lock.success) throw new Error("invalid");
    currentProject = project.data;
    currentLock = lock.data;
  } catch {
    return {
      ok: false,
      issues: [
        fail(
          "PROJECT_UNREADABLE",
          "naraframe.json or profile.lock.json could not be read.",
          "Validate the project first.",
        ),
      ],
    };
  }

  const built = await buildProfileLock(
    options.profileDirectory,
    options.profileSource,
  );
  if (!built.ok) return built;
  const candidate = built.value.lock;

  const before = flatten(currentLock);
  const after = flatten(candidate);
  const changes: ProfileChange[] = [];
  for (const path of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    if (!same(before.get(path), after.get(path))) {
      changes.push({ path, before: before.get(path), after: after.get(path) });
    }
  }

  const oldAssets = new Set(currentLock.assets.map((asset) => asset.sha256));
  const newAssets = new Set(candidate.assets.map((asset) => asset.sha256));
  const assets = {
    added: [...newAssets].filter((sha) => !oldAssets.has(sha)).sort(),
    removed: [...oldAssets].filter((sha) => !newAssets.has(sha)).sort(),
  };
  const directionChanged =
    currentLock.direction.sha256 !== candidate.direction.sha256;

  const effects = new Set<ProfileEffect>();
  for (const change of changes) {
    if (
      change.path.startsWith("render.") ||
      change.path.startsWith("duration.")
    ) {
      effects.add("recompile");
    }
    if (startsWithAny(change.path, LAYOUT_PREFIXES)) {
      effects.add("revalidate-layout");
    }
    if (
      change.path === "production.voiceStyleSignature" ||
      change.path.startsWith("production.timing")
    ) {
      effects.add("regenerate-narration");
    }
    if (change.path === "production.illustrationStyleSignature") {
      effects.add("replace-assets");
    }
  }
  if (assets.added.length > 0 || assets.removed.length > 0) {
    effects.add("replace-assets");
    effects.add("recompile");
  }
  if (directionChanged) effects.add("editorial-review");

  // Identity is reviewed, never rewritten: report what the switch touches.
  const loaded = await loadPlanProject(root);
  const bindings = loaded.ok
    ? planBrandBindings(loaded.value.source, candidate)
    : undefined;
  const bindingsRelevant =
    bindings !== undefined &&
    (currentLock.brand !== undefined ||
      candidate.brand !== undefined ||
      bindings.branded.length +
        bindings.incompatible.length +
        bindings.text.length >
        0);
  if (bindings && bindingsRelevant) {
    if (
      bindings.text.some((entry) => entry.target !== entry.current) ||
      (candidate.id !== currentLock.id && bindings.claims.length > 0)
    ) {
      effects.add("editorial-review");
    }
    if (bindings.branded.length + bindings.incompatible.length > 0) {
      effects.add("replace-assets");
    }
  }

  const conflicts: OverrideConflict[] = [];
  const preserved: string[] = [];
  for (const [path, value] of Object.entries(currentProject.overrides ?? {})) {
    const kind = classifyOverridePath(candidate, path);
    if (kind !== "allowed") {
      conflicts.push({ path, value, reason: kind });
      continue;
    }
    const single = applyProjectOverrides(candidate, { [path]: value });
    if (single.ok) preserved.push(path);
    else conflicts.push({ path, value, reason: "invalid" });
  }
  const resetOverrides = options.resetConflicts
    ? conflicts.map((conflict) => conflict.path)
    : [];

  const remaining = Object.fromEntries(
    Object.entries(currentProject.overrides ?? {}).filter(
      ([path]) => !resetOverrides.includes(path),
    ),
  );
  const project: ProjectConfig = {
    ...currentProject,
    profile: { id: candidate.id, version: candidate.version },
  };
  if (Object.keys(remaining).length > 0) project.overrides = remaining;
  else delete project.overrides;

  return {
    ok: true,
    value: {
      plan: {
        from: { id: currentLock.id, version: currentLock.version },
        to: { id: candidate.id, version: candidate.version },
        changes,
        effects: [...effects].sort(),
        directionChanged,
        assets,
        preservedOverrides: preserved.sort(),
        conflicts,
        resetOverrides,
        ...(bindings && bindingsRelevant ? { bindings } : {}),
        blocked: conflicts.length > resetOverrides.length,
      },
      project,
      lock: candidate,
      assets: built.value.assets.map((asset) => ({
        path: asset.path,
        sourcePath: asset.sourcePath,
      })),
    },
    issues: [],
  };
};

const conflictIssues = (plan: ProfileApplyPlan): Issue[] =>
  plan.conflicts
    .filter((conflict) => !plan.resetOverrides.includes(conflict.path))
    .map((conflict) => ({
      code: "OVERRIDE_CONFLICT",
      severity: "error" as const,
      responsible: "user" as const,
      artifact: "naraframe.json",
      path: `/overrides/${conflict.path}`,
      message: `Project override ${conflict.path} is not accepted by profile ${plan.to.id}@${plan.to.version} (${conflict.reason}).`,
      suggestion:
        "Remove the override yourself, or apply again with --reset-overrides to drop it explicitly. Undo restores it.",
    }));

/** Reads only: shows what applying a profile would change. */
export const planProfileApply = async (
  options: ProfileApplyOptions,
): Promise<Result<ProfileApplyPlan>> => {
  const prepared = await prepare(options);
  if (!prepared.ok) return prepared;
  return {
    ok: true,
    value: prepared.value.plan,
    issues: conflictIssues(prepared.value.plan),
  };
};

export interface ProfileApplyResult {
  plan: ProfileApplyPlan;
  edit: EditResult;
}

/**
 * Applies the profile as one revision. A conflicting override blocks it;
 * stale voice or assets do not, because the source stays valid and final
 * export is what waits for replacements.
 */
export const applyProfile = async (
  options: ProfileApplyOptions,
): Promise<Result<ProfileApplyResult>> => {
  const root = resolve(options.root);
  const prepared = await prepare(options);
  if (!prepared.ok) return prepared;
  const { plan, project, lock, assets } = prepared.value;
  const blocking = conflictIssues(plan);
  if (blocking.length > 0) return { ok: false, issues: blocking };

  const synced = await withProjectLock(root, () => syncWorkingCopy(root));
  if (!synced.ok) return synced;
  const expect = (await readCurrentRevisionId(root)) ?? synced.value.revisionId;

  const staging = join(
    root,
    ".naraframe",
    "attempts",
    `profile-${randomUUID()}`,
  );
  try {
    await mkdir(staging, { recursive: true });
    await writeFile(
      join(staging, "naraframe.json"),
      `${JSON.stringify(project, null, 2)}\n`,
    );
    await writeFile(
      join(staging, "profile.lock.json"),
      `${JSON.stringify(lock, null, 2)}\n`,
    );
    for (const asset of assets) {
      await mkdir(dirname(join(staging, asset.path)), { recursive: true });
      await copyFile(asset.sourcePath, join(staging, asset.path));
    }
    const edited = await editProject({
      root,
      from: staging,
      expect,
      summary: `Apply profile ${plan.to.id}@${plan.to.version}`,
    });
    if (!edited.ok) return edited;
    return {
      ok: true,
      value: { plan, edit: edited.value },
      issues: [...synced.issues, ...edited.issues],
    };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
};
