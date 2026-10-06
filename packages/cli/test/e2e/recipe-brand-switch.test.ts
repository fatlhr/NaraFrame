import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  cardParams,
  png,
  sha,
} from "../../../core/test/integration/recipe-fixture.js";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const fixtureRecipe = join(
  repositoryRoot,
  "test-fixtures",
  "recipes",
  "frame-card",
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
  artifacts: Record<string, string>;
  data: Record<string, unknown>;
  issues: Array<{ code: string; severity: string; path?: string }>;
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
  const dir = await mkdtemp(join(tmpdir(), "naraframe-brand-switch-"));
  roots.push(dir);
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

const writeProfile = async (
  id: string,
  brand: typeof brandA,
  accent: string,
): Promise<string> => {
  const dir = await temp();
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
          background: "#11130F",
          surface: "#E8E0D2",
          text: "#F5F1E8",
          accent,
        },
        typography: {
          fontFamily: "Arial, Helvetica, sans-serif",
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
      brand,
      lockedPaths: ["format.design", "format.draft"],
      overridablePaths: [],
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

const identity = (brand: typeof brandA, rule: string) =>
  cardParams({
    brand: { name: brand.name, cta: { ...brand.cta } },
    colors: { rule },
  });

const scenes = (params: Record<string, unknown>) => ({
  schemaVersion: 1,
  scenes: [
    {
      id: "card",
      narrativeRole: "cta",
      durationMs: 1000,
      carriesFactualClaim: false,
      visual: { type: "recipe", recipe: "frame-card", params },
      beats: [],
      transition: { type: "cut" },
    },
  ],
});

const codes = (event: Event) => event.issues.map((issue) => issue.code);

describe("brand switch of a recipe project with identity bindings", () => {
  it("blocks the final after a switch, clears after an edit and undoes with pixel reuse", async () => {
    const a = await writeProfile("brand-a", brandA, "#FF5500");
    const b = await writeProfile("brand-b", brandB, "#00AA55");
    const project = join(await temp(), "project");
    expect((await cli("create", project, "--profile", a)).success).toBe(true);

    const recipeDir = join(project, "recipes", "frame-card");
    await cp(fixtureRecipe, recipeDir, { recursive: true });
    const manifest = JSON.parse(
      await readFile(join(recipeDir, "recipe.json"), "utf8"),
    );
    manifest.bindings = [
      { param: "/brand/name", field: "brand.name" },
      { param: "/brand/cta/label", field: "brand.cta.label" },
      { param: "/brand/cta/url", field: "brand.cta.url" },
      { param: "/colors/rule", field: "render.palette.accent" },
    ];
    await writeFile(join(recipeDir, "recipe.json"), JSON.stringify(manifest));
    const photo = png(200, 300);
    await writeFile(join(project, "assets", "photo.png"), photo);
    await writeFile(
      join(project, "assets", "manifest.json"),
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
      await readFile(join(project, "naraframe.json"), "utf8"),
    );
    await writeFile(
      join(project, "naraframe.json"),
      JSON.stringify({
        ...config,
        audioMode: "silent",
        recipes: [{ id: "frame-card", path: "recipes/frame-card" }],
      }),
    );
    await writeFile(
      join(project, "scenes.json"),
      JSON.stringify(scenes(identity(brandA, "#FF5500"))),
    );
    expect(
      (
        await cli(
          "recipe",
          "trust",
          project,
          "--recipe",
          "frame-card",
          "--authorized-by",
          "Owner",
        )
      ).success,
    ).toBe(true);

    // A: identity matches the pinned profile; the report shows coverage.
    const ready = await cli("validate", project, "--stage", "production");
    expect(ready.success).toBe(true);
    expect((ready.data.brand as { recipes: unknown[] }).recipes).toEqual([
      expect.objectContaining({
        sceneId: "card",
        recipe: "frame-card",
        declared: 4,
        unchecked: ["/title"],
        bindings: expect.arrayContaining([
          expect.objectContaining({ param: "/brand/name", matches: true }),
        ]),
      }),
    ]);
    const first = await cli("preview", project);
    expect(first.success).toBe(true);
    // Reported once, although the production checks compile the source again.
    expect(
      codes(first).filter((code) => code === "RECIPE_BINDING_COVERAGE"),
    ).toHaveLength(1);
    const exported = await cli(
      "render",
      project,
      "--approve-preview",
      first.buildId ?? "",
    );
    expect(exported.success).toBe(true);
    const pointer = join(project, "output", "current.json");
    const pointerBefore = await readFile(pointer, "utf8");
    const buildsBefore = await readdir(join(project, "output", "builds"));

    // B: the dry-run lists every bound param and changes nothing.
    const scenesBefore = await readFile(join(project, "scenes.json"), "utf8");
    const dry = await cli("profile", "apply", b, project, "--dry-run");
    expect(dry.success).toBe(true);
    const plan = dry.data.plan as {
      bindings: {
        recipeParams: Array<{ param: string; state: string; target: string }>;
      };
    };
    expect(
      plan.bindings.recipeParams.map((entry) => [
        entry.param,
        entry.state,
        entry.target,
      ]),
    ).toEqual([
      ["/brand/name", "changes", "Brand B"],
      ["/brand/cta/label", "changes", "Start with Brand B"],
      ["/brand/cta/url", "changes", "brand-b.example"],
      ["/colors/rule", "changes", "#00AA55"],
    ]);
    expect(await readFile(join(project, "scenes.json"), "utf8")).toBe(
      scenesBefore,
    );

    expect((await cli("profile", "apply", b, project)).success).toBe(true);
    const blocked = await cli("validate", project, "--stage", "production");
    expect(blocked.success).toBe(false);
    expect(
      codes(blocked).filter((code) => code === "RECIPE_BINDING_MISMATCH"),
    ).toHaveLength(4);
    const refused = await cli(
      "render",
      project,
      "--approve-preview",
      first.buildId ?? "",
    );
    expect(refused.success).toBe(false);
    expect(codes(refused)).toContain("RECIPE_BINDING_MISMATCH");
    expect(await readFile(pointer, "utf8")).toBe(pointerBefore);
    expect(await readdir(join(project, "output", "builds"))).toEqual(
      buildsBefore,
    );

    // C: one targeted identity edit makes it ready again.
    const staging = join(await temp(), "staging");
    await mkdir(staging, { recursive: true });
    await writeFile(
      join(staging, "scenes.json"),
      JSON.stringify(scenes(identity(brandB, "#00aa55"))),
    );
    const status = await cli("status", project);
    const edited = await cli(
      "edit",
      project,
      "--from",
      staging,
      "--expect",
      status.sourceRevision ?? "",
      "--summary",
      "Identity params for brand B",
    );
    expect(edited.success).toBe(true);
    expect(
      (await cli("validate", project, "--stage", "production")).success,
    ).toBe(true);
    const second = await cli("preview", project);
    expect(second.success).toBe(true);
    expect(second.data.reusedFromBuildId).toBeNull();

    // D: undo the edit (blocked again), then the switch (original pixels).
    expect((await cli("undo", project)).success).toBe(true);
    expect(
      codes(await cli("validate", project, "--stage", "production")),
    ).toContain("RECIPE_BINDING_MISMATCH");
    expect((await cli("undo", project)).success).toBe(true);
    expect(await readFile(join(project, "scenes.json"), "utf8")).toBe(
      scenesBefore,
    );
    const back = await cli("preview", project);
    expect(back.success).toBe(true);
    expect(back.data.reusedFromBuildId).toBe(first.buildId);
    const stale = await cli(
      "render",
      project,
      "--approve-preview",
      second.buildId ?? "",
    );
    expect(stale.success).toBe(false);
    expect(codes(stale)).toContain("APPROVAL_PREVIEW_STALE");
    expect(await readFile(pointer, "utf8")).toBe(pointerBefore);
  });
});
