import { execFileSync } from "node:child_process";
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../../../", import.meta.url));
// Keep packing on the pinned development runtime; exercise installed consumer
// commands on an explicitly supplied minimum-runtime binary when requested.
const consumerNode = process.env.NARAFRAME_TEST_NODE22 ?? process.execPath;
let scratch: string;
let engine: string;
let executable: string;
const invoke = (...args: string[]) =>
  JSON.parse(
    execFileSync(consumerNode, [executable, ...args, "--json"], {
      cwd: scratch,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    }),
  );

beforeAll(async () => {
  if (process.env.NARAFRAME_TEST_NODE22) {
    expect(
      execFileSync(consumerNode, ["--version"], { encoding: "utf8" }).trim(),
    ).toMatch(/^v22\./);
  }
  scratch = await mkdtemp(join(tmpdir(), "naraframe-consumer test-"));
  let artifact = process.env.NARAFRAME_PACK_TEST_ARTIFACT;
  if (!artifact) {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          join(repository, "scripts/pack-engine.mjs"),
          "--out",
          join(scratch, "packed"),
        ],
        { cwd: scratch, encoding: "utf8", timeout: 120_000 },
      ),
    );
    artifact = result.artifact;
  }
  execFileSync(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(scratch, "empty-cache"),
      "--prefix",
      scratch,
      artifact as string,
    ],
    { cwd: scratch, encoding: "utf8", timeout: 120_000 },
  );
  engine = await realpath(join(scratch, "node_modules/naraframe-engine"));
  executable = join(scratch, "node_modules/.bin/naraframe");
}, 120_000);

afterAll(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true });
});

