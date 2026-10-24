import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  editProject,
  readRevisionState,
  syncWorkingCopy,
  undoProject,
  withProjectLock,
  writePreviewSelection,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = new URL(
  "../../../../samples/krakatau-draft",
  import.meta.url,
).pathname;

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

const tmp = async (prefix: string): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};

const makeProject = async (): Promise<string> => {
  const root = await tmp("naraframe-rev-");
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

const sync = async (root: string) => {
  const result = await withProjectLock(root, () => syncWorkingCopy(root));
  if (!result.ok)
    throw new Error(`sync failed: ${result.issues.map((i) => i.code)}`);
  return result.value;
};

const readScenes = async (root: string) =>
  JSON.parse(await readFile(join(root, "scenes.json"), "utf8"));

const stage = async (root: string, text: string): Promise<string> => {
  const scenes = await readScenes(root);
  scenes.scenes[0].visual.text = text;
  const staging = await tmp("naraframe-stage-");
  await writeFile(
    join(staging, "scenes.json"),
    JSON.stringify(scenes, null, 2),
  );
  return staging;
};

const hookText = async (root: string): Promise<string> =>
  (await readScenes(root)).scenes[0].visual.text;

const editText = async (root: string, expect: string, text: string) =>
  editProject({
    root,
    from: await stage(root, text),
    expect,
    summary: `Set text to ${text}`,
  });

describe("working copy sync", () => {
  it("baselines an untracked project, then reports clean", async () => {
    const root = await makeProject();
    const first = await sync(root);
    expect(first.status).toBe("baseline");
    expect(await sync(root)).toEqual({
      status: "clean",
      revisionId: first.revisionId,
    });
    const state = await readRevisionState(root);
    expect(state).toMatchObject({
      currentId: first.revisionId,
      parentId: null,
      kind: "baseline",
    });
  });

  it("captures a valid direct edit as a child revision", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const scenes = await readScenes(root);
    scenes.scenes[0].visual.text = "Diedit langsung.";
    await writeFile(join(root, "scenes.json"), JSON.stringify(scenes, null, 2));
    const captured = await sync(root);
    expect(captured.status).toBe("captured");
    expect(await readRevisionState(root)).toMatchObject({
      currentId: captured.revisionId,
      parentId: base.revisionId,
      kind: "manual-capture",
    });
  });

  it("does not capture an invalid working copy and leaves history unchanged", async () => {
    const root = await makeProject();
    const base = await sync(root);
    await writeFile(join(root, "scenes.json"), "{ broken");
    const result = await withProjectLock(root, () => syncWorkingCopy(root));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("WORKING_COPY_INVALID");
    expect((await readRevisionState(root)).currentId).toBe(base.revisionId);
  });

  it("switches back to an existing revision when the files match older content", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const edited = await editText(root, base.revisionId, "Versi dua");
    expect(edited.ok).toBe(true);
    await cp(join(sampleRoot, "scenes.json"), join(root, "scenes.json"));
    expect(await sync(root)).toEqual({
      status: "switched",
      revisionId: base.revisionId,
    });
  });
});

