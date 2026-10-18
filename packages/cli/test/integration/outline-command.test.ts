import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const roots: string[] = [];

interface Event {
  command: string;
  status: string;
  success: boolean;
  readiness: string;
  sourceRevision: string | null;
  issues: Array<{ code: string; message: string }>;
  data: Record<string, unknown>;
}

const run = async (
  ...args: string[]
): Promise<{ exitCode: number; event: Event }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(String(value));
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitCode = await runCli([...args, "--json"]);
  vi.restoreAllMocks();
  return { exitCode, event: JSON.parse(writes.at(-1) ?? "{}") as Event };
};

const tempRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-outline-"));
  roots.push(root);
  return root;
};

const copySample = async (): Promise<string> => {
  const project = join(await tempRoot(), "project");
  await mkdir(project);
  for (const entry of [
    "naraframe.json",
    "profile.lock.json",
    "scenes.json",
    "assets",
  ])
    await cp(join(sampleRoot, entry), join(project, entry), {
      recursive: true,
    });
  return project;
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("outline command", () => {
  it("reports ids, timing and the current revision of a valid project without writing anything", async () => {
    const project = await copySample();
    const before = await readFile(join(project, "scenes.json"), "utf8");

    const outline = await run("outline", project);
    const validate = await run("validate", project, "--stage", "plan");

    expect(outline.exitCode).toBe(0);
    expect(outline.event).toMatchObject({
      command: "outline",
      success: true,
      readiness: "draft-only",
      sourceRevision: validate.event.sourceRevision,
    });
    const data = outline.event.data.outline as {
      project: { currentRevision: string; sceneCount: number };
      scenes: Array<{
        id: string;
        role: string;
        durationMs: number;
        layers?: unknown[];
        beats: unknown[];
      }>;
    };
    expect(data.project.currentRevision).toBe(validate.event.sourceRevision);
    expect(data.project.sceneCount).toBe(data.scenes.length);
    expect(data.scenes.length).toBeGreaterThan(0);
    expect(data.scenes[0]).toMatchObject({
      id: expect.any(String),
      role: expect.any(String),
      durationMs: expect.any(Number),
      beats: expect.any(Array),
    });
    expect(await readFile(join(project, "scenes.json"), "utf8")).toBe(before);
  });

  it("prints one project line and one line per scene", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line: string) => {
      lines.push(line);
    });
    const exitCode = await runCli(["outline", sampleRoot]);
    vi.restoreAllMocks();

    const scenes = (
      JSON.parse(await readFile(join(sampleRoot, "scenes.json"), "utf8")) as {
        scenes: unknown[];
      }
    ).scenes;
    expect(exitCode).toBe(0);
    expect(lines).toHaveLength(1 + scenes.length);
    expect(lines[0]).toMatch(/\d+ scene\(s\), [\d.]+s, revision [a-f0-9]{12}$/);
    expect(lines[1]).toMatch(/^ 1\. \S+ \[\S+\] [\d.]+s, \w/);
  });

  it("narrows to one scene with --scene and keeps its full detail", async () => {
    const full = await run("outline", sampleRoot);
    const fullOutline = full.event.data.outline as {
      scenes: Array<{ id: string; layers?: unknown[]; beats: unknown[] }>;
    };
    const target = fullOutline.scenes.at(-1);
    if (!target) throw new Error("sample has scenes");

    const scoped = await run("outline", sampleRoot, "--scene", target.id);

    expect(scoped.exitCode).toBe(0);
    expect(scoped.event).toMatchObject({
      command: "outline",
      success: true,
      scope: { type: "scene", sceneId: target.id },
      sourceRevision: full.event.sourceRevision,
    });
    const outline = scoped.event.data.outline as typeof fullOutline & {
      project: unknown;
    };
    expect(outline.scenes).toEqual([target]);
    expect(outline.project).toEqual(
      (full.event.data.outline as { project: unknown }).project,
    );
  });

  it("prints the project line, the scene line, then its layers and beats with --scene", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line: string) => {
      lines.push(line);
    });
    const exitCode = await runCli([
      "outline",
      sampleRoot,
      "--scene",
      "context",
    ]);
    vi.restoreAllMocks();

    expect(exitCode).toBe(0);
    expect(lines[0]).toMatch(/revision [a-f0-9]{12}$/);
    expect(lines[1]).toMatch(/^ \d+\. context \[/);
    expect(
      lines.slice(2).every((line) => /^ {4}(layer|beat) \S+ \S+/.test(line)),
    ).toBe(true);
    expect(
      lines.some((line) => /^ {4}beat \S+ \w+ \S+ \d+\+\d+$/.test(line)),
    ).toBe(true);
  });

  it("fails an unknown --scene with SCENE_NOT_FOUND and exit 1", async () => {
    const result = await run("outline", sampleRoot, "--scene", "not-a-scene");

    expect(result.exitCode).toBe(1);
    expect(result.event).toMatchObject({
      status: "failed",
      success: false,
      data: {},
      issues: [expect.objectContaining({ code: "SCENE_NOT_FOUND" })],
    });
    expect((await run("outline", sampleRoot, "--scene")).exitCode).toBe(3);
  });

  it("fails an invalid project with its structured issues and exit 1", async () => {
    const project = await copySample();
    await writeFile(join(project, "scenes.json"), "{ not json");

    const result = await run("outline", project);

    expect(result.exitCode).toBe(1);
    expect(result.event).toMatchObject({
      command: "outline",
      status: "failed",
      success: false,
      readiness: "invalid",
      data: {},
    });
    expect(result.event.issues).toEqual([
      expect.objectContaining({ code: "SOURCE_JSON_INVALID" }),
    ]);
  });

  it("fails a folder that is not a project", async () => {
    const result = await run("outline", await tempRoot());
    expect(result.exitCode).toBe(1);
    expect(result.event.issues[0]?.code).toBe("SOURCE_MISSING");
  });

  it("rejects extra arguments and unknown options with a usage error", async () => {
    expect((await run("outline", sampleRoot, "extra")).exitCode).toBe(3);
    expect((await run("outline", sampleRoot, "--stage", "plan")).exitCode).toBe(
      3,
    );
  });
});

