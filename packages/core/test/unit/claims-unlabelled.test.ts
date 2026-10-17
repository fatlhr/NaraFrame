import type { PlanSource } from "@naraframe/core";
import { checkSourceProvenance } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "../integration/narrated-source.js";

const withSceneClaim = (
  source: PlanSource,
  fields: { carriesFactualClaim?: boolean; sourceIds?: string[] },
): PlanSource => ({
  ...source,
  scenes: {
    ...source.scenes,
    scenes: source.scenes.scenes.map((scene, index) =>
      index === 1 ? { ...scene, ...fields } : scene,
    ),
  },
});

const withSource = (source: PlanSource): PlanSource => ({
  ...source,
  scenes: { ...source.scenes, sources: [{ id: "pvmbg", title: "PVMBG" }] },
});

const codes = (source: PlanSource) =>
  checkSourceProvenance(source).map((issue) => issue.code);

describe("CLAIMS_UNLABELLED", () => {
  it("reports one non-blocking info issue when sourcing is required and nothing is labelled", () => {
    const issues = checkSourceProvenance(
      narratedSource({ requireSourcing: true }),
    );
    expect(issues).toEqual([
      expect.objectContaining({
        code: "CLAIMS_UNLABELLED",
        severity: "info",
        responsible: "agent",
        artifact: "scenes.json",
        path: "/scenes",
      }),
    ]);
    expect(issues[0]?.message).toMatch(/cannot see claims/);
  });

  it("is silent when a labelled claim cites a declared source", () => {
    const source = withSceneClaim(
      withSource(narratedSource({ requireSourcing: true })),
      { carriesFactualClaim: true, sourceIds: ["pvmbg"] },
    );
    expect(codes(source)).toEqual([]);
  });

  it("is silent when sourcing is not required", () => {
    expect(codes(narratedSource())).toEqual([]);
  });

  it("gives a labelled claim without a source SOURCE_MISSING as an error and no CLAIMS_UNLABELLED", () => {
    const issues = checkSourceProvenance(
      withSceneClaim(narratedSource({ requireSourcing: true }), {
        carriesFactualClaim: true,
      }),
    );
    expect(issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["SOURCE_MISSING", "error"],
    ]);
  });

  it("counts a labelled narration block as a claim", () => {
    const source = narratedSource({
      requireSourcing: true,
      blocks: [
        {
          id: "context",
          text: "Klaim.",
          carriesFactualClaim: true,
          sourceIds: ["pvmbg"],
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
    });
    const declared = {
      ...source,
      narration: {
        ...source.narration,
        sources: [{ id: "pvmbg", title: "PVMBG" }],
      },
    } as PlanSource;
    expect(codes(declared)).toEqual([]);
  });

  it("is the only issue reported for an all-false strict project, once", () => {
    const source = withSceneClaim(narratedSource({ requireSourcing: true }), {
      carriesFactualClaim: false,
    });
    expect(codes(source)).toEqual(["CLAIMS_UNLABELLED"]);
  });
});
