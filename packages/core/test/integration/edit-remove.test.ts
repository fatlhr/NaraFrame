import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  editProject,
  loadPlanProject,
  readRevisionState,
  syncWorkingCopy,
  undoProject,
  withProjectLock,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = new URL(
  "../../../../samples/krakatau-narrated",
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

const exists = async (path: string): Promise<boolean> =>
  stat(path).then(
    () => true,
    () => false,
  );

/** A voiced project; `captions` adds a captions.json next to the narration. */
const makeProject = async (captions?: object): Promise<string> => {
  const root = await tmp("naraframe-remove-");
  for (const entry of [
    "naraframe.json",
    "profile.lock.json",
    "scenes.json",
    "narration.json",
    "assets",
    "audio",
  ]) {
    await cp(join(sampleRoot, entry), join(root, entry), { recursive: true });
  }
  if (captions) {
    await writeFile(join(root, "captions.json"), JSON.stringify(captions));
  }
  return root;
};

const sync = async (root: string): Promise<string> => {
  const result = await withProjectLock(root, () => syncWorkingCopy(root));
  if (!result.ok)
    throw new Error(`sync failed: ${result.issues.map((i) => i.code)}`);
  return result.value.revisionId;
};

/** A staging directory holding only naraframe.json with a declared audioMode. */
const stageAudioMode = async (
  root: string,
  audioMode: "silent" | "voice",
): Promise<string> => {
  const project = JSON.parse(
    await readFile(join(root, "naraframe.json"), "utf8"),
  );
  project.audioMode = audioMode;
  const staging = await tmp("naraframe-stage-");
  await writeFile(
    join(staging, "naraframe.json"),
    JSON.stringify(project, null, 2),
  );
  return staging;
};

const NO_CAPTIONS = { schemaVersion: 1, corrections: [], mode: "none" };

describe("editProject removals", () => {
  it("applies a removal-only edit and records the file's absence in the snapshot", async () => {
    const root = await makeProject(NO_CAPTIONS);
    const base = await sync(root);

    const result = await editProject({
      root,
      remove: ["captions.json"],
      expect: base,
      summary: "Drop captions",
    });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.files).toEqual([]);
    expect(result.value.removed).toEqual(["captions.json"]);
    expect(await exists(join(root, "captions.json"))).toBe(false);
    expect(await exists(join(root, "narration.json"))).toBe(true);

    const meta = JSON.parse(
      await readFile(
        join(root, "revisions", result.value.revisionId, "revision.json"),
        "utf8",
      ),
    );
    expect(meta.kind).toBe("edit");
    expect(meta.sources.map((file: { path: string }) => file.path)).toEqual([
      "naraframe.json",
      "profile.lock.json",
      "scenes.json",
      "assets/manifest.json",
      "narration.json",
    ]);
    expect(await readRevisionState(root)).toMatchObject({
      currentId: result.value.revisionId,
      parentId: base,
      summary: "Drop captions",
    });
  });

  it("accepts an empty staging directory when a file is removed", async () => {
    const root = await makeProject(NO_CAPTIONS);
    const base = await sync(root);
    const result = await editProject({
      root,
      from: await tmp("naraframe-stage-"),
      remove: ["captions.json"],
      expect: base,
      summary: "Drop captions",
    });
    expect(result.ok).toBe(true);
  });

  it("makes a voiced project silent in one revision: staged audio mode plus a removal", async () => {
    const root = await makeProject();
    const base = await sync(root);

    const result = await editProject({
      root,
      from: await stageAudioMode(root, "silent"),
      remove: ["narration.json"],
      expect: base,
      summary: "Make silent",
    });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.files).toEqual(["naraframe.json"]);
    expect(result.value.removed).toEqual(["narration.json"]);
    expect(await exists(join(root, "narration.json"))).toBe(false);

    const loaded = await loadPlanProject(root);
    expect(loaded.ok, JSON.stringify(loaded)).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.source.narration).toBeUndefined();
      expect(loaded.value.source.project.audioMode).toBe("silent");
    }
  });

  it("undo restores narration.json byte for byte, and the same edit yields the same revision id", async () => {
    const root = await makeProject();
    const original = await readFile(join(root, "narration.json"));
    const base = await sync(root);
    const silent = () =>
      stageAudioMode(root, "silent").then((from) =>
        editProject({
          root,
          from,
          remove: ["narration.json"],
          expect: base,
          summary: "Make silent",
        }),
      );

    const first = await silent();
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const undone = await undoProject({ root });
    expect(undone.ok, JSON.stringify(undone)).toBe(true);
    if (!undone.ok) return;
    expect(undone.value.revisionId).toBe(base);
    expect(await readFile(join(root, "narration.json"))).toEqual(original);
    expect((await loadPlanProject(root)).ok).toBe(true);
    expect(
      JSON.parse(await readFile(join(root, "naraframe.json"), "utf8"))
        .audioMode,
    ).toBeUndefined();

    const again = await silent();
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.value.revisionId).toBe(first.value.revisionId);
  });

  it("refuses a required source file and changes nothing", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const before = await readFile(join(root, "scenes.json"));
    for (const path of [
      "scenes.json",
      "naraframe.json",
      "profile.lock.json",
      "assets/manifest.json",
      "audio/block-a.mp3",
    ]) {
      const result = await editProject({
        root,
        remove: [path],
        expect: base,
        summary: "x",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues[0]?.code).toBe("REMOVE_NOT_ALLOWED");
        expect(result.issues[0]?.message).toContain(path);
      }
    }
    expect(await readFile(join(root, "scenes.json"))).toEqual(before);
    expect((await readRevisionState(root)).currentId).toBe(base);
  });

  it("refuses a file the project does not have", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const result = await editProject({
      root,
      remove: ["captions.json"],
      expect: base,
      summary: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe("REMOVE_TARGET_ABSENT");
    }
    expect((await readRevisionState(root)).currentId).toBe(base);
  });

  it("refuses a file that is both staged and removed", async () => {
    const root = await makeProject(NO_CAPTIONS);
    const base = await sync(root);
    const staging = await tmp("naraframe-stage-");
    await cp(join(root, "captions.json"), join(staging, "captions.json"));
    const result = await editProject({
      root,
      from: staging,
      remove: ["captions.json"],
      expect: base,
      summary: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("REMOVE_AND_STAGED");
  });

  it("validates the removal before touching the working copy", async () => {
    // Selected captions point at narration phrases, so dropping the narration
    // alone leaves captions that cannot resolve.
    const root = await makeProject({
      schemaVersion: 1,
      corrections: [],
      mode: "selected",
      selections: [{ blockId: "opening", phraseId: "opening-p2" }],
    });
    const base = await sync(root);
    const narration = await readFile(join(root, "narration.json"));

    const result = await editProject({
      root,
      from: await stageAudioMode(root, "silent"),
      remove: ["narration.json"],
      expect: base,
      summary: "Make silent",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.code)).toContain(
      "STAGED_SOURCE_INVALID",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "CAPTION_SELECTION_TARGET_UNKNOWN",
    );
    expect(await readFile(join(root, "narration.json"))).toEqual(narration);
    expect((await readRevisionState(root)).currentId).toBe(base);
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);

    // Removing the captions in the same edit makes it valid.
    const both = await editProject({
      root,
      from: await stageAudioMode(root, "silent"),
      remove: ["captions.json", "narration.json"],
      expect: base,
      summary: "Make silent",
    });
    expect(both.ok, JSON.stringify(both)).toBe(true);
  });

  it("keeps rejecting an edit that stages and removes nothing", async () => {
    const root = await makeProject();
    const base = await sync(root);
    const neither = await editProject({ root, expect: base, summary: "x" });
    expect(neither.ok).toBe(false);
    if (!neither.ok) expect(neither.issues[0]?.code).toBe("STAGING_EMPTY");

    const empty = await editProject({
      root,
      from: await tmp("naraframe-stage-"),
      remove: [],
      expect: base,
      summary: "x",
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.issues[0]?.code).toBe("STAGING_EMPTY");
  });

  it("still reports a stale revision before looking at removals", async () => {
    const root = await makeProject(NO_CAPTIONS);
    await sync(root);
    const result = await editProject({
      root,
      remove: ["captions.json"],
      expect: "f".repeat(64),
      summary: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("REVISION_CONFLICT");
    expect(await exists(join(root, "captions.json"))).toBe(true);
  });
});
