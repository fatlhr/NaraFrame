import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { motionFor } from "../../src/remotion/draft-video.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

const scaleFrom = (transform: string | undefined) => {
  const match = transform?.match(/scale\(([^)]+)\)/);
  if (!match?.[1]) throw new Error("Expected a scale transform.");
  return Number(match[1]);
};

describe("renderer test discovery", () => {
  it("loads renderer and core source aliases", async () => {
    const { rendererCorePackage, rendererPackage } = await import(
      "@naraframe/renderer-remotion"
    );

    expect(rendererPackage).toBe("@naraframe/renderer-remotion");
    expect(rendererCorePackage).toBe("@naraframe/core");
  });

  it("turns a sustained smooth focus beat into visible camera travel", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const compiled = compileDraft(loaded.value.source, {
      type: "scene",
      sceneId: "context",
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const scene = compiled.value.scenes[0];
    if (!scene) throw new Error("Expected the compiled context scene.");

    const start = motionFor(compiled.value, scene, "map-image", 42);
    const middle = motionFor(compiled.value, scene, "map-image", 105);
    const end = motionFor(compiled.value, scene, "map-image", 168);

    expect(start.opacity).toBe(1);
    expect(scaleFrom(start.transform)).toBeCloseTo(1);
    expect(scaleFrom(middle.transform)).toBeCloseTo(1.0595);
    expect(middle.transform).toContain("translateY(-10.2px)");
    expect(scaleFrom(end.transform)).toBeCloseTo(1.119);
    expect(end.transform).toContain("translateY(-20.4px)");
  });
});
