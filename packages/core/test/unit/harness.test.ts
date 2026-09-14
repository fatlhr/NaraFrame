import { fileURLToPath } from "node:url";
import type { PlanSource } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

const reverseObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, nested]) => [key, reverseObjectKeys(nested)]),
  );
};

describe("core test discovery", () => {
  it("loads the core source alias", async () => {
    const core = await import("@naraframe/core");

    expect(core.corePackage).toBe("@naraframe/core");
    expect(core).toMatchObject({
      compileDraft: expect.any(Function),
      createProject: expect.any(Function),
      exportSchemas: expect.any(Function),
      loadPlanProject: expect.any(Function),
      validatePlanSource: expect.any(Function),
      AssetManifestSchema: expect.any(Object),
      CompiledDraftSchema: expect.any(Object),
      ProfileLockSchema: expect.any(Object),
      ProjectConfigSchema: expect.any(Object),
      ScenesSchema: expect.any(Object),
    });
  });

  it("keeps source and assembly hashes stable across object key order", async () => {
    const { compileDraft, loadPlanProject } = await import("@naraframe/core");
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const original = compileDraft(loaded.value.source);
    const reordered = compileDraft(
      reverseObjectKeys(loaded.value.source) as PlanSource,
    );

    expect(original.ok).toBe(true);
    expect(reordered.ok).toBe(true);
    if (!original.ok || !reordered.ok) return;
    expect(reordered.value.sourceRevision).toBe(original.value.sourceRevision);
    expect(reordered.value.assemblyKey).toBe(original.value.assemblyKey);
    expect(
      reordered.value.scenes.map(({ startFrame, endFrame }) => [
        startFrame,
        endFrame,
      ]),
    ).toEqual([
      [0, 120],
      [120, 300],
      [300, 420],
      [420, 540],
    ]);
  });
});
