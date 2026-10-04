import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeRecipeProject } from "../../../core/test/integration/recipe-fixture.js";

const roots: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const project = () =>
  makeRecipeProject(undefined, { track: (root) => roots.push(root) });

const run = async (...args: string[]) => {
  const lines: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    lines.push(String(value));
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitCode = await runCli([...args, "--json"]);
  vi.restoreAllMocks();
  return {
    exitCode,
    event: JSON.parse(lines.at(-1) ?? "{}") as {
      status: string;
      readiness: string;
      buildId: string | null;
      data: Record<string, unknown>;
      issues: Array<{ code: string; severity: string }>;
    },
  };
};

const errors = (event: { issues: Array<{ code: string; severity: string }> }) =>
  event.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);

describe("recipe trust", () => {
  it("refuses every preview and production check of untrusted code before rendering", async () => {
    const root = await project();
    for (const args of [["--draft"], [], ["--draft", "--resolution", "1080"]]) {
      const { exitCode, event } = await run("preview", root, ...args);
      expect(exitCode, args.join(" ")).toBe(1);
      expect(event.buildId).toBeNull();
      expect(errors(event)).toEqual(["RECIPE_NOT_TRUSTED"]);
    }
    expect(existsSync(join(root, "preview", "builds"))).toBe(false);
    const validated = await run("validate", root, "--stage", "production");
    expect(errors(validated.event)).toEqual(["RECIPE_NOT_TRUSTED"]);
    const rendered = await run(
      "render",
      root,
      "--autonomous",
      "--authorized-by",
      "Owner",
    );
    expect(errors(rendered.event)).toEqual(["RECIPE_NOT_TRUSTED"]);
  });

  it("records the owner's trust for the current code hash only", async () => {
    const root = await project();
    const usage = await run("recipe", "trust", root, "--recipe", "frame-card");
    expect(usage.exitCode).toBe(3);
    const unknown = await run(
      "recipe",
      "trust",
      root,
      "--recipe",
      "missing",
      "--authorized-by",
      "Owner",
    );
    expect(errors(unknown.event)).toEqual(["RECIPE_UNKNOWN"]);

    const trusted = await run(
      "recipe",
      "trust",
      root,
      "--recipe",
      "frame-card",
      "--authorized-by",
      "Owner",
    );
    expect(trusted.exitCode).toBe(0);
    const trust = trusted.event.data.trust as { codeSha256: string };
    const validated = await run("validate", root, "--stage", "production");
    expect(errors(validated.event)).toEqual([]);

    const index = join(root, "recipes", "frame-card", "index.tsx");
    await writeFile(index, `${await readFile(index, "utf8")}\n// changed\n`);
    const changed = await run("validate", root, "--stage", "production");
    expect(errors(changed.event)).toEqual(["RECIPE_NOT_TRUSTED"]);
    const log = JSON.parse(
      await readFile(join(root, "revisions", "recipe-trust.json"), "utf8"),
    );
    expect(
      log.trusted.map((entry: { codeSha256: string }) => entry.codeSha256),
    ).toEqual([trust.codeSha256]);
  });
});