describe("create --template", () => {
  it.each(["general-explainer", "current-issues"])(
    "creates a valid starter project for %s",
    async (profile) => {
      const destination = join(await tempRoot(), "starter");

      const created = await run(
        "create",
        destination,
        "--profile",
        profile,
        "--template",
        "starter",
      );
      expect(created.exitCode).toBe(0);
      expect(created.event).toMatchObject({
        command: "create",
        success: true,
        data: { projectRoot: destination, template: "starter" },
      });

      const validated = await run("validate", destination, "--stage", "plan");
      expect(validated.exitCode).toBe(0);
      expect(
        validated.event.issues.filter(
          (issue) => issue.code !== "CLAIMS_UNLABELLED",
        ),
      ).toEqual([]);

      const outline = await run("outline", destination);
      const scenes = (
        outline.event.data.outline as {
          scenes: Array<{ role: string }>;
          project: { totalDurationMs: number };
        }
      ).scenes;
      expect(scenes.map((scene) => scene.role)).toEqual([
        "hook",
        "explanation",
        "payoff",
      ]);
    },
  );

  it("keeps an empty scene list without --template", async () => {
    const destination = join(await tempRoot(), "empty");
    const created = await run(
      "create",
      destination,
      "--profile",
      "general-explainer",
    );
    expect(created.exitCode).toBe(0);
    expect(created.event.data).not.toHaveProperty("template");
    expect(
      JSON.parse(await readFile(join(destination, "scenes.json"), "utf8")),
    ).toEqual({ schemaVersion: 1, scenes: [] });
  });

  it("names the supported templates when the value is unknown or missing", async () => {
    const destination = join(await tempRoot(), "never");
    const unknown = await run(
      "create",
      destination,
      "--profile",
      "general-explainer",
      "--template",
      "blank",
    );
    expect(unknown.exitCode).toBe(3);
    expect(unknown.event.issues).toEqual([
      expect.objectContaining({
        code: "CLI_USAGE",
        message: expect.stringContaining("Supported templates: starter"),
      }),
    ]);

    const missing = await run(
      "create",
      destination,
      "--profile",
      "general-explainer",
      "--template",
    );
    expect(missing.exitCode).toBe(3);
    expect(missing.event.issues[0]?.message).toContain(
      "Supported templates: starter",
    );
  });
});
