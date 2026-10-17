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
  sourceRevision: string | null;
  issues: Array<{ code: string }>;
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

const makeProject = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-rev-cli-"));
  roots.push(root);
  for (const entry of [
    "naraframe.json",
    "profile.lock.json",
    "scenes.json",
    "assets",
  ]) {
    await cp(join(sampleRoot, entry), join(root, entry), { recursive: true });
  }
  return root;
};

const narratedRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-narrated", import.meta.url),
);

/** A voiced project with an optional captions file beside the narration. */
const makeVoicedProject = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-rev-voiced-"));
  roots.push(root);
  for (const entry of [
    "naraframe.json",
    "profile.lock.json",
    "scenes.json",
    "narration.json",
    "assets",
    "audio",
  ]) {
    await cp(join(narratedRoot, entry), join(root, entry), { recursive: true });
  }
  await writeFile(
    join(root, "captions.json"),
    JSON.stringify({ schemaVersion: 1, corrections: [], mode: "none" }),
  );
  return root;
};

const stageSilent = async (root: string): Promise<string> => {
  const project = JSON.parse(
    await readFile(join(root, "naraframe.json"), "utf8"),
  );
  project.audioMode = "silent";
  const staging = join(
    root,
    "..",
    `silent-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(staging, { recursive: true });
  roots.push(staging);
  await writeFile(join(staging, "naraframe.json"), JSON.stringify(project));
  return staging;
};

const stageText = async (root: string, text: string): Promise<string> => {
  const scenes = JSON.parse(await readFile(join(root, "scenes.json"), "utf8"));
  scenes.scenes[0].visual.text = text;
  const staging = join(
    root,
    "..",
    `stage-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(staging, { recursive: true });
  roots.push(staging);
  await writeFile(
    join(staging, "scenes.json"),
    JSON.stringify(scenes, null, 2),
  );
  return staging;
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("status revision state", () => {
  it("reports an untracked project without writing anything", async () => {
    const root = await makeProject();
    const { event } = await run("status", root);
    expect((event.data.revision as { state: string }).state).toBe("untracked");
    await expect(
      readFile(join(root, "revisions", "current.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe("edit and undo commands", () => {
  it("applies an edit, reports the new source revision, and undoes it", async () => {
    const root = await makeProject();
    const before = (await run("status", root)).event.sourceRevision as string;

    const edited = await run(
      "edit",
      root,
      "--from",
      await stageText(root, "Lewat CLI"),
      "--expect",
      before,
      "--summary",
      "CLI edit",
    );
    expect(edited.exitCode).toBe(0);
    expect(edited.event).toMatchObject({
      command: "edit",
      status: "completed",
      success: true,
    });
    expect(edited.event.sourceRevision).not.toBe(before);
    expect(edited.event.data).toMatchObject({
      parentRevision: before,
      files: ["scenes.json"],
    });

    const status = await run("status", root);
    expect(status.event.sourceRevision).toBe(edited.event.sourceRevision);
    expect(status.event.data.revision).toMatchObject({
      state: "in-sync",
      summary: "CLI edit",
      kind: "edit",
    });

    const undone = await run("undo", root);
    expect(undone.exitCode).toBe(0);
    expect(undone.event.sourceRevision).toBe(before);
    expect(undone.event.data.fromRevision).toBe(edited.event.sourceRevision);
    expect((await run("status", root)).event.sourceRevision).toBe(before);
  });

  it("returns REVISION_CONFLICT with exit code 1 for a stale expectation", async () => {
    const root = await makeProject();
    const before = (await run("status", root)).event.sourceRevision as string;
    const first = await run(
      "edit",
      root,
      "--from",
      await stageText(root, "Satu"),
      "--expect",
      before,
    );
    expect(first.exitCode).toBe(0);
    const stale = await run(
      "edit",
      root,
      "--from",
      await stageText(root, "Dua"),
      "--expect",
      before,
    );
    expect(stale.exitCode).toBe(1);
    expect(stale.event.status).toBe("failed");
    expect(stale.event.issues[0]?.code).toBe("REVISION_CONFLICT");
  });

  it("returns NOTHING_TO_UNDO at the first revision", async () => {
    const root = await makeProject();
    const before = (await run("status", root)).event.sourceRevision as string;
    await run(
      "edit",
      root,
      "--from",
      await stageText(root, "Satu"),
      "--expect",
      before,
    );
    expect((await run("undo", root)).exitCode).toBe(0);
    const again = await run("undo", root);
    expect(again.exitCode).toBe(1);
    expect(again.event.issues[0]?.code).toBe("NOTHING_TO_UNDO");
  });

  it("rejects incorrect usage with exit code 3", async () => {
    const root = await makeProject();
    expect((await run("edit", root)).exitCode).toBe(3);
    expect((await run("edit", root, "--from", root)).exitCode).toBe(3);
    expect((await run("undo")).exitCode).toBe(3);
  });

  it("makes a voiced project silent with --remove, reports the removal, and undoes it", async () => {
    const root = await makeVoicedProject();
    const before = (await run("status", root)).event.sourceRevision as string;
    const narration = await readFile(join(root, "narration.json"));

    const edited = await run(
      "edit",
      root,
      "--from",
      await stageSilent(root),
      "--remove",
      "narration.json",
      "--remove",
      "captions.json",
      "--expect",
      before,
      "--summary",
      "Make silent",
    );
    expect(edited.exitCode, JSON.stringify(edited.event.issues)).toBe(0);
    expect(edited.event.data).toMatchObject({
      parentRevision: before,
      files: ["naraframe.json"],
      removedFiles: ["captions.json", "narration.json"],
    });
    await expect(readFile(join(root, "narration.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const valid = await run("validate", root, "--stage", "plan");
    expect(valid.exitCode).toBe(0);

    const undone = await run("undo", root);
    expect(undone.event.sourceRevision).toBe(before);
    expect(await readFile(join(root, "narration.json"))).toEqual(narration);
  });

  it("accepts --remove without --from, and refuses required or absent files with exit code 1", async () => {
    const root = await makeVoicedProject();
    const before = (await run("status", root)).event.sourceRevision as string;

    const required = await run(
      "edit",
      root,
      "--remove",
      "scenes.json",
      "--expect",
      before,
    );
    expect(required.exitCode).toBe(1);
    expect(required.event.issues[0]?.code).toBe("REMOVE_NOT_ALLOWED");

    const removed = await run(
      "edit",
      root,
      "--remove",
      "captions.json",
      "--expect",
      before,
    );
    expect(removed.exitCode).toBe(0);
    expect(removed.event.data).toMatchObject({
      files: [],
      removedFiles: ["captions.json"],
    });

    const absent = await run(
      "edit",
      root,
      "--remove",
      "captions.json",
      "--expect",
      removed.event.sourceRevision as string,
    );
    expect(absent.exitCode).toBe(1);
    expect(absent.event.issues[0]?.code).toBe("REMOVE_TARGET_ABSENT");
  });

  it("rejects --remove usage mistakes with exit code 3", async () => {
    const root = await makeVoicedProject();
    const before = (await run("status", root)).event.sourceRevision as string;
    // No value, and no staging or removal at all.
    expect(
      (await run("edit", root, "--expect", before, "--remove")).exitCode,
    ).toBe(3);
    expect((await run("edit", root, "--expect", before)).exitCode).toBe(3);
    // --remove cannot replace --expect.
    expect(
      (await run("edit", root, "--remove", "captions.json")).exitCode,
    ).toBe(3);
  });
});
