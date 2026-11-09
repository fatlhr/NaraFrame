import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  compileDraft,
  createProject,
  editProject,
  loadPlanProject,
  stageLibrary,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const temporary = async () => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-story-rig-"));
  dirs.push(dir);
  return dir;
};

const catalog = resolve("library/characters/story/catalog.json");
const colors = {
  skin: "#C98B62",
  hair: "#292D41",
  shirt: "#BC6049",
  pants: "#3F5A73",
};

const project = async (profileDirectory = resolve("profiles/story")) => {
  const root = join(await temporary(), "episode");
  const created = await createProject({
    destination: root,
    projectId: "episode",
    title: "Episode",
    profileDirectory,
    profileSource: { kind: "repository", identity: "profiles/story" },
  });
  expect(created.ok, JSON.stringify(created.issues)).toBe(true);
  return root;
};

const importPattern = async (
  root: string,
  pattern: string,
  version: string,
  instance: string,
  params: Record<string, unknown>,
) => {
  const staged = await stageLibrary({
    root,
    from: catalog,
    pattern,
    version,
    instance,
    scene: instance,
    params,
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

const compiled = async (root: string) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
  const result = compileDraft(loaded.value.source);
  if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
  return { draft: result.value, source: loaded.value.source };
};

describe("Story 0.2.0 faceless rig (S6)", () => {
  it("stages phone-glow with its rig, swap and repeated breath", async () => {
    const root = await project();
    await importPattern(root, "phone-glow", "0.2.0", "msg", {
      sender: "Dad",
      message: "I'm outside.",
      ...colors,
    });
    const { draft } = await compiled(root);
    const scene = draft.scenes[0];
    const swap = scene?.beats.find((beat) => beat.action === "swap");
    // The swap's pose is rebound to the instance like every layer asset.
    expect(swap?.action === "swap" && swap.params.assetId).toBe(
      "msg-screen-lit",
    );
    expect(
      scene?.beats
        .filter((beat) => beat.id.startsWith("breath"))
        .map((beat) => beat.id),
    ).toEqual(["breath", "breath-2"]);
    // Nested joints: the forearm sits inside the arm, inside the upper body,
    // inside the figure.
    const groups = new Map(
      scene?.layers
        .filter((layer) => layer.type === "group")
        .map((layer) => [layer.id, layer]),
    );
    expect(groups.get("kid")?.memberIds).toContain("kid-upper");
    expect(groups.get("kid-upper")?.memberIds).toContain("kid-arm-n");
    expect(groups.get("kid-arm-n")?.memberIds).toContain("kid-fore-n");
    expect(groups.get("kid-fore-n")?.memberIds).toEqual(
      expect.arrayContaining(["kid-hand-n", "kid-phone", "kid-screen"]),
    );
  });

  it("recolours the figure through parameters without new artwork", async () => {
    const fills = async (shirt: string) => {
      const root = await project();
      await importPattern(root, "porch-light", "0.2.0", "porch", {
        ...colors,
        shirt,
      });
      const { source } = await compiled(root);
      const layers =
        source.scenes.scenes[0]?.visual.type === "composition"
          ? source.scenes.scenes[0].visual.layers
          : [];
      const fill = (id: string) => {
        const layer = layers.find((item) => item.id === id);
        return layer && "fill" in layer ? layer.fill : undefined;
      };
      return {
        torso: fill("kid-torso"),
        sleeve: fill("kid-upperarm-n"),
        assets: source.assets.assets.map((asset) => asset.sha256).sort(),
      };
    };
    const red = await fills("#BC6049");
    const green = await fills("#4F7A5A");
    expect([red.torso, red.sleeve]).toEqual(["#BC6049", "#BC6049"]);
    expect([green.torso, green.sleeve]).toEqual(["#4F7A5A", "#4F7A5A"]);
    expect(green.assets).toEqual(red.assets);
  });

  it("refuses a new import whose scene id matches a pattern layer", async () => {
    const root = await project();
    const staged = await stageLibrary({
      root,
      from: catalog,
      pattern: "porch-light",
      version: "0.2.0",
      instance: "porch",
      scene: "kid",
      params: colors,
    });
    expect(staged.ok).toBe(false);
    if (!staged.ok)
      expect(staged.issues.map((issue) => issue.code)).toContain(
        "LIBRARY_SCENE_ID_CONFLICT",
      );
  });

  it("keeps a pinned 0.1.0 project and its patterns working", async () => {
    // A profile folder as it was at 0.1.0, before the rig paragraph.
    const legacy = join(await temporary(), "story");
    await cp(resolve("profiles/story"), legacy, { recursive: true });
    const profile = JSON.parse(
      await readFile(join(legacy, "profile.json"), "utf8"),
    );
    await writeFile(
      join(legacy, "profile.json"),
      JSON.stringify({ ...profile, version: "0.1.0" }, null, 2),
    );
    const root = await project(legacy);
    const lock = await readFile(join(root, "profile.lock.json"));
    // Not "gust": note-gust has a layer with that id.
    await importPattern(root, "note-gust", "0.1.0", "gust-shot", {
      title: "The Windy Note",
      note: "Carry the reach into the catch.",
    });
    expect(await readFile(join(root, "profile.lock.json"))).toEqual(lock);
    const { draft } = await compiled(root);
    expect(draft.scenes.map((scene) => scene.id)).toEqual(["gust-shot"]);
  });
});
