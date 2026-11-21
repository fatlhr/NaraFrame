import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  compileDraft,
  createProject,
  editProject,
  loadPlanProject,
  SceneSchema,
  stageLibrary,
  undoProject,
} from "@naraframe/core";
import { afterEach, expect, it } from "vitest";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const catalog = resolve("library/characters/story-prop-contact/catalog.json");
const patterns = ["place-prop", "prop-braces", "let-them-in"];
const makeProject = async () => {
  const parent = await mkdtemp(join(tmpdir(), "naraframe-prop-contact-"));
  directories.push(parent);
  const root = join(parent, "episode");
  const result = await createProject({
    destination: root,
    projectId: "episode",
    title: "An open door",
    profileDirectory: resolve("profiles/story"),
    profileSource: { kind: "repository", identity: "profiles/story" },
  });
  expect(result.ok, JSON.stringify(result.issues)).toBe(true);
  return root;
};
const importShot = async (
  root: string,
  pattern: string,
  prop: string,
  pinned = false,
) => {
  const staged = await stageLibrary({
    root,
    ...(pinned
      ? {}
      : { from: catalog, pattern, version: "0.1.0", scene: pattern }),
    instance: pattern,
    params: { prop, note: "Hold the door for the kitten." },
  });
  expect(staged.ok, JSON.stringify(staged.issues)).toBe(true);
  if (!staged.ok) throw new Error("Cannot stage shot");
  directories.push(staged.value.staging);
  const edited = await editProject({
    root,
    from: staged.value.staging,
    expect: staged.value.sourceRevision,
    summary: "Import prop contact",
  });
  expect(edited.ok, JSON.stringify(edited.issues)).toBe(true);
};
const sourceAt = async (root: string) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
  return loaded.value.source;
};

it.each(["boot", "crate"])(
  "imports a complete editable story with %s and a real held reaction",
  async (prop) => {
    const root = await makeProject();
    const lock = await readFile(join(root, "profile.lock.json"));
    for (const pattern of patterns) await importShot(root, pattern, prop);
    const source = await sourceAt(root);
    const compiled = compileDraft(source);
    expect(compiled.ok, JSON.stringify(compiled.issues)).toBe(true);
    if (!compiled.ok) throw new Error("Cannot compile imported story");
    expect(compiled.value.totalFrames).toBe(330);
    expect(source.scenes.scenes).toHaveLength(3);
    for (const scene of source.scenes.scenes) {
      if (scene.visual.type !== "composition")
        throw new Error("Missing composition");
      const shoe = scene.visual.layers.find((layer) => layer.id === "shoe");
      expect(shoe?.type === "image" && shoe.assetId.endsWith(`-${prop}`)).toBe(
        true,
      );
    }
    const contact = compiled.value.scenes[1];
    if (!contact) throw new Error("Missing contact shot");
    const settle = contact.beats.find(
      (beat) => beat.id === "contact-prop-settle",
    );
    const reveal = contact.beats.find((beat) => beat.id === "kitten-appears");
    expect(
      settle &&
        reveal &&
        reveal.startFrame - settle.startFrame - settle.durationInFrames,
    ).toBe(5);
    expect(await readFile(join(root, "profile.lock.json"))).toEqual(lock);
  },
);

it("revises the prop through its pinned instance and undoes without changing the profile", async () => {
  const root = await makeProject();
  await importShot(root, "prop-braces", "boot");
  const before = await sourceAt(root);
  const lock = await readFile(join(root, "profile.lock.json"));
  await importShot(root, "prop-braces", "crate", true);
  expect((await sourceAt(root)).scenes).not.toEqual(before.scenes);
  const undo = await undoProject({ root });
  expect(undo.ok, JSON.stringify(undo.issues)).toBe(true);
  expect((await sourceAt(root)).scenes).toEqual(before.scenes);
  expect(await readFile(join(root, "profile.lock.json"))).toEqual(lock);
});

it("retimes contact and the held reaction without fractional source times or channel overlap", async () => {
  const { impactSettle } = await import(
    pathToFileURL(resolve("library/motion/impact-settle.mjs")).href
  );
  const root = await makeProject();
  await importShot(root, "prop-braces", "boot");
  const source = await sourceAt(root);
  const scene = source.scenes.scenes[0];
  if (!scene) throw new Error("Missing shot");
  const motion = impactSettle({
    prop: "shoe",
    obstacle: "door-leaf",
    prefix: "late",
    contactFrame: 29,
    holdFrames: 9,
  });
  const reveal = scene.beats.filter((beat) => beat.targetId === "kitten-ear");
  for (const beat of reveal)
    beat.startMs = Math.round((motion.revealFrame * 1000) / 30);
  scene.beats = [...motion.beats, ...reveal];
  expect(SceneSchema.safeParse(scene).success).toBe(true);
  const compiled = compileDraft(source);
  expect(compiled.ok, JSON.stringify(compiled.issues)).toBe(true);
  if (!compiled.ok) throw new Error("Cannot compile retimed contact");
  const beats = compiled.value.scenes[0]?.beats ?? [];
  expect(beats.find((beat) => beat.id === "late-compress")?.startFrame).toBe(
    29,
  );
  expect(beats.find((beat) => beat.id === "kitten-appears")?.startFrame).toBe(
    motion.settledFrame + 9,
  );
});