describe("editProject", () => {
  it("writes an immutable snapshot, updates the working copy, and records the summary", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const result = await editText(root, base.revisionId, "Teks baru.");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.parentId).toBe(base.revisionId);
    expect(result.value.files).toEqual(["scenes.json"]);
    expect(await hookText(root)).toBe("Teks baru.");
    expect(await readRevisionState(root)).toMatchObject({
      currentId: result.value.revisionId,
      parentId: base.revisionId,
      summary: "Set text to Teks baru.",
      kind: "edit",
    });
    const meta = JSON.parse(
      await readFile(
        join(root, "revisions", base.revisionId, "revision.json"),
        "utf8",
      ),
    );
    expect(meta.kind).toBe("baseline");
  });

  it("returns REVISION_CONFLICT for a stale expected revision and writes nothing", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const first = await editText(root, base.revisionId, "Satu");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const stale = await editText(root, base.revisionId, "Dua");
    expect(stale.ok).toBe(false);
    if (stale.ok) return;
    expect(stale.issues[0]?.code).toBe("REVISION_CONFLICT");
    expect(await hookText(root)).toBe("Satu");
    expect((await readRevisionState(root)).currentId).toBe(
      first.value.revisionId,
    );
  });

  it("captures direct edits first, so an expectation from before them conflicts", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const scenes = await readScenes(root);
    scenes.scenes[0].visual.text = "Diedit langsung.";
    await writeFile(join(root, "scenes.json"), JSON.stringify(scenes, null, 2));
    const result = await editText(root, base.revisionId, "Lewat staging");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("REVISION_CONFLICT");
    expect(result.issues[0]?.message).toContain(
      "direct edits were just captured",
    );
    expect(await hookText(root)).toBe("Diedit langsung.");
  });

  it("rejects an invalid staged source without changing the project or leaving attempts behind", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const staging = await tmp("naraframe-stage-");
    await writeFile(
      join(staging, "scenes.json"),
      JSON.stringify({ schemaVersion: 1, scenes: [{ id: "x" }] }),
    );
    const result = await editProject({
      root,
      from: staging,
      expect: base.revisionId,
      summary: "bad",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toContain("STAGED_SOURCE_INVALID");
    expect((await readScenes(root)).scenes.length).toBeGreaterThan(1);
    expect((await readRevisionState(root)).currentId).toBe(base.revisionId);
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
  });

  it("rejects unsafe, missing, and empty staging", async () => {
    const root = await makeProject();
    const base = await sync(root);

    const unsafe = await tmp("naraframe-stage-");
    await cp(join(sampleRoot, "scenes.json"), join(unsafe, "scenes.json"));
    await mkdir(join(unsafe, "revisions"), { recursive: true });
    await writeFile(join(unsafe, "revisions", "current.json"), "{}");
    const unsafeResult = await editProject({
      root,
      from: unsafe,
      expect: base.revisionId,
      summary: "x",
    });
    expect(unsafeResult.ok).toBe(false);
    if (!unsafeResult.ok)
      expect(unsafeResult.issues[0]?.code).toBe("STAGING_PATH_UNSAFE");

    const missing = await editProject({
      root,
      from: join(root, "nope"),
      expect: base.revisionId,
      summary: "x",
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues[0]?.code).toBe("STAGING_MISSING");

    const empty = await tmp("naraframe-stage-");
    const emptyResult = await editProject({
      root,
      from: empty,
      expect: base.revisionId,
      summary: "x",
    });
    expect(emptyResult.ok).toBe(false);
    if (!emptyResult.ok)
      expect(emptyResult.issues[0]?.code).toBe("STAGING_EMPTY");
  });

  it("reports EDIT_NO_CHANGE when the staged files equal the current source", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const staging = await tmp("naraframe-stage-");
    await cp(join(root, "scenes.json"), join(staging, "scenes.json"));
    const result = await editProject({
      root,
      from: staging,
      expect: base.revisionId,
      summary: "same",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("EDIT_NO_CHANGE");
  });

  it("does not corrupt live media when staging overwrites a hard-linked file", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const before = await readFile(join(root, "assets", "krakatau-map.png"));
    const staging = await tmp("naraframe-stage-");
    await mkdir(join(staging, "assets"), { recursive: true });
    await writeFile(
      join(staging, "assets", "krakatau-map.png"),
      "different bytes",
    );
    const result = await editProject({
      root,
      from: staging,
      expect: base.revisionId,
      summary: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues.map((i) => i.code)).toContain("ASSET_HASH_MISMATCH");
    expect(await readFile(join(root, "assets", "krakatau-map.png"))).toEqual(
      before,
    );
    expect((await readRevisionState(root)).currentId).toBe(base.revisionId);
  });
});

describe("undoProject", () => {
  it("restores the previous accepted source, then reports nothing left to undo", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const original = await hookText(root);
    const edited = await editText(root, base.revisionId, "Ganti");
    expect(edited.ok).toBe(true);

    const undone = await undoProject({ root });
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;
    expect(undone.value.revisionId).toBe(base.revisionId);
    expect(await hookText(root)).toBe(original);

    const again = await undoProject({ root });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.issues[0]?.code).toBe("NOTHING_TO_UNDO");
  });

  it("preserves an invalid working copy before restoring over it", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const edited = await editText(root, base.revisionId, "Ganti");
    expect(edited.ok).toBe(true);
    await writeFile(join(root, "scenes.json"), "{ broken");
    const undone = await undoProject({ root });
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;
    expect(undone.value.preservedInvalidCopy).not.toBeNull();
    expect(
      await readFile(
        join(undone.value.preservedInvalidCopy ?? "", "scenes.json"),
        "utf8",
      ),
    ).toBe("{ broken");
    expect((await readScenes(root)).scenes.length).toBeGreaterThan(1);
  });

  it("restores durable media that was deleted after the snapshot", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const edited = await editText(root, base.revisionId, "Ganti");
    expect(edited.ok).toBe(true);
    const media = join(root, "assets", "krakatau-map.png");
    const bytes = await readFile(media);
    await rm(media);
    const undone = await undoProject({ root });
    expect(undone.ok).toBe(true);
    expect(await readFile(media)).toEqual(bytes);
  });

  it("never touches production.json, so receipts and spend survive edits and undo", async () => {
    const root = await makeProject();
    const ledger = JSON.stringify({
      schemaVersion: 1,
      budget: { amount: 100, currency: "IDR" },
      receipts: [],
    });
    await writeFile(join(root, "production.json"), ledger);
    const base = await sync(root);
    const edited = await editText(root, base.revisionId, "Ganti");
    expect(edited.ok).toBe(true);
    await undoProject({ root });
    expect(await readFile(join(root, "production.json"), "utf8")).toBe(ledger);
  });

  it("keeps a preview selection attached to its revision across an undo", async () => {
    const root = await makeProject();
    const base = await sync(root);
    await writePreviewSelection(root, base.revisionId, "build-one");
    const edited = await editText(root, base.revisionId, "Ganti");
    expect(edited.ok).toBe(true);
    expect((await readRevisionState(root)).previewSelection).toBeNull();
    await undoProject({ root });
    expect((await readRevisionState(root)).previewSelection?.buildId).toBe(
      "build-one",
    );
  });
});

