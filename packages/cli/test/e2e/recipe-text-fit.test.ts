import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { png } from "../../../core/test/integration/recipe-fixture.js";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const fixtureRecipe = join(
  repositoryRoot,
  "test-fixtures",
  "recipes",
  "text-card",
);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

interface Event {
  success: boolean;
  buildId: string | null;
  sourceRevision: string | null;
  data: Record<string, unknown>;
  issues: Array<{
    code: string;
    severity: string;
    path?: string;
    entityId?: string;
    message: string;
  }>;
}

const cli = async (...args: string[]): Promise<Event> => {
  const { stdout } = await run(
    process.execPath,
    [cliEntry, ...args, "--json"],
    { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  ).catch((error: { stdout?: string }) => ({ stdout: error.stdout ?? "{}" }));
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as Event;
};

const temp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-text-fit-"));
  roots.push(dir);
  return dir;
};

/** System faces only: Arial is narrow enough, Courier New is not. */
const writeProfile = async (id: string, fontFamily: string) => {
  const dir = await temp();
  await mkdir(join(dir, "assets"), { recursive: true });
  await writeFile(join(dir, "assets", "logo.png"), png(32, 32));
  await writeFile(
    join(dir, "profile.json"),
    JSON.stringify({
      schemaVersion: 1,
      id,
      version: "1.0.0",
      render: {
        palette: {
          background: "#11130F",
          surface: "#E8E0D2",
          text: "#F5F1E8",
          accent: "#FF5500",
        },
        typography: { fontFamily, headingWeight: 700, bodyWeight: 400 },
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
      lockedPaths: ["format.design", "format.draft"],
      overridablePaths: [],
      assets: [{ id: `${id}-logo`, kind: "png", path: "assets/logo.png" }],
    }),
  );
  await writeFile(join(dir, "direction.md"), `Direction for ${id}.`);
  return dir;
};

const scenes = (title: string) => ({
  schemaVersion: 1,
  scenes: [
    {
      id: "card",
      narrativeRole: "cta",
      durationMs: 1000,
      visual: { type: "recipe", recipe: "text-card", params: { title } },
      beats: [],
      transition: { type: "cut" },
    },
  ],
});

const overflow = (event: Event) =>
  event.issues
    .filter((issue) => issue.code === "RECIPE_TEXT_OVERFLOW")
    .map((issue) => [issue.path, issue.entityId]);

describe("text fit of a recipe slot across a profile switch", () => {
  it("refuses an overflowing title at 540 and 1080, clears after an edit and undoes with reuse", async () => {
    const narrow = await writeProfile("narrow", "Arial, Helvetica, sans-serif");
    const wide = await writeProfile("wide", "Courier New, Courier, monospace");
    const project = join(await temp(), "project");
    expect((await cli("create", project, "--profile", narrow)).success).toBe(
      true,
    );
    await cp(fixtureRecipe, join(project, "recipes", "text-card"), {
      recursive: true,
    });
    const config = JSON.parse(
      await readFile(join(project, "naraframe.json"), "utf8"),
    );
    await writeFile(
      join(project, "naraframe.json"),
      JSON.stringify({
        ...config,
        audioMode: "silent",
        recipes: [{ id: "text-card", path: "recipes/text-card" }],
      }),
    );
    await writeFile(
      join(project, "scenes.json"),
      JSON.stringify(scenes("Lilin kecil ini")),
    );
    const scenesBefore = await readFile(join(project, "scenes.json"), "utf8");
    expect(
      (
        await cli(
          "recipe",
          "trust",
          project,
          "--recipe",
          "text-card",
          "--authorized-by",
          "Owner",
        )
      ).success,
    ).toBe(true);

    // Fits in the narrow face; validate says where fit is measured.
    const validated = await cli("validate", project, "--stage", "production");
    expect(validated.success).toBe(true);
    expect(
      validated.issues.find(
        (issue) => issue.code === "RECIPE_TEXT_FIT_COVERAGE",
      )?.message,
    ).toContain("title (1)");
    const first = await cli("preview", project, "--draft");
    expect(first.success, JSON.stringify(first.issues)).toBe(true);
    const pointer = join(project, "preview", "current.json");
    const pointerBefore = await readFile(pointer, "utf8");

    // The wide face does not fit: refused at 540 and at 1080, nothing published.
    expect((await cli("profile", "apply", wide, project)).success).toBe(true);
    const at540 = await cli("preview", project, "--draft");
    const at1080 = await cli("preview", project, "--resolution", "1080");
    expect(at540.success).toBe(false);
    expect(at1080.success).toBe(false);
    expect(overflow(at540)).toEqual([
      ["/scenes/0/visual/params/title", "title"],
    ]);
    expect(overflow(at1080)).toEqual(overflow(at540));
    expect(
      at540.issues.find((issue) => issue.code === "RECIPE_TEXT_OVERFLOW")
        ?.message,
    ).toContain("Courier New");
    expect(await readFile(pointer, "utf8")).toBe(pointerBefore);

    // A shorter title fits the wide face.
    const staging = join(await temp(), "staging");
    await mkdir(staging, { recursive: true });
    await writeFile(
      join(staging, "scenes.json"),
      JSON.stringify(scenes("Lilin kecil")),
    );
    const status = await cli("status", project);
    expect(
      (
        await cli(
          "edit",
          project,
          "--from",
          staging,
          "--expect",
          status.sourceRevision ?? "",
          "--summary",
          "Shorter title for the wide face",
        )
      ).success,
    ).toBe(true);
    const second = await cli("preview", project, "--draft");
    expect(second.success, JSON.stringify(second.issues)).toBe(true);
    expect(second.data.reusedFromBuildId).toBeNull();

    // Undo the edit (refused again), then the switch (original pixels reused).
    expect((await cli("undo", project)).success).toBe(true);
    expect(overflow(await cli("preview", project, "--draft"))).toHaveLength(1);
    expect((await cli("undo", project)).success).toBe(true);
    expect(await readFile(join(project, "scenes.json"), "utf8")).toBe(
      scenesBefore,
    );
    const back = await cli("preview", project, "--draft");
    expect(back.success).toBe(true);
    expect(back.data.reusedFromBuildId).toBe(first.buildId);
    const stale = await cli(
      "render",
      project,
      "--approve-preview",
      second.buildId ?? "",
    );
    expect(stale.success).toBe(false);
    expect(stale.issues.map((issue) => issue.code)).toContain(
      "APPROVAL_PREVIEW_STALE",
    );
  });
});
