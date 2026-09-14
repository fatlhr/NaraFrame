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

const scalesFrom = (transform: string | undefined) =>
  [...(transform?.matchAll(/scale\(([^)]+)\)/g) ?? [])].map((match) =>
    Number(match[1]),
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

    const revealStart = motionFor(compiled.value, scene, "map-image", 9);
    const revealEnd = motionFor(compiled.value, scene, "map-image", 39);
    expect(revealStart.opacity).toBe(0);
    expect(revealStart.transform).toContain("translateX(40px)");
    expect(revealEnd.opacity).toBe(1);
    expect(revealEnd.transform).toContain("translateX(0px)");

    const pulseStart = scalesFrom(
      motionFor(compiled.value, scene, "eruption-marker", 63).transform,
    );
    const pulseMiddle = scalesFrom(
      motionFor(compiled.value, scene, "eruption-marker", 77).transform,
    );
    const pulseEnd = scalesFrom(
      motionFor(compiled.value, scene, "eruption-marker", 90).transform,
    );
    expect(pulseStart[0]).toBeCloseTo(1);
    expect(pulseMiddle[0]).toBeGreaterThan(1.2);
    expect(pulseEnd[0]).toBeCloseTo(1);
  });
});
