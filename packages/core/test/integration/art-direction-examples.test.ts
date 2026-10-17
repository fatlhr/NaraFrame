import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  buildProfileLock,
  compileDraft,
  validatePlanSource,
} from "@naraframe/core";
import { expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

it("keeps the shipped six skill patterns valid and editable through the public source contract", async () => {
  const profileDirectory = fileURLToPath(
    new URL("../../../../profiles/current-issues", import.meta.url),
  );
  const profile = await buildProfileLock(profileDirectory, {
    kind: "repository",
    identity: "current-issues",
  });
  if (!profile.ok) throw Error(JSON.stringify(profile.issues));
  const scenes = JSON.parse(
    await readFile(
      new URL(
        "../../../../skills/naraframe/examples/art-direction/scenes.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const source = narratedSource();
  delete source.narration;
  source.project.profile = {
    id: profile.value.lock.id,
    version: profile.value.lock.version,
  };
  source.project.audioMode = "silent";
  source.profile = profile.value.lock;
  source.scenes = scenes;
  source.assets = { schemaVersion: 1, assets: [] };
  const validated = validatePlanSource(source);
  expect(validated.ok, JSON.stringify(validated.issues)).toBe(true);
  if (!validated.ok) return;
  expect(validated.value.scenes.scenes.map((scene) => scene.id)).toEqual([
    "object-explanation",
    "route-diagram",
    "data-comparison",
    "spatial-pullback",
    "headline-emphasis",
    "quiet-shot",
  ]);
  for (const scene of validated.value.scenes.scenes) {
    const result = compileDraft(validated.value, {
      type: "scene",
      sceneId: scene.id,
    });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) continue;
    expect(result.value.totalFrames).toBe(300);
    expect(result.issues.some((issue) => issue.severity === "error")).toBe(
      false,
    );
  }
});
