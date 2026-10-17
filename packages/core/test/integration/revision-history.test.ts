import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  editProject,
  readRevisionHistory,
  syncWorkingCopy,
  undoProject,
  withProjectLock,
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
  const root = await tmp("naraframe-history-");
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

const edit = async (root: string, expect: string, text: string) => {
  const scenes = JSON.parse(await readFile(join(root, "scenes.json"), "utf8"));
  scenes.scenes[0].visual.text = text;
  const staging = await tmp("naraframe-history-stage-");
  await mkdir(staging, { recursive: true });
  await writeFile(join(staging, "scenes.json"), JSON.stringify(scenes));
  const result = await editProject({
    root,
    from: staging,
    expect,
    summary: `Set text to ${text}`,
  });
  if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
  return result.value.revisionId;
};

describe("revision history", () => {
  it("lists the current chain newest first through edit, edit, undo, edit", async () => {
    const root = await makeProject();
    const synced = await withProjectLock(root, () => syncWorkingCopy(root));
    if (!synced.ok) throw new Error("sync failed");
    const baseline = synced.value.revisionId;
    const one = await edit(root, baseline, "Satu");
    const two = await edit(root, one, "Dua");
    expect((await undoProject({ root })).ok).toBe(true);
    const three = await edit(root, one, "Tiga");

    const history = await readRevisionHistory({ root });
    if (!history.ok) throw new Error("history failed");
    // The undone revision (two) is no longer behind the project.
    expect(history.value.entries.map((entry) => entry.id)).toEqual([
      three,
      one,
      baseline,
    ]);
    expect(history.value).toMatchObject({ currentId: three, total: 3 });
    expect(history.value.entries.map((entry) => entry.current)).toEqual([
      true,
      false,
      false,
    ]);
    expect(history.value.entries.map((entry) => entry.kind)).toEqual([
      "edit",
      "edit",
      "baseline",
    ]);
    expect(history.value.entries[0]).toMatchObject({
      parentId: one,
      summary: "Set text to Tiga",
    });
    expect(history.value.entries[2]?.parentId).toBeNull();
    expect(two).not.toBe(three);
  });

  it("cuts the list at --limit but still reports the whole chain length", async () => {
    const root = await makeProject();
    const synced = await withProjectLock(root, () => syncWorkingCopy(root));
    if (!synced.ok) throw new Error("sync failed");
    const one = await edit(root, synced.value.revisionId, "Satu");
    const two = await edit(root, one, "Dua");
    const history = await readRevisionHistory({ root, limit: 2 });
    if (!history.ok) throw new Error("history failed");
    expect(history.value.entries.map((entry) => entry.id)).toEqual([two, one]);
    expect(history.value.total).toBe(3);
  });

  it("reads without writing: no lock, no capture of direct edits", async () => {
    const root = await makeProject();
    const synced = await withProjectLock(root, () => syncWorkingCopy(root));
    if (!synced.ok) throw new Error("sync failed");
    const scenes = JSON.parse(
      await readFile(join(root, "scenes.json"), "utf8"),
    );
    scenes.scenes[0].visual.text = "Diedit langsung.";
    await writeFile(join(root, "scenes.json"), JSON.stringify(scenes));
    const history = await readRevisionHistory({ root });
    if (!history.ok) throw new Error("history failed");
    expect(history.value.total).toBe(1);
    expect(history.value.currentId).toBe(synced.value.revisionId);
  });

  it("refuses a folder with no revision history", async () => {
    const root = await tmp("naraframe-history-empty-");
    const history = await readRevisionHistory({ root });
    expect(history.ok).toBe(false);
    expect(history.issues[0]?.code).toBe("REVISION_HISTORY_MISSING");
    const missing = await readRevisionHistory({ root: join(root, "nope") });
    expect(missing.issues[0]?.code).toBe("REVISION_HISTORY_MISSING");
  });
});
