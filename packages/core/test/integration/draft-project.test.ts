import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

describe("Krakatau draft project", () => {
  it("loads strict source JSON and compiles a 15-second vertical draft", async () => {
    const loaded = await loadPlanProject(sampleRoot);

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const compiled = compileDraft(loaded.value.source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    expect(compiled.value).toMatchObject({
      width: 540,
      height: 960,
      fps: 30,
      totalFrames: 450,
      label: "DRAFT • NO AUDIO",
    });
    expect(
      compiled.value.scenes.map((scene) => [scene.startFrame, scene.endFrame]),
    ).toEqual([
      [0, 150],
      [150, 300],
      [300, 450],
    ]);
    expect(compiled.value.assets["krakatau-map"]).toMatchObject({
      kind: "placeholder",
      assetId: "krakatau-map",
    });
  });

  it("reports a missing required source file without throwing", async () => {
    const loaded = await loadPlanProject(`${sampleRoot}/does-not-exist`);

    expect(loaded.ok).toBe(false);
    if (loaded.ok) {
      return;
    }

    expect(loaded.issues).toHaveLength(4);
    expect(
      loaded.issues.every((issue) => issue.code === "SOURCE_MISSING"),
    ).toBe(true);
  });
});
