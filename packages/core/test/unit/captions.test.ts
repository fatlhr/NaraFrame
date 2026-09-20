import {
  CaptionsSchema,
  checkProvenance,
  deriveCaptionCues,
  NarrationSchema,
  resolveNarrationTimeline,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { must, specNarration } from "./narration-fixtures.js";

const correction = CaptionsSchema.parse({
  schemaVersion: 1,
  corrections: [
    {
      id: "fix1",
      blockId: "context",
      phraseId: "c1",
      displayText: "Krakatau memiliki",
      reason: "brand spelling",
    },
  ],
});

describe("deriveCaptionCues", () => {
  it("emits one cue per phrase using phrase timestamps", () => {
    const result = deriveCaptionCues(resolveNarrationTimeline(specNarration()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((c) => [c.id, c.startMs, c.endMs])).toEqual([
      ["context/c1", 100, 1000],
      ["context/c2", 1200, 2200],
      ["mechanism/m1", 2800, 4400],
    ]);
  });

  it("applies an attributed display correction without touching intended speech", () => {
    const narration = specNarration();
    const first = narration.blocks[0];
    if (!first || !("phrases" in first)) throw new Error("fixture");
    const typo = {
      ...narration,
      blocks: [
        {
          ...first,
          phrases: [
            { ...must(first.phrases[0]), text: "Krakatu memiliki" },
            must(first.phrases[1]),
          ],
        },
        must(narration.blocks[1]),
      ],
    };
    const result = deriveCaptionCues(
      resolveNarrationTimeline(typo),
      correction,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      text: "Krakatau memiliki",
      intendedText: "Krakatu memiliki",
      correction: { id: "fix1", reason: "brand spelling" },
    });
  });

  it("keeps cue ids stable while offsets shift", () => {
    const before = deriveCaptionCues(resolveNarrationTimeline(specNarration()));
    const after = deriveCaptionCues(
      resolveNarrationTimeline(specNarration(3000)),
    );
    if (!before.ok || !after.ok) throw new Error("expected ok");
    expect(after.value.map((c) => c.id)).toEqual(before.value.map((c) => c.id));
    expect(after.value.at(-1)?.startMs).toBe(3400);
  });

  it("rejects a correction that targets no resolved phrase", () => {
    const result = deriveCaptionCues(
      resolveNarrationTimeline(specNarration()),
      CaptionsSchema.parse({
        schemaVersion: 1,
        corrections: [
          {
            id: "x",
            blockId: "context",
            phraseId: "zz",
            displayText: "a",
            reason: "r",
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("CAPTION_CORRECTION_TARGET_UNKNOWN");
  });

  it("rejects two corrections for one phrase", () => {
    const twice = {
      schemaVersion: 1,
      corrections: [
        {
          id: "a",
          blockId: "context",
          phraseId: "c1",
          displayText: "x",
          reason: "r",
        },
        {
          id: "b",
          blockId: "context",
          phraseId: "c1",
          displayText: "y",
          reason: "r",
        },
      ],
    };
    expect(CaptionsSchema.safeParse(twice).success).toBe(false);
  });
});

describe("checkProvenance", () => {
  const narration = NarrationSchema.parse({
    schemaVersion: 1,
    order: ["a", "b", "c"],
    sources: [{ id: "pvmbg", title: "PVMBG bulletin" }],
    blocks: [
      { id: "a", text: "x", carriesFactualClaim: true },
      { id: "b", text: "y", carriesFactualClaim: true, sourceIds: ["pvmbg"] },
      { id: "c", text: "z", carriesFactualClaim: true, sourceIds: ["nope"] },
    ],
  });

  it("blocks publication with SOURCE_MISSING when the profile requires sourcing", () => {
    const issues = checkProvenance(narration, true);
    const missing = issues.filter((i) => i.code === "SOURCE_MISSING");
    expect(missing).toHaveLength(1);
    expect(missing[0]).toMatchObject({ severity: "error", path: "/blocks/0" });
  });

  it("downgrades SOURCE_MISSING to a warning when sourcing is not required", () => {
    const missing = checkProvenance(narration, false).filter(
      (i) => i.code === "SOURCE_MISSING",
    );
    expect(missing[0]?.severity).toBe("warning");
  });

  it("always errors on a cited-but-undeclared source", () => {
    const unknown = checkProvenance(narration, false).find(
      (i) => i.code === "SOURCE_UNKNOWN",
    );
    expect(unknown).toMatchObject({
      severity: "error",
      path: "/blocks/2/sourceIds/0",
    });
  });

  it("is clean when every claim cites a declared source", () => {
    const clean = {
      ...narration,
      blocks: [must(narration.blocks[1])],
      order: ["b"],
    };
    expect(checkProvenance(clean, true)).toEqual([]);
  });
});
