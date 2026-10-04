import { compileDraft, computeSceneRenderKeys } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const compiled = (options: Parameters<typeof compileDraft>[2]) => {
  const result = compileDraft(narratedSource(), { type: "project" }, options);
  if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
  return result.value;
};

describe("draft resolution", () => {
  it("keeps 540 as the default draft", () => {
    const fallback = compiled({});
    expect(compiled({ resolution: 540 })).toEqual(fallback);
    expect(fallback).toMatchObject({ mode: "draft", width: 540, height: 960 });
  });

  it("compiles a native 1080 draft at design size with its own keys", () => {
    const half = compiled({});
    const native = compiled({ resolution: 1080 });
    const final = compiled({ mode: "final" });
    expect(native).toMatchObject({
      mode: "draft",
      width: 1080,
      height: 1920,
      fps: 30,
      label: half.label,
      totalFrames: half.totalFrames,
      sourceRevision: half.sourceRevision,
    });
    expect(native.assemblyKey).not.toBe(half.assemblyKey);
    expect(native.assemblyKey).not.toBe(final.assemblyKey);
    const keys = (draft: typeof half) =>
      computeSceneRenderKeys(draft).map((entry) => entry.key);
    expect(keys(native)).not.toEqual(keys(half));
    // Same design geometry as the final: no draft scaling.
    expect(native.scenes.map((scene) => scene.layers)).toEqual(
      final.scenes.map((scene) => scene.layers),
    );
  });
});
