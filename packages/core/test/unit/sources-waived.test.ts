import type { PlanSource } from "@naraframe/core";
import { checkSourceProvenance, ProjectConfigSchema } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "../integration/narrated-source.js";

const decision = {
  ownerDecision: "no-sources" as const,
  decidedBy: "Rina",
  decidedAt: "2026-10-18T09:30:00+07:00",
  reason: "A personal explainer; nothing here needs a citation.",
};

const claiming = (source: PlanSource, withDecision: boolean): PlanSource => ({
  ...source,
  project: withDecision
    ? { ...source.project, sourcing: decision }
    : source.project,
  scenes: {
    ...source.scenes,
    scenes: source.scenes.scenes.map((scene, index) =>
      index < 2 ? { ...scene, carriesFactualClaim: true } : scene,
    ),
  },
});

describe("owner's no-sources decision", () => {
  it("is a project field with who, when and why, and nothing else", () => {
    const base = narratedSource().project;
    expect(
      ProjectConfigSchema.safeParse({ ...base, sourcing: decision }).success,
    ).toBe(true);
    for (const bad of [
      { ...decision, ownerDecision: "later" },
      { ...decision, decidedBy: "" },
      { ...decision, decidedAt: "yesterday" },
      { ...decision, reason: "" },
      { ...decision, extra: true },
    ])
      expect(
        ProjectConfigSchema.safeParse({ ...base, sourcing: bad }).success,
      ).toBe(false);
  });

  it("without a decision, each labelled claim without a source warns", () => {
    const issues = checkSourceProvenance(claiming(narratedSource(), false));
    expect(issues.map((issue) => issue.code)).toEqual([
      "SOURCE_MISSING",
      "SOURCE_MISSING",
    ]);
  });

  it("replaces the per-claim warnings with one info note naming the decision", () => {
    const issues = checkSourceProvenance(claiming(narratedSource(), true));
    expect(issues).toEqual([
      expect.objectContaining({
        code: "SOURCES_WAIVED",
        severity: "info",
        artifact: "naraframe.json",
      }),
    ]);
    expect(issues[0]?.message).toContain("2 labelled claims");
    expect(issues[0]?.message).toContain("Rina");
    expect(issues[0]?.message).toContain("2026-10-18");
  });

  it("never relaxes a profile that requires sourcing", () => {
    const issues = checkSourceProvenance(
      claiming(narratedSource({ requireSourcing: true }), true),
    );
    expect(issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["SOURCE_MISSING", "error"],
      ["SOURCE_MISSING", "error"],
    ]);
  });

  it("still reports a cited source that was never declared", () => {
    const source = claiming(narratedSource(), true);
    const first = source.scenes.scenes[0];
    if (!first) throw new Error("fixture has no scene");
    source.scenes.scenes[0] = { ...first, sourceIds: ["nowhere"] };
    expect(checkSourceProvenance(source).map((issue) => issue.code)).toEqual([
      "SOURCE_UNKNOWN",
      "SOURCES_WAIVED",
    ]);
  });
});
