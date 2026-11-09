import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  compileDraft,
  createProject,
  editProject,
  loadPlanProject,
  stageLibrary,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

type Point = [number, number];
type Upper = Record<string, number>;
interface RigModule {
  armsFor: (lean: number, target: Point, near?: boolean) => Upper;
  handPoint: (upper: Upper, near?: boolean) => Point;
  UPPERS: Record<string, Upper>;
}

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const temporary = async () => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-stickman-rig-"));
  dirs.push(dir);
  return dir;
};
const catalog = resolve("library/characters/stickman-ink/catalog.json");
const rigUrl = pathToFileURL(
  resolve("library/characters/stickman-ink/rig.mjs"),
).href;

const project = async (profileDirectory = resolve("profiles/stickman-ink")) => {
  const root = join(await temporary(), "episode");
  const created = await createProject({
    destination: root,
    projectId: "episode",
    title: "Episode",
    profileDirectory,
    profileSource: { kind: "repository", identity: "profiles/stickman-ink" },
  });
  expect(created.ok, JSON.stringify(created.issues)).toBe(true);
  return root;
};

const importPattern = async (
  root: string,
  pattern: string,
  version: string,
  scene: string,
) => {
  const staged = await stageLibrary({
    root,
    from: catalog,
    pattern,
    version,
    instance: scene,
    scene,
    params: { title: "One more pull", note: "Carry the grip." },
  });
  expect(staged.ok, JSON.stringify(staged.issues)).toBe(true);
  if (!staged.ok) throw new Error("stage");
  dirs.push(staged.value.staging);
  const edited = await editProject({
    root,
    from: staged.value.staging,
    expect: staged.value.sourceRevision,
    summary: `Import ${pattern}`,
  });
  expect(edited.ok, JSON.stringify(edited.issues)).toBe(true);
};

describe("Stickman Ink 0.2.0 jointed rig (S8)", () => {
  it("keeps a hand on a fixed point through a lean, by inverse kinematics", async () => {
    const rig = (await import(rigUrl)) as RigModule;
    const rope: Point = [160, 206];
    for (const lean of [9, 4, -11, -16]) {
      const arms = rig.armsFor(lean, rope);
      const [x, y] = rig.handPoint({ ...rig.UPPERS.pull, lean, ...arms });
      expect(Math.hypot(x - rope[0], y - rope[1])).toBeLessThan(0.5);
    }
  });

  it("stages ink-heave with its rig, face swaps and rope", async () => {
    const root = await project();
    await importPattern(root, "ink-heave", "0.2.0", "heave");
    const loaded = await loadPlanProject(root);
    if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
    const result = compileDraft(loaded.value.source);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
    const scene = result.value.scenes[0];
    const swap = scene?.beats.find((beat) => beat.action === "swap");
    expect(swap?.action === "swap" && swap.params.assetId).toBe(
      "heave-head-effort",
    );
    expect(
      scene?.beats.some(
        (beat) => beat.action === "draw" && beat.targetId === "rope",
      ),
    ).toBe(true);
    const groups = new Map(
      scene?.layers
        .filter((layer) => layer.type === "group")
        .map((layer) => [layer.id, layer]),
    );
    expect(groups.get("kid-upper")?.memberIds).toContain("kid-arm-n");
    expect(groups.get("kid-arm-n")?.memberIds).toContain("kid-fore-n");
    expect(groups.get("kid-head")?.memberIds).toContain("kid-face");
  });

  it("keeps a pinned 0.1.0 project and its patterns working", async () => {
    const legacy = join(await temporary(), "stickman-ink");
    await cp(resolve("profiles/stickman-ink"), legacy, { recursive: true });
    const profile = JSON.parse(
      await readFile(join(legacy, "profile.json"), "utf8"),
    );
    await writeFile(
      join(legacy, "profile.json"),
      JSON.stringify({ ...profile, version: "0.1.0" }, null, 2),
    );
    const root = await project(legacy);
    const lock = await readFile(join(root, "profile.lock.json"));
    await importPattern(root, "ink-grip-pull", "0.1.0", "grip-shot");
    expect(await readFile(join(root, "profile.lock.json"))).toEqual(lock);
    const loaded = await loadPlanProject(root);
    if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
    expect(compileDraft(loaded.value.source).ok).toBe(true);
  });
});
