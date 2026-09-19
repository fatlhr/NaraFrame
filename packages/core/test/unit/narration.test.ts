import { NarrationSchema, resolveNarrationTimeline } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { must, specNarration } from "./narration-fixtures.js";

describe("resolveNarrationTimeline", () => {
  it("starts blocks at 0 and 2700 ms and totals 4500 ms (spec example)", () => {
    const timeline = resolveNarrationTimeline(specNarration());
    expect(timeline.blocks.map((block) => block.startMs)).toEqual([0, 2700]);
    expect(timeline.totalDurationMs).toBe(4500);
  });

  it("moves block two to 3300 ms when only block one's clip grows, keeping its local timing", () => {
    const timeline = resolveNarrationTimeline(specNarration(3000));
    const mechanism = timeline.blocks[1];
    expect(mechanism?.startMs).toBe(3300);
    expect(mechanism?.phrases[0]?.localStartMs).toBe(100);
    expect(mechanism?.phrases[0]?.startMs).toBe(3400);
    expect(timeline.totalDurationMs).toBe(5100);
  });

  it("leaves later offsets and the total unknown after a planned block", () => {
    const narration = NarrationSchema.parse({
      schemaVersion: 1,
      order: ["a", "b"],
      blocks: [
        { id: "a", text: "planned" },
        {
          id: "b",
          text: "ready",
          audioAssetId: "v",
          audioDurationMs: 1000,
          pauseAfterMs: 0,
          phrases: [{ id: "b1", text: "ready", startMs: 0, endMs: 900 }],
        },
      ],
    });
    const timeline = resolveNarrationTimeline(narration);
    expect(timeline.blocks[0]?.startMs).toBe(0);
    expect(timeline.blocks[1]?.startMs).toBeNull();
    expect(timeline.totalDurationMs).toBeNull();
  });

  it("honours reordering: blocks and their offsets follow `order`", () => {
    const narration = specNarration();
    const reordered = { ...narration, order: ["mechanism", "context"] };
    const timeline = resolveNarrationTimeline(reordered);
    expect(timeline.blocks.map((block) => [block.id, block.startMs])).toEqual([
      ["mechanism", 0],
      ["context", 1800],
    ]);
  });

  it("applies a 1000 ms pause and a 300 ms breath gap to the following offset", () => {
    const base = specNarration();
    const first = base.blocks[0];
    if (!first || !("pauseAfterMs" in first)) throw new Error("fixture");
    const paused = {
      ...base,
      blocks: [{ ...first, pauseAfterMs: 1000 }, must(base.blocks[1])],
    };
    expect(resolveNarrationTimeline(paused).blocks[1]?.startMs).toBe(3400);
  });
});

describe("NarrationSchema", () => {
  it("rejects a phrase that ends beyond the clip", () => {
    const base = specNarration();
    const shortClip = {
      ...base,
      blocks: [{ ...base.blocks[0], audioDurationMs: 2000 }, base.blocks[1]],
    };
    const result = NarrationSchema.safeParse(shortClip);
    expect(result.success).toBe(false);
  });

  it("rejects overlapping, unordered, or non-positive phrases", () => {
    const base = specNarration();
    const first = base.blocks[0];
    if (!first || !("phrases" in first)) throw new Error("fixture");
    const overlap = {
      ...base,
      blocks: [
        {
          ...first,
          phrases: [
            { id: "c1", text: "a", startMs: 100, endMs: 1500 },
            { id: "c2", text: "b", startMs: 1200, endMs: 2200 },
          ],
        },
        base.blocks[1],
      ],
    };
    expect(NarrationSchema.safeParse(overlap).success).toBe(false);
  });

  it("requires order to list every block exactly once", () => {
    const base = specNarration();
    expect(
      NarrationSchema.safeParse({ ...base, order: ["context"] }).success,
    ).toBe(false);
    expect(
      NarrationSchema.safeParse({
        ...base,
        order: ["context", "context", "mechanism"],
      }).success,
    ).toBe(false);
    expect(
      NarrationSchema.safeParse({ ...base, order: ["context", "ghost"] })
        .success,
    ).toBe(false);
  });
});
