import { partitionScenes, resolveNarrationTimeline } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { must, specNarration } from "./narration-fixtures.js";

const timeline = resolveNarrationTimeline(specNarration());
const refs = [
  { sceneId: "s1", blockId: "context" },
  { sceneId: "s2", blockId: "context", phraseId: "c2" },
  { sceneId: "s3", blockId: "mechanism" },
];

describe("partitionScenes", () => {
  it("covers [0, total) with natural gap ownership and shared frame boundaries", () => {
    const result = partitionScenes(timeline, refs, 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((s) => [s.startMs, s.endMs])).toEqual([
      [0, 1200],
      [1200, 2700],
      [2700, 4500],
    ]);
    expect(result.value.map((s) => [s.startFrame, s.endFrame])).toEqual([
      [0, 36],
      [36, 81],
      [81, 135],
    ]);
  });

  it("ends the final scene with ceil so tail samples are not truncated", () => {
    const odd = resolveNarrationTimeline(specNarration(2401));
    const result = partitionScenes(odd, refs, 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // total = 2401 + 300 + 1800 = 4501 ms -> ceil(135.03) = 136
    expect(result.value.at(-1)?.endFrame).toBe(136);
  });

  it("rejects a block with no scene", () => {
    const result = partitionScenes(timeline, [must(refs[0])], 30);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toContain("BLOCK_WITHOUT_SCENE");
  });

  it("requires a phrase for later scenes in a block", () => {
    const result = partitionScenes(
      timeline,
      [must(refs[0]), { sceneId: "s2", blockId: "context" }, must(refs[2])],
      30,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("SCENE_PHRASE_REQUIRED");
  });

  it("rejects out-of-order blocks and phrases instead of rewriting speech", () => {
    const blockOrder = partitionScenes(
      timeline,
      [must(refs[2]), { sceneId: "s2", blockId: "context" }],
      30,
    );
    expect(blockOrder.ok).toBe(false);
    const phraseOrder = partitionScenes(
      timeline,
      [
        { sceneId: "s1", blockId: "context", phraseId: "c2" },
        { sceneId: "s2", blockId: "context", phraseId: "c1" },
        must(refs[2]),
      ],
      30,
    );
    expect(phraseOrder.ok).toBe(false);
    if (phraseOrder.ok) return;
    expect(phraseOrder.issues[0]?.code).toBe("SCENE_PHRASE_ORDER");
  });

  it("rejects a scene that rounds to zero frames", () => {
    const base = specNarration();
    const first = base.blocks[0];
    if (!first || !("phrases" in first)) throw new Error("fixture");
    const tight = resolveNarrationTimeline({
      ...base,
      blocks: [
        {
          ...first,
          phrases: [
            { id: "c1", text: "a", startMs: 0, endMs: 5 },
            { id: "c2", text: "b", startMs: 10, endMs: 2200 },
          ],
        },
        must(base.blocks[1]),
      ],
    });
    // 10 ms at 30 fps rounds to frame 0, so the first scene has zero frames.
    const result = partitionScenes(tight, refs, 30);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("SCENE_ZERO_FRAMES");
  });

  it("refuses to partition an incomplete timeline", () => {
    const planned = resolveNarrationTimeline({
      schemaVersion: 1,
      order: ["a"],
      blocks: [{ id: "a", text: "x" }],
    });
    const result = partitionScenes(
      planned,
      [{ sceneId: "s", blockId: "a" }],
      30,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("TIMELINE_INCOMPLETE");
  });
});
