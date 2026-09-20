import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const roots: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

interface Event {
  status: string;
  success: boolean;
  issues: Array<{ code: string }>;
  data: {
    dryRun: boolean;
    removed: Array<{ path: string; bytes: number; reason: string }>;
    keptBuilds: Array<{ buildId: string; reason: string }>;
    reclaimedBytes: number;
  };
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

const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

/** A project tree holding everything cache clean must keep and everything it may remove. */
const makeProject = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-cache-"));
  roots.push(root);
  const file = (path: string, content = "x") =>
    mkdir(join(root, path, ".."), { recursive: true }).then(() =>
      writeFile(join(root, path), content),
    );

  await file("naraframe.json", "{}");
  await file("scenes.json", "{}");
  await file("assets/map.png", "png");
  await file("audio/narration/a.mp3", "audio");
  await file("production.json", '{"receipts":[]}');
  for (const id of ["current", "selected", "approved", "stale-1", "stale-2"]) {
    await file(`preview/builds/${id}/preview.mp4`, id.repeat(10));
  }
  await file("preview/current.json", JSON.stringify({ buildId: "current" }));
  await file("revisions/objects/abc", "blob");
  await file("revisions/current.json", "{}");
  await file(
    "revisions/selection/rev1.json",
    JSON.stringify({ buildId: "selected" }),
  );
  await file(
    "revisions/approvals/rev1.json",
    JSON.stringify({
      schemaVersion: 1,
      approvals: [{ previewBuildId: "approved" }, { previewBuildId: null }],
    }),
  );
  await file("output/builds/final-1/final.mp4", "final");
  await file("output/current.json", "{}");
  await file(".naraframe/attempts/junk/partial.mp4", "partial");
  await file(".naraframe/compiled.json", "{}");
  return root;
};

describe("cache clean", () => {
  it("removes only disposable computed artifacts and keeps everything that matters", async () => {
    const root = await makeProject();
    const { exitCode, event } = await run("cache", "clean", root);
    expect(exitCode).toBe(0);
    expect(event.data.dryRun).toBe(false);
    expect(event.data.removed.map((entry) => entry.path).sort()).toEqual([
      ".naraframe/attempts/junk",
      ".naraframe/compiled.json",
      "preview/builds/stale-1",
      "preview/builds/stale-2",
    ]);
    expect(event.data.reclaimedBytes).toBeGreaterThan(0);
    expect(
      event.data.keptBuilds
        .map((build) => [build.buildId, build.reason])
        .sort(),
    ).toEqual([
      ["approved", "reviewed for an approval"],
      ["current", "current preview"],
      ["selected", "selected for a revision"],
    ]);

    // Survivors: source, media, receipts, history, selected builds, exports.
    for (const path of [
      "naraframe.json",
      "scenes.json",
      "assets/map.png",
      "audio/narration/a.mp3",
      "production.json",
      "revisions/objects/abc",
      "revisions/current.json",
      "revisions/selection/rev1.json",
      "revisions/approvals/rev1.json",
      "preview/builds/current/preview.mp4",
      "preview/builds/selected/preview.mp4",
      "preview/builds/approved/preview.mp4",
      "preview/current.json",
      "output/builds/final-1/final.mp4",
      "output/current.json",
    ]) {
      expect(await exists(join(root, path)), path).toBe(true);
    }
    // Gone: the disposable items.
    for (const path of [
      "preview/builds/stale-1",
      "preview/builds/stale-2",
      ".naraframe/attempts/junk",
      ".naraframe/compiled.json",
    ]) {
      expect(await exists(join(root, path)), path).toBe(false);
    }
  });

  it("--dry-run reports the same list but removes nothing", async () => {
    const root = await makeProject();
    const dry = await run("cache", "clean", root, "--dry-run");
    expect(dry.event.data.dryRun).toBe(true);
    expect(dry.event.data.removed.length).toBe(4);
    expect(await exists(join(root, "preview/builds/stale-1"))).toBe(true);
    expect(await exists(join(root, ".naraframe/attempts/junk"))).toBe(true);
    const real = await run("cache", "clean", root);
    expect(real.event.data.removed.map((e) => e.path).sort()).toEqual(
      dry.event.data.removed.map((e) => e.path).sort(),
    );
  });

  it("is a no-op on a second run and on a project with nothing to clean", async () => {
    const root = await makeProject();
    await run("cache", "clean", root);
    const again = await run("cache", "clean", root);
    expect(again.event.data.removed).toEqual([]);
    const bare = await mkdtemp(join(tmpdir(), "naraframe-cache-bare-"));
    roots.push(bare);
    const empty = await run("cache", "clean", bare);
    expect(empty.exitCode).toBe(0);
    expect(empty.event.data.removed).toEqual([]);
  });

  it("does not follow a symlinked builds directory out of the project", async () => {
    const root = await makeProject();
    const outside = await mkdtemp(join(tmpdir(), "naraframe-outside-"));
    roots.push(outside);
    await mkdir(join(outside, "stale-x"), { recursive: true });
    await writeFile(join(outside, "stale-x", "keep.txt"), "must survive");
    await rm(join(root, "preview", "builds"), { recursive: true, force: true });
    await symlink(outside, join(root, "preview", "builds"));
    const { exitCode } = await run("cache", "clean", root);
    expect(exitCode).toBe(0);
    expect(await readdir(join(outside, "stale-x"))).toEqual(["keep.txt"]);
  });

  it("refuses to run while another operation holds the project lock", async () => {
    const root = await makeProject();
    await mkdir(join(root, ".naraframe"), { recursive: true });
    await writeFile(
      join(root, ".naraframe", "lock"),
      JSON.stringify({ pid: process.pid }),
    );
    const blocked = await run("cache", "clean", root);
    expect(blocked.exitCode).toBe(1);
    expect(blocked.event.issues[0]?.code).toBe("PROJECT_LOCKED");
    expect(await exists(join(root, "preview/builds/stale-1"))).toBe(true);
  });

  it("rejects incorrect usage with exit code 3", async () => {
    const root = await makeProject();
    expect((await run("cache")).exitCode).toBe(3);
    expect((await run("cache", "purge", root)).exitCode).toBe(3);
    expect((await run("cache", "clean", root, "extra")).exitCode).toBe(3);
  });
});
