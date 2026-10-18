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
let scratch: string;
let engine: string;
let executable: string;
const invoke = (...args: string[]) =>
  JSON.parse(
    execFileSync(process.execPath, [executable, ...args, "--json"], {
      cwd: scratch,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    }),
  );

beforeAll(async () => {
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
        version: "0.1.0",
        skillApiVersion: 1,
        sourceSchemaVersion: 1,
        renderEngine: "naraframe-draft/13",
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
  it("lists the installed built-in profiles and creates a project from the neutral one", () => {
    const listed = invoke("profile", "list").data.profiles as Array<{
      id: string;
      path: string;
    }>;
    expect(listed.map((profile) => profile.id)).toEqual([
      "current-issues",
      "general-explainer",
    ]);
    for (const profile of listed)
      expect(profile.path).toBe(join(engine, "profiles", profile.id));
    expect(invoke("profile", "inspect", "general-explainer").success).toBe(
      true,
    );
    const project = join(scratch, "one-off video");
    expect(
      invoke("create", project, "--profile", "general-explainer").success,
    ).toBe(true);
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
      expect(changed.data.version).toBe("0.1.0");
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
