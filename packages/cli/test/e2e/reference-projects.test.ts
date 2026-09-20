import { execFile } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const fixtures = join(repositoryRoot, "test-fixtures");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const temporaryRoots: string[] = [];

interface Event {
  success: boolean;
  issues: Array<{ code: string; severity: string; entityId?: string }>;
  artifacts: Record<string, string>;
  data: Record<string, unknown>;
}

/** A blocked stage exits non-zero on purpose, so the event is read either way. */
const cli = async (...args: string[]): Promise<Event> => {
  const stdout = await run(process.execPath, [cliEntry, ...args, "--json"], {
    timeout: 600_000,
    maxBuffer: 32 * 1024 * 1024,
  }).then(
    (result) => result.stdout,
    (error: { stdout?: string }) => error.stdout ?? "",
  );
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as Event;
};

const codes = (event: Event) => event.issues.map((issue) => issue.code);

/** A writable copy, so a render never leaves builds in the committed fixture. */
const copyFixture = async (name: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-reference-"));
  temporaryRoots.push(root);
  const project = join(root, name);
  await cp(join(fixtures, name), project, {
    recursive: true,
    filter: (source) =>
      !/[\\/](preview|revisions|\.naraframe|output)([\\/]|$)/.test(source),
  });
  return project;
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("NF-AC-03 reference scenarios", () => {
  it("scenario 1: the current-issues explainer validates and renders with map, timeline, diagram, narration, captions, music and SFX", async () => {
    const project = await copyFixture("project-current-issues");

    const validation = await cli("validate", project, "--stage", "production");
    expect(validation.success, JSON.stringify(validation.issues)).toBe(true);

    const preview = await cli("preview", project, "--draft");
    expect(preview.success, JSON.stringify(preview.issues)).toBe(true);
    expect(preview.artifacts.previewMp4).toBeTruthy();

    const status = await cli("status", project);
    expect(status.data.previewState).toBe("current");
    expect(status.data.needsProduction).toEqual([]);
  }, 900_000);

  it("scenario 3: the general explainer validates and renders media, a stat, a comparison and layered composition", async () => {
    const project = await copyFixture("project-general-explainer");

    const validation = await cli("validate", project, "--stage", "production");
    expect(validation.success, JSON.stringify(validation.issues)).toBe(true);

    const preview = await cli("preview", project, "--draft");
    expect(preview.success, JSON.stringify(preview.issues)).toBe(true);
  }, 900_000);

  it("scenario 2: re-applying a profile repaints the project, reports what it invalidated, blocks final, and undoes cleanly", async () => {
    const project = await copyFixture("project-current-issues");
    const contrast = join(fixtures, "profiles", "contrast");

    const before = await cli("preview", project, "--draft");
    expect(before.success).toBe(true);
    const beforeRevision = (await cli("status", project)).data
      .currentSourceFingerprint;

    const dryRun = await cli(
      "profile",
      "apply",
      contrast,
      project,
      "--dry-run",
    );
    const plan = dryRun.data.plan as {
      blocked: boolean;
      effects: string[];
      changes: Array<{ path: string }>;
    };
    expect(dryRun.data.applied).toBe(false);
    expect(plan.blocked).toBe(false);
    expect(plan.effects).toContain("regenerate-narration");
    expect(plan.effects).toContain("revalidate-layout");
    expect(plan.changes.map((change) => change.path)).toContain(
      "render.palette.accent",
    );
    // A dry run reads only: the project still compiles to the same thing.
    expect((await cli("status", project)).data.currentSourceFingerprint).toBe(
      beforeRevision,
    );

    const applied = await cli("profile", "apply", contrast, project);
    expect(applied.success, JSON.stringify(applied.issues)).toBe(true);

    // The invalidation report: every voice clip was made with the old style.
    const status = await cli("status", project);
    expect(status.data.needsProduction).toEqual([
      {
        blockId: "opening",
        reason: "voice-style",
        generationKey: expect.any(String),
      },
      {
        blockId: "mechanism",
        reason: "voice-style",
        generationKey: expect.any(String),
      },
      {
        blockId: "closing",
        reason: "voice-style",
        generationKey: expect.any(String),
      },
    ]);

    // Layout revalidation: the draft still compiles and renders under the new
    // profile, and its pixels are not the previous build's.
    const after = await cli("preview", project, "--draft");
    expect(after.success, JSON.stringify(after.issues)).toBe(true);
    expect(after.data.reusedFromBuildId).toBeNull();
    expect(status.data.currentSourceFingerprint).not.toBe(beforeRevision);

    // Final is what waits for the replacement voice, not the preview.
    const production = await cli("validate", project, "--stage", "production");
    expect(production.success).toBe(false);
    // Everything else about the repainted project still checks out.
    expect(
      production.issues.filter(
        (issue) => issue.code !== "VOICE_STYLE_MISMATCH",
      ),
    ).toEqual([]);
    expect(
      production.issues.filter(
        (issue) =>
          issue.code === "VOICE_STYLE_MISMATCH" && issue.severity === "error",
      ),
    ).toHaveLength(3);

    const undone = await cli("undo", project);
    expect(undone.success, JSON.stringify(undone.issues)).toBe(true);
    const restored = await cli("status", project);
    expect(restored.data.currentSourceFingerprint).toBe(beforeRevision);
    expect(restored.data.needsProduction).toEqual([]);
    expect(
      codes(await cli("validate", project, "--stage", "production")),
    ).toEqual([]);
  }, 1_200_000);
});
