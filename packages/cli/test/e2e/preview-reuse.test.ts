import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const sampleRoot = join(repositoryRoot, "samples", "krakatau-draft");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const temporaryRoots: string[] = [];

interface Event {
  success: boolean;
  sourceRevision: string | null;
  buildId: string | null;
  artifacts: Record<string, string>;
  data: Record<string, unknown>;
}

const cli = async (project: string, ...args: string[]): Promise<Event> => {
  const { stdout } = await run(
    process.execPath,
    [cliEntry, ...args, project, "--json"],
    {
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  const lines = stdout.trim().split("\n").filter(Boolean);
  expect(lines).toHaveLength(1);
  return JSON.parse(lines[0] ?? "{}") as Event;
};

const hash = async (path: string) =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("preview pixel reuse", () => {
  it("reuses an earlier build's pixels after an editorial-only change, with a new source revision and no re-render", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-reuse-"));
    temporaryRoots.push(root);
    const project = join(root, "krakatau-draft");
    await cp(sampleRoot, project, {
      recursive: true,
      filter: (source) =>
        !/[\\/](preview|revisions|\.naraframe|audio)([\\/]|$)/.test(source),
    });

    const first = await cli(project, "preview", "--draft");
    expect(first.success).toBe(true);
    expect(first.data.reusedFromBuildId).toBeNull();
    const firstVideo = first.artifacts.previewMp4 ?? "";

    // An editorial note: it changes the source revision but cannot change a pixel.
    const scenesPath = join(project, "scenes.json");
    const scenes = JSON.parse(await readFile(scenesPath, "utf8"));
    scenes.scenes[0].note = "Cek ulang tahun letusan dengan sumber terbaru.";
    await writeFile(scenesPath, `${JSON.stringify(scenes, null, 2)}\n`);

    const started = Date.now();
    const second = await cli(project, "preview", "--draft");
    const seconds = (Date.now() - started) / 1000;
    expect(second.success).toBe(true);
    expect(second.data.reusedFromBuildId).toBe(first.buildId);
    expect(second.buildId).not.toBe(first.buildId);
    expect(second.sourceRevision).not.toBe(first.sourceRevision);
    expect(await hash(second.artifacts.previewMp4 ?? "")).toBe(
      await hash(firstVideo),
    );
    // Reuse links files; a real render of this project takes tens of seconds.
    expect(seconds).toBeLessThan(15);

    // The new build is a complete, current preview of the new source.
    const status = await cli(project, "status");
    expect(status.buildId).toBe(second.buildId);
    expect(status.data.previewState).toBe("current");
  });
});