describe("project lock", () => {
  it("refuses a second writer while a live process holds the lock", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const staging = await stage(root, "Ganti");
    const outcome = await withProjectLock(root, async () => ({
      ok: true as const,
      value: await editProject({
        root,
        from: staging,
        expect: base.revisionId,
        summary: "x",
      }),
      issues: [],
    }));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.ok).toBe(false);
    if (!outcome.value.ok)
      expect(outcome.value.issues[0]?.code).toBe("PROJECT_LOCKED");
  });

  it("takes over a lock left by a process that no longer exists", async () => {
    const root = await makeProject();
    await sync(root);
    await writeFile(
      join(root, ".naraframe", "lock"),
      JSON.stringify({ pid: 2 ** 22 - 1 }),
    );
    const result = await withProjectLock(root, async () => ({
      ok: true as const,
      value: "ran",
      issues: [],
    }));
    expect(result.ok).toBe(true);
    await expect(stat(join(root, ".naraframe", "lock"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  // Regression: a holder creates the lock file before it writes its pid, so a
  // second writer can see an empty lock. Treating that as stale let two
  // writers in at once and lost one of several concurrent trust appends.
  it("waits for a lock whose owner is still writing it", async () => {
    const root = await makeProject();
    await sync(root);
    const lock = join(root, ".naraframe", "lock");
    await writeFile(lock, "");
    let ran = false;
    const result = await withProjectLock(
      root,
      async () => {
        ran = true;
        return { ok: true as const, value: "ran", issues: [] };
      },
      { waitMs: 100 },
    );
    expect(ran).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues.map((issue) => issue.code)).toEqual([
        "PROJECT_LOCKED",
      ]);
    expect(await readFile(lock, "utf8")).toBe("");
  });

  it("takes over an unreadable lock once it is too old to be mid-write", async () => {
    const root = await makeProject();
    await sync(root);
    const lock = join(root, ".naraframe", "lock");
    await writeFile(lock, "");
    const past = new Date(Date.now() - 60_000);
    await utimes(lock, past, past);
    const result = await withProjectLock(root, async () => ({
      ok: true as const,
      value: "ran",
      issues: [],
    }));
    expect(result.ok).toBe(true);
    await expect(stat(lock)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
