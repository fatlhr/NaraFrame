import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileDraft,
  createProject,
  isProjectTemplateName,
  loadPlanProject,
  PROJECT_TEMPLATE_NAMES,
  projectTemplateScenes,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const profilesRoot = fileURLToPath(
  new URL("../../../../profiles", import.meta.url),
);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const createStarter = async (profile: string) => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-template-"));
  roots.push(root);
  const destination = join(root, "starter");
  const created = await createProject({
    destination,
    projectId: "starter",
    title: "Starter",
    profileDirectory: join(profilesRoot, profile),
    profileSource: { kind: "repository", identity: `profiles/${profile}` },
    scenes: projectTemplateScenes("starter"),
  });
  if (!created.ok) throw new Error(JSON.stringify(created.issues));
  return destination;
};

describe("project templates", () => {
  it("names one built-in template and rejects anything else", () => {
    expect(PROJECT_TEMPLATE_NAMES).toEqual(["starter"]);
    expect(isProjectTemplateName("starter")).toBe(true);
    expect(isProjectTemplateName("Starter")).toBe(false);
    expect(isProjectTemplateName("")).toBe(false);
  });

  it("hands out an independent copy on every call", () => {
    const first = projectTemplateScenes("starter");
    first.scenes.length = 0;
    expect(projectTemplateScenes("starter").scenes).toHaveLength(3);
  });

  it.each(["general-explainer", "current-issues"])(
    "is a claim-free three-scene plan that validates against %s",
    async (profile) => {
      const destination = await createStarter(profile);
      const loaded = await loadPlanProject(destination);
      if (!loaded.ok) throw new Error(JSON.stringify(loaded.issues));
      expect(loaded.issues.filter((i) => i.severity !== "info")).toEqual([]);

      const { scenes } = loaded.value.source.scenes;
      expect(scenes.map((scene) => scene.narrativeRole)).toEqual([
        "hook",
        "explanation",
        "payoff",
      ]);
      const total = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
      expect(total).toBeGreaterThanOrEqual(25_000);
      expect(total).toBeLessThanOrEqual(26_000);
      expect(scenes.at(-1)?.transition).toEqual({ type: "cut" });
      for (const scene of scenes) {
        // Unlabelled, so an agent never copies a `false` label onto its own words.
        expect(scene.carriesFactualClaim).toBeUndefined();
        expect(scene.note?.length).toBeGreaterThan(40);
      }
      expect(loaded.value.source.narration).toBeUndefined();
      expect(loaded.value.source.assets.assets).toEqual([]);

      const compiled = compileDraft(loaded.value.source);
      if (!compiled.ok) throw new Error(JSON.stringify(compiled.issues));
      expect(
        [...loaded.issues, ...compiled.issues].filter(
          (issue) => issue.severity !== "info",
        ),
      ).toEqual([]);
    },
  );

  it("paints with palette tokens only and binds no recipes", async () => {
    const destination = await createStarter("general-explainer");
    const text = await readFile(join(destination, "scenes.json"), "utf8");
    expect(text).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(text).toContain("palette.accent");
    const project = JSON.parse(
      await readFile(join(destination, "naraframe.json"), "utf8"),
    );
    expect(project.recipes).toBeUndefined();
    expect(text).not.toContain('"recipe"');
  });
});
