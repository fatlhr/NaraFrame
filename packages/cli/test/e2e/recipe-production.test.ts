import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  cardParams,
  makeRecipeProject,
} from "../../../core/test/integration/recipe-fixture.js";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
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
  issues: Array<{ code: string; severity: string }>;
}

const cli = async (...args: string[]): Promise<Event> => {
  const { stdout } = await run(
    process.execPath,
    [cliEntry, ...args, "--json"],
    { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  ).catch((error: { stdout?: string }) => ({ stdout: error.stdout ?? "{}" }));
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as Event;
};

describe("trusted recipe through the production CLI", () => {
  it("previews, exports, revises and undoes a recipe project", async () => {
    const project = await makeRecipeProject(undefined, {
      track: (root) => roots.push(root),
    });

    const refused = await cli("preview", project, "--draft");
    expect(refused.success).toBe(false);
    expect(refused.issues.map((issue) => issue.code)).toContain(
      "RECIPE_NOT_TRUSTED",
    );

    const trusted = await cli(
      "recipe",
      "trust",
      project,
      "--recipe",
      "frame-card",
      "--authorized-by",
      "Owner",
    );
    expect(trusted.success).toBe(true);

    const preview = await cli("preview", project);
    expect(preview.success).toBe(true);
    const final = await cli(
      "render",
      project,
      "--approve-preview",
      preview.buildId ?? "",
    );
    expect(final.success).toBe(true);
    expect(final.data).toMatchObject({
      width: 1080,
      height: 1920,
      durationInFrames: 30,
      audio: "none",
    });
    const { stdout } = await run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,width,height,nb_frames",
      "-of",
      "json",
      final.artifacts.finalMp4 ?? "",
    ]);
    expect(JSON.parse(stdout).streams).toEqual([
      expect.objectContaining({
        codec_type: "video",
        width: 1080,
        height: 1920,
        nb_frames: "30",
      }),
    ]);
    await run("ffmpeg", [
      "-v",
      "error",
      "-xerror",
      "-i",
      final.artifacts.finalMp4 ?? "",
      "-f",
      "null",
      "-",
    ]);

    // A params edit through the public edit route makes new pixels.
    const staging = await mkdtemp(join(tmpdir(), "naraframe-recipe-stage-"));
    roots.push(staging);
    const scenes = JSON.parse(
      await readFile(join(project, "scenes.json"), "utf8"),
    );
    scenes.scenes[0].visual.params = cardParams({ title: "Revised title" });
    await mkdir(staging, { recursive: true });
    await writeFile(join(staging, "scenes.json"), JSON.stringify(scenes));
    const edited = await cli(
      "edit",
      project,
      "--from",
      staging,
      "--expect",
      preview.sourceRevision ?? "",
      "--summary",
      "Revise the card title",
    );
    expect(edited.success).toBe(true);
    const revised = await cli("preview", project);
    expect(revised.success).toBe(true);
    expect(revised.data.reusedFromBuildId).toBeNull();
    const stale = await cli(
      "render",
      project,
      "--approve-preview",
      preview.buildId ?? "",
    );
    expect(stale.issues.map((issue) => issue.code)).toContain(
      "APPROVAL_PREVIEW_STALE",
    );

    // Undo restores the previous snapshot, whose pixels are reused.
    expect((await cli("undo", project)).success).toBe(true);
    const restored = await cli("preview", project);
    expect(restored.success).toBe(true);
    expect(restored.data.reusedFromBuildId).toBe(preview.buildId);
  }, 900_000);

  it("runs only listed, trusted bytes even when an unlisted sibling would resolve first", async () => {
    const project = await makeRecipeProject(undefined, {
      track: (root) => roots.push(root),
    });
    const recipeDir = join(project, "recipes", "frame-card");
    const index = join(recipeDir, "index.tsx");
    await writeFile(
      index,
      `import { label } from "./label";\n${(await readFile(index, "utf8")).replace("{title}", "{label}")}`,
    );
    await writeFile(
      join(recipeDir, "label.tsx"),
      'export const label = "listed label";\n',
    );
    // A resolver prefers .ts over .tsx; this file is not listed or trusted.
    await writeFile(
      join(recipeDir, "label.ts"),
      'throw new Error("unlisted module executed");\nexport const label = "";\n',
    );
    const manifest = JSON.parse(
      await readFile(join(recipeDir, "recipe.json"), "utf8"),
    );
    manifest.files = [...manifest.files, "label.tsx"];
    await writeFile(join(recipeDir, "recipe.json"), JSON.stringify(manifest));
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
    const preview = await cli("preview", project, "--draft");
    expect(preview.success, JSON.stringify(preview.issues)).toBe(true);
  }, 900_000);
});
