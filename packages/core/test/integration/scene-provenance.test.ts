import type { PlanSource } from "@naraframe/core";
import {
  checkSourceProvenance,
  compileDraft,
  ScenesSchema,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const withScene = (
  source: PlanSource,
  sceneId: string,
  fields: { carriesFactualClaim?: boolean; sourceIds?: string[] },
): PlanSource => ({
  ...source,
  scenes: {
    ...source.scenes,
    scenes: source.scenes.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...fields } : scene,
    ),
  },
});

const withSources = (
  source: PlanSource,
  where: "scenes" | "narration",
  sources: Array<{ id: string; title: string }>,
): PlanSource =>
  where === "scenes"
    ? { ...source, scenes: { ...source.scenes, sources } }
    : ({
        ...source,
        narration: { ...source.narration, sources },
      } as PlanSource);

const codes = (issues: Array<{ code: string }>) =>
  issues.map((issue) => issue.code);

describe("checkSourceProvenance for scenes", () => {
  it("blocks a factual scene with no source when the profile requires sourcing", () => {
    const source = withScene(narratedSource({ requireSourcing: true }), "s2", {
      carriesFactualClaim: true,
    });
    expect(checkSourceProvenance(source)).toContainEqual(
      expect.objectContaining({
        code: "SOURCE_MISSING",
        severity: "error",
        artifact: "scenes.json",
        path: "/scenes/1",
        entityId: "s2",
      }),
    );
  });

  it("downgrades the same gap to a warning when sourcing is not required", () => {
    const source = withScene(narratedSource(), "s2", {
      carriesFactualClaim: true,
    });
    const missing = checkSourceProvenance(source).find(
      (i) => i.code === "SOURCE_MISSING",
    );
    expect(missing?.severity).toBe("warning");
  });

  it("accepts a source declared in scenes.json", () => {
    const source = withScene(
      withSources(narratedSource({ requireSourcing: true }), "scenes", [
        { id: "pvmbg", title: "PVMBG bulletin" },
      ]),
      "s2",
      { carriesFactualClaim: true, sourceIds: ["pvmbg"] },
    );
    expect(checkSourceProvenance(source)).toEqual([]);
  });

  it("accepts a source declared only in narration.json, so one register serves both", () => {
    const source = withScene(
      withSources(narratedSource({ requireSourcing: true }), "narration", [
        { id: "pvmbg", title: "PVMBG bulletin" },
      ]),
      "s2",
      { carriesFactualClaim: true, sourceIds: ["pvmbg"] },
    );
    expect(checkSourceProvenance(source)).toEqual([]);
  });

  it("always errors on a cited-but-undeclared source, even without requireSourcing", () => {
    const source = withScene(narratedSource(), "s2", { sourceIds: ["ghost"] });
    expect(checkSourceProvenance(source)).toContainEqual(
      expect.objectContaining({
        code: "SOURCE_UNKNOWN",
        severity: "error",
        path: "/scenes/1/sourceIds/0",
      }),
    );
  });

  it("errors when the same source id is declared in both files", () => {
    const both = withSources(
      withSources(narratedSource(), "scenes", [{ id: "pvmbg", title: "A" }]),
      "narration",
      [{ id: "pvmbg", title: "B" }],
    );
    expect(codes(checkSourceProvenance(both))).toContain("SOURCE_DUPLICATE");
  });

  it("still checks blocks alongside scenes", () => {
    const source = narratedSource({
      requireSourcing: true,
      blocks: [
        {
          id: "context",
          text: "Klaim.",
          carriesFactualClaim: true,
          audioAssetId: "voice-context",
          audioDurationMs: 2400,
          pauseAfterMs: 300,
          phrases: [{ id: "c1", text: "Klaim.", startMs: 100, endMs: 2200 }],
        },
        {
          id: "mechanism",
          text: "Ok.",
          audioAssetId: "voice-mechanism",
          audioDurationMs: 1800,
          pauseAfterMs: 0,
          phrases: [{ id: "m1", text: "Ok.", startMs: 100, endMs: 1700 }],
        },
      ],
      scenes: [
        narratedScene("s1", { blockId: "context" }),
        narratedScene("s2", { blockId: "mechanism" }),
      ],
    });
    const issues = checkSourceProvenance(
      withScene(source, "s2", { carriesFactualClaim: true }),
    );
    expect(issues.map((i) => [i.artifact, i.entityId])).toEqual([
      ["narration.json", "context"],
      ["scenes.json", "s2"],
    ]);
  });
});

describe("scene provenance in compileDraft", () => {
  it("applies to a silent project with no narration.json", () => {
    const { narration: _omit, ...silentSource } = narratedSource({
      requireSourcing: true,
      scenes: [narratedScene("s1")],
    });
    const silent = withScene(silentSource, "s1", { carriesFactualClaim: true });
    const result = compileDraft(silent);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("SOURCE_MISSING");

    const cited = compileDraft(
      withScene(
        withSources(silent, "scenes", [{ id: "pvmbg", title: "PVMBG" }]),
        "s1",
        {
          carriesFactualClaim: true,
          sourceIds: ["pvmbg"],
        },
      ),
    );
    expect(cited.ok).toBe(true);
  });
});

describe("ScenesSchema provenance fields", () => {
  it("accepts a source register and per-scene claim fields, and rejects malformed ones", () => {
    const scene = narratedScene("s1");
    const base = { schemaVersion: 1, scenes: [scene] };
    expect(
      ScenesSchema.safeParse({
        ...base,
        sources: [{ id: "pvmbg", title: "PVMBG", retrievedAt: "2026-09-01" }],
        scenes: [{ ...scene, carriesFactualClaim: true, sourceIds: ["pvmbg"] }],
      }).success,
    ).toBe(true);
    expect(
      ScenesSchema.safeParse({
        ...base,
        sources: [{ id: "Bad Id", title: "x" }],
      }).success,
    ).toBe(false);
    expect(
      ScenesSchema.safeParse({
        ...base,
        scenes: [{ ...scene, sourceIds: ["Bad Id"] }],
      }).success,
    ).toBe(false);
  });
});
