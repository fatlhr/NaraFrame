import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { motionStateFor } from "../../src/remotion/motion.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

describe("renderer test discovery", () => {
  it("loads renderer and core source aliases", async () => {
    const { rendererCorePackage, rendererPackage } = await import(
      "@naraframe/renderer-remotion"
    );

    expect(rendererPackage).toBe("@naraframe/renderer-remotion");
    expect(rendererCorePackage).toBe("@naraframe/core");
    const renderer = await import("@naraframe/renderer-remotion");
    expect(renderer.renderDraft).toEqual(expect.any(Function));
    expect(renderer.rendererRemotionVersion).toBe("4.0.521");
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

    const start = motionStateFor(compiled.value, scene, "map-image", 42);
    const middle = motionStateFor(compiled.value, scene, "map-image", 105);
    const end = motionStateFor(compiled.value, scene, "map-image", 168);

    expect(start.opacity).toBe(1);
    expect(start.scale).toBeCloseTo(1);
    expect(middle.scale).toBeCloseTo(1.0595);
    expect(middle.translateY).toBeCloseTo(-10.2);
    expect(end.scale).toBeCloseTo(1.119);
    expect(end.translateY).toBeCloseTo(-20.4);
  });

  it("clamps reveal and emphasis motion at their half-open boundaries", async () => {
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

    const revealStart = motionStateFor(compiled.value, scene, "map-image", 9);
    const revealEnd = motionStateFor(compiled.value, scene, "map-image", 39);
    expect(revealStart.opacity).toBe(0);
    expect(revealStart.translateX).toBe(40);
    expect(revealEnd.opacity).toBe(1);
    expect(revealEnd.translateX).toBe(0);

    const pulseStart = motionStateFor(
      compiled.value,
      scene,
      "eruption-marker",
      63,
    );
    const pulseMiddle = motionStateFor(
      compiled.value,
      scene,
      "eruption-marker",
      77,
    );
    const pulseEnd = motionStateFor(
      compiled.value,
      scene,
      "eruption-marker",
      90,
    );
    expect(pulseStart.scale).toBeCloseTo(1);
    expect(pulseMiddle.scale).toBeGreaterThan(1.2);
    expect(pulseEnd.scale).toBeCloseTo(1);
  });
});
