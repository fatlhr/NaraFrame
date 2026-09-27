import type { Beat, PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

// M2.4.4b: timing errors name the frames the compiler uses after phrase
// anchors and rounding, and suggest a value that clears them.

const card = {
  id: "card",
  type: "shape" as const,
  shape: "rectangle" as const,
  fill: "#E8E0D2",
  frame: { x: 240, y: 760, width: 600, height: 400 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
};

const scene = (beats: Beat[], id = "probe"): Scene => ({
  id,
  narrativeRole: "context",
  durationMs: 2000,
  visual: { type: "composition", layers: [card] },
  beats,
  transition: { type: "cut" },
});

const silent = (scenes: Scene[]): PlanSource => {
  const { narration: _narration, ...rest } = narratedSource({ scenes });
  return rest;
};

const nudge = (id: string, startMs: number, durationMs = 60): Beat => ({
  id,
  targetId: "card",
  action: "transform",
  startMs,
  durationMs,
  params: { to: { x: 10 }, easingPreset: "linear" },
});

const issue = (source: PlanSource, code: string) => {
  const result = compileDraft(source);
  expect(result.ok).toBe(false);
  const found = result.issues.find((candidate) => candidate.code === code);
  if (!found) throw new Error(`expected ${code}`);
  return found;
};

describe("MOTION_PROPERTY_OVERLAP message", () => {
  // 1320 ms -> frame 40 for 2 frames; 1380 ms -> frame 41: they meet only
  // because of rounding, as the stigma shake did in M2.4.4.
  const beats = [nudge("nudge-1", 1320), nudge("nudge-2", 1380)];

  it("names both beats and their rounded frames, and a clearing value", () => {
    const found = issue(silent([scene(beats)]), "MOTION_PROPERTY_OVERLAP");
    expect(found.path).toBe("/scenes/0/beats/1");
    expect(found.message).toBe(
      "Beat nudge-2 writes x on card over frames 41-42, overlapping beat nudge-1, which writes it over frames 40-41 (30 fps; starts round to the nearest frame).",
    );
    expect(found.suggestion).toContain(
      "Start nudge-2 at frame 42 or later (startMs 1384)",
    );
    expect(found.suggestion).toContain(
      "end nudge-1 by frame 40 (durationMs 49 or less)",
    );
  });

  it("suggests values that actually clear the overlap", () => {
    expect(
      compileDraft(silent([scene([beats[0] as Beat, nudge("nudge-2", 1384)])]))
        .ok,
    ).toBe(true);
    expect(
      compileDraft(
        silent([scene([nudge("nudge-1", 1320, 49), beats[1] as Beat])]),
      ).ok,
    ).toBe(true);
  });

  it("speaks in the anchor's offset for a phrase-anchored beat", () => {
    // context block: phrase c1 starts at 100 ms. Anchored at c1 + 1280 ->
    // 1380 ms resolved, frame 41, the same clash as above.
    const anchored = {
      ...nudge("nudge-2", 0),
      at: { phraseId: "c1", offsetMs: 1280 },
    };
    const source = narratedSource({
      scenes: [
        {
          ...scene([nudge("nudge-1", 1320), anchored], "s1"),
          narration: { blockId: "context" },
        },
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ],
      contextDurationMs: 4000,
    });
    // Let s1 own enough of the block for the beats to fit.
    const block = source.narration?.blocks[0];
    if (block && "phrases" in block && block.phrases[1]) {
      block.phrases[1].startMs = 3000;
      block.phrases[1].endMs = 3800;
    }
    const found = issue(source, "MOTION_PROPERTY_OVERLAP");
    expect(found.message).toContain("(resolved from phrase c1)");
    expect(found.suggestion).toContain("offsetMs 1284 on its phrase anchor");
  });
});

describe("BEAT_OUTSIDE_SCENE message", () => {
  // 1900 ms -> frame 57 for round(4.5) = 5 frames: frames 57-61 in a
  // 60-frame scene.
  const exit: Beat = {
    id: "card-out",
    targetId: "card",
    action: "exit",
    startMs: 1900,
    durationMs: 150,
    params: { easingPreset: "smooth" },
  };

  it("names the beat, its rounded frames and the scene's frame count", () => {
    const found = issue(
      silent([scene([exit], "outside")]),
      "BEAT_OUTSIDE_SCENE",
    );
    expect(found.path).toBe("/scenes/0/beats/0");
    expect(found.message).toBe(
      "Beat card-out on card runs over frames 57-61, but scene outside has 60 frames (0-59) at 30 fps.",
    );
    expect(found.suggestion).toBe(
      "End it by frame 59: durationMs 116 or less, or startMs 1849 or earlier.",
    );
  });

  it("suggests values that actually fit the beat in the scene", () => {
    expect(
      compileDraft(silent([scene([{ ...exit, durationMs: 116 }], "outside")]))
        .ok,
    ).toBe(true);
    expect(
      compileDraft(silent([scene([{ ...exit, startMs: 1849 }], "outside")])).ok,
    ).toBe(true);
    expect(
      compileDraft(silent([scene([{ ...exit, durationMs: 117 }], "outside")]))
        .ok,
    ).toBe(false);
  });

  it("keeps the codes, severities and runtime frames unchanged", () => {
    const result = compileDraft(silent([scene([nudge("nudge-1", 1320)])]));
    if (!result.ok) throw new Error("expected a valid draft");
    expect(result.value.scenes[0]?.beats[0]).toMatchObject({
      startFrame: 40,
      durationInFrames: 2,
    });
    const found = issue(
      silent([scene([exit], "outside")]),
      "BEAT_OUTSIDE_SCENE",
    );
    expect(found.severity).toBe("error");
  });
});

describe("BEAT_OUTSIDE_SCENE fallback for a beat longer than its scene", () => {
  // Supervisor repro (2026-09-27): s1 owns the context block up to phrase c2
  // (1200 ms, 36 frames); the exit is anchored 5000 ms after c1 (100 ms),
  // so it resolves to 5100 ms, frames 153-302.
  const longExit = (durationMs: number, offsetMs: number): Beat => ({
    id: "out",
    targetId: "card",
    action: "exit",
    startMs: 0,
    durationMs,
    at: { phraseId: "c1", offsetMs },
    params: { easingPreset: "smooth" },
  });
  const source = (beat: Beat) =>
    narratedSource({
      scenes: [
        { ...scene([beat], "s1"), narration: { blockId: "context" } },
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ],
    });

  it("names the anchor offset that brings the start to 0", () => {
    const found = issue(source(longExit(5000, 5000)), "BEAT_OUTSIDE_SCENE");
    expect(found.message).toBe(
      "Beat out on card runs over frames 153-302 (resolved from phrase c1), but scene s1 has 36 frames (0-35) at 30 fps.",
    );
    expect(found.suggestion).toBe(
      "The beat is longer than the scene; shorten it to durationMs 1216 or less and set offsetMs -100 on its phrase anchor.",
    );
  });

  it("clears the error once both suggested edits are applied", () => {
    const fixed = compileDraft(source(longExit(1216, -100)));
    expect(fixed.issues.map((entry) => entry.code)).not.toContain(
      "BEAT_OUTSIDE_SCENE",
    );
    expect(fixed.ok).toBe(true);
    // Either edit alone is not enough.
    expect(
      compileDraft(source(longExit(1216, 5000))).issues.map((e) => e.code),
    ).toContain("BEAT_OUTSIDE_SCENE");
    expect(
      compileDraft(source(longExit(5000, -100))).issues.map((e) => e.code),
    ).toContain("BEAT_OUTSIDE_SCENE");
  });

  it("names startMs for an unanchored beat", () => {
    const found = issue(
      silent([
        scene(
          [
            {
              id: "out",
              targetId: "card",
              action: "exit",
              startMs: 2500,
              durationMs: 5000,
              params: {},
            },
          ],
          "short",
        ),
      ]),
      "BEAT_OUTSIDE_SCENE",
    );
    expect(found.suggestion).toBe(
      "The beat is longer than the scene; shorten it to durationMs 2016 or less and set startMs 0.",
    );
  });
});