describe("offline engine distribution", () => {
  it("runs the npm executable symlink outside the checkout with explicit engine/API identity", () => {
    const event = invoke("version");
    expect(event).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "version",
      success: true,
      data: {
        version: "0.3.0",
        skillApiVersion: 1,
        sourceSchemaVersion: 1,
        renderEngine: "naraframe-draft/14",
        resourceRoot: engine,
      },
    });
    expect(engine).not.toContain(repository);
  });

  it("exports installed schema and bundled profile without source paths", () => {
    expect(invoke("schema").data.schemas.ProjectConfig).toBeDefined();
    expect(invoke("profile", "inspect", "current-issues").data.profile.id).toBe(
      "current-issues",
    );
  });
  it("lists the installed built-in profiles and validates a neutral starter", async () => {
    const listed = invoke("profile", "list").data.profiles as Array<{
      id: string;
      path: string;
    }>;
    expect(listed.map((profile) => profile.id)).toEqual([
      "bedah-25d",
      "current-issues",
      "general-explainer",
      "mechanics-bench",
      "motion-comic",
      "paper-cutout",
      "stickman-ink",
      "story",
    ]);
    for (const profile of listed)
      expect(profile.path).toBe(join(engine, "profiles", profile.id));
    expect(invoke("profile", "inspect", "general-explainer").success).toBe(
      true,
    );
    const project = join(scratch, "one-off video");
    expect(
      invoke(
        "create",
        project,
        "--profile",
        "general-explainer",
        "--template",
        "starter",
      ).success,
    ).toBe(true);
    expect(invoke("validate", project, "--stage", "plan").success).toBe(true);
    const scenes = JSON.parse(
      await readFile(join(project, "scenes.json"), "utf8"),
    );
    expect(scenes.scenes).toHaveLength(3);
  });

  it("ships the two Bedah 2.5D patterns with their SVG dependencies", () => {
    const catalog = join(engine, "library/characters/bedah-25d/catalog.json");
    const result = invoke("library", "inspect", catalog);
    expect(result.success).toBe(true);
    expect(result.data.catalog).toMatchObject({
      id: "bedah-25d",
      version: "0.1.0",
      patterns: [{ id: "tape-dispenser" }, { id: "flashlight" }],
    });
  });

  it("ships both Motion Comic stories with three manual crops per page", () => {
    const catalog = join(
      engine,
      "library/characters/motion-comic/catalog.json",
    );
    const result = invoke("library", "inspect", catalog);
    expect(result.success).toBe(true);
    expect(result.data.catalog).toMatchObject({
      id: "motion-comic",
      version: "0.1.0",
      patterns: [{ id: "cookie-decoy" }, { id: "squeaky-sneaker" }],
    });
    for (const pattern of result.data.catalog.patterns) {
      expect(pattern.template.visual.layers).toEqual(
        expect.arrayContaining(
          [12, 252, 492].map((y, index) =>
            expect.objectContaining({
              id: `panel-${index + 1}`,
              assetId: pattern.id,
              crop: expect.objectContaining({ y }),
            }),
          ),
        ),
      );
    }
  });

  it("ships the Story shot pairs, their carried props and the 0.2.0 rig patterns", () => {
    const catalog = join(engine, "library/characters/story/catalog.json");
    const result = invoke("library", "inspect", catalog);
    expect(result.success).toBe(true);
    expect(result.data.catalog).toMatchObject({
      id: "story",
      version: "0.2.0",
      patterns: [
        { id: "note-gust", version: "0.1.0" },
        { id: "note-catch", version: "0.1.0" },
        { id: "puddle-stop", version: "0.1.0" },
        { id: "puddle-cross", version: "0.1.0" },
        { id: "phone-glow", version: "0.2.0" },
        { id: "porch-light", version: "0.2.0" },
      ],
      assets: expect.arrayContaining([
        expect.objectContaining({ id: "wind-note" }),
        expect.objectContaining({ id: "gift" }),
        expect.objectContaining({ id: "runner-step" }),
        expect.objectContaining({ id: "screen-lit" }),
        expect.objectContaining({ id: "lamp-on" }),
      ]),
    });
  });

  it("ships the plain-brief cause-and-effect and collage patterns", () => {
    const result = invoke(
      "library",
      "inspect",
      join(engine, "library/explainers/catalog.json"),
    );
    expect(result.success).toBe(true);
    expect(result.data.catalog).toMatchObject({
      id: "general-explainer-patterns",
      version: "0.1.0",
      patterns: [{ id: "sealed-straw" }, { id: "hidden-key" }],
    });
  });

  it("resolves the original mechanics profile for installed 0.2.0 skills", () => {
    expect(invoke("profile", "inspect", "meja-mekanik").data.profile.id).toBe(
      "meja-mekanik",
    );
  });
  it("binds runtime/resources independently of version and refuses extra version arguments", async () => {
    const before = invoke("version").data.engineIdentity;
    expect(before).toMatch(/^[0-9a-f]{64}$/);
    const file = join(engine, "skills/naraframe/installation.md");
    const bytes = await readFile(file);
    try {
      await writeFile(
        file,
        Buffer.concat([bytes, Buffer.from("\nLocal change.\n")]),
      );
      const changed = invoke("version");
      expect(changed.data.version).toBe("0.3.0");
      expect(changed.data.engineIdentity).not.toBe(before);
    } finally {
      await writeFile(file, bytes);
    }
    expect(invoke("version").data.engineIdentity).toBe(before);
    try {
      invoke("version", "extra");
      throw new Error("Unexpected version success");
    } catch (error) {
      expect(error).toMatchObject({ status: 3 });
      expect(JSON.parse((error as { stdout: string }).stdout)).toMatchObject({
        command: "version",
        success: false,
      });
    }
  });

  it("creates and stages the installed neutral library from a project path containing spaces", () => {
    const project = join(scratch, "episode with spaces");
    expect(
      invoke("create", project, "--profile", "current-issues").success,
    ).toBe(true);
    const catalog = join(engine, "library/starter/catalog.json");
    expect(invoke("library", "inspect", catalog).success).toBe(true);
    const event = invoke(
      "library",
      "stage",
      project,
      "--from",
      catalog,
      "--pattern",
      "path-note",
      "--version",
      "1.0.0",
      "--scene",
      "neutral-path",
      "--instance",
      "neutral-path",
      "--params",
      join(engine, "starter/params.json"),
    );
    expect(event.success).toBe(true);
    expect(event.data.receipt.sceneId).toBe("neutral-path");
    expect(event.data.receipt.recipes).toEqual([]);
  });

  it("ships a supported editable silent demo without preview or approval", async () => {
    const demo = join(scratch, "copied demo");
    await cp(join(engine, "starter/demo"), demo, { recursive: true });
    expect(invoke("validate", demo, "--stage", "plan").success).toBe(true);
    expect(
      JSON.parse(await readFile(join(demo, "naraframe.json"), "utf8"))
        .audioMode,
    ).toBe("silent");
  });

  it("captures real packages, pinned dependencies and rights while excluding private development roots", async () => {
    const packageJson = JSON.parse(
      await readFile(join(engine, "package.json"), "utf8"),
    );
    // Vendors third-party packages, so it names the files instead of claiming MIT.
    expect(packageJson.license).toBe("SEE LICENSE IN LICENSE");
    expect(packageJson.private).toBe(true);
    expect(await readFile(join(engine, "LICENSE"), "utf8")).toBe(
      await readFile(join(repository, "LICENSE"), "utf8"),
    );
    expect(
      await readFile(join(engine, "THIRD-PARTY-NOTICES.md"), "utf8"),
    ).toContain("remotion.pro/license");
    expect(packageJson.dependencies["@naraframe/core"]).toBe("0.0.0");
    expect(packageJson.dependencies.remotion).toBe("4.0.521");
    expect(JSON.stringify(packageJson)).not.toContain("workspace:");
    const rights = JSON.parse(
      await readFile(join(engine, "distribution-rights.json"), "utf8"),
    );
    expect(rights.status).toBe("local-candidate-only");
    expect(rights.code).toContain("MIT");
    expect(rights.code).not.toContain("UNLICENSED");
    expect(rights.packages.length).toBeGreaterThan(0);
    expect(rights.resources).toContainEqual(
      expect.stringMatching(
        /^profiles\/general-explainer: .*system font names/,
      ),
    );
    const entries = await readdir(engine);
    for (const excluded of [
      "work",
      "samples",
      "test-fixtures",
      ".pnpm-store",
      ".git",
      ".env",
    ])
      expect(entries).not.toContain(excluded);
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.isSymbolicLink())
          expect(
            (await realpath(join(directory, entry.name))).startsWith(
              `${engine}/`,
            ),
          ).toBe(true);
        if (entry.isDirectory()) await walk(join(directory, entry.name));
      }
    };
    await walk(engine);
  });
});
