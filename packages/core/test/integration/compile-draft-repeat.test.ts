import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import {
  compileDraft,
  computeSceneRenderKeys,
  ScenesSchema,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { hashValue } from "../../src/project/hash.js";
import { narratedScene, narratedSource } from "./narrated-source.js";

const figure: Extract<Layer, { type: "shape" }> = {
  id: "figure",
  type: "shape",
  shape: "rectangle",
  fill: "#E8E0D2",
  frame: { x: 290, y: 560, width: 500, height: 750 },
  pivot: { x: 0.5, y: 1 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
};

const breath = (overrides: Partial<Beat> = {}): Beat =>
  ({
    id: "breath",
    targetId: "figure",
    action: "emphasize",
    startMs: 200,
    durationMs: 1200,
    repeat: { intervalMs: 1400, untilMs: 9000 },
    params: { scale: 1.03, easingPreset: "smooth" },
    ...overrides,
  }) as Beat;

const scene = (beats: Beat[], extra: Partial<Scene> = {}): Scene => ({
  id: "wait",
  narrativeRole: "context",
  durationMs: 9000,
  visual: { type: "composition", layers: [figure] },
  beats,
  transition: { type: "cut" },
  ...extra,
});

const silent = (scenes: Scene[]): PlanSource => {
  const { narration: _narration, ...rest } = narratedSource({ scenes });
  return rest;
};

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

const compiledBeats = (source: PlanSource) => {
  const result = compileDraft(source);
  if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
  return result.value.scenes[0]?.beats ?? [];
};

describe("repeated beats (S5)", () => {
  it("expands a breath every 1400 ms over a 9 s scene into ordinary beats", () => {
    const beats = compiledBeats(silent([scene([breath()])]));
    expect(beats.map((beat) => [beat.id, beat.startFrame])).toEqual([
      ["breath", 6],
      ["breath-2", 48],
      ["breath-3", 90],
      ["breath-4", 132],
      ["breath-5", 174],
      ["breath-6", 216],
    ]);
    // Each copy keeps the beat's action, duration and parameters.
    expect(
      new Set(
        beats.map((beat) =>
          JSON.stringify([
            beat.action,
            beat.durationInFrames,
            beat.targetId,
            beat.params,
          ]),
        ),
      ).size,
    ).toBe(1);
    // The last copy ends by untilMs: 7200 + 1200 = 8400; 8600 + 1200 > 9000.
    const last = beats.at(-1);
    expect((last?.startFrame ?? 0) + (last?.durationInFrames ?? 0)).toBe(252);
  });

  it("reports an interval shorter than the beat once, naming the copies", () => {
    const result = compileDraft(
      silent([
        scene([breath({ repeat: { intervalMs: 1000, untilMs: 9000 } })]),
      ]),
    );
    expect(result.ok).toBe(false);
    const overlaps = result.issues.filter(
      (issue) => issue.code === "MOTION_PROPERTY_OVERLAP",
    );
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.path).toBe("/scenes/0/beats/0");
    expect(overlaps[0]?.message).toContain("Beat breath-2 writes scale");
    expect(overlaps[0]?.message).toContain("overlapping beat breath,");
    expect(overlaps[0]?.suggestion).toContain(
      "Set repeat.intervalMs on breath to 1198 or more",
    );
    // The suggested interval clears every copy after frame rounding; one
    // millisecond less does not.
    expect(
      compileDraft(
        silent([
          scene([breath({ repeat: { intervalMs: 1198, untilMs: 9000 } })]),
        ]),
      ).ok,
    ).toBe(true);
    expect(
      codes(
        compileDraft(
          silent([
            scene([breath({ repeat: { intervalMs: 1197, untilMs: 9000 } })]),
          ]),
        ).issues,
      ),
    ).toContain("MOTION_PROPERTY_OVERLAP");
  });

  it("checks copies against the scene's other beats and points at the source", () => {
    const sway: Beat = {
      id: "sway",
      targetId: "figure",
      action: "transform",
      startMs: 0,
      durationMs: 600,
      repeat: { intervalMs: 2000, untilMs: 9000 },
      params: { to: { rotationDeg: 2 } },
    };
    const lean: Beat = {
      id: "lean",
      targetId: "figure",
      action: "transform",
      startMs: 4100,
      durationMs: 400,
      params: { to: { rotationDeg: -4 } },
    };
    const result = compileDraft(silent([scene([sway, lean])]));
    const overlap = result.issues.find(
      (issue) => issue.code === "MOTION_PROPERTY_OVERLAP",
    );
    expect(overlap?.path).toBe("/scenes/0/beats/1");
    expect(overlap?.message).toContain("overlapping beat sway-3");
  });

  it("blinks a light with a repeated reveal and exit", () => {
    const light: Beat[] = [
      {
        id: "on",
        targetId: "figure",
        action: "reveal",
        startMs: 0,
        durationMs: 200,
        repeat: { intervalMs: 1000, untilMs: 3000 },
        params: { direction: "up", distance: 0 },
      },
      {
        id: "off",
        targetId: "figure",
        action: "exit",
        startMs: 500,
        durationMs: 200,
        repeat: { intervalMs: 1000, untilMs: 3000 },
        params: {},
      },
    ];
    const result = compileDraft(silent([scene(light)]));
    expect(result.ok).toBe(true);
    expect(codes(result.issues)).not.toContain("VISIBILITY_OVERLAP");
    if (!result.ok) return;
    expect(
      result.value.scenes[0]?.beats.map((beat) => [beat.id, beat.startFrame]),
    ).toEqual([
      ["on", 0],
      ["on-2", 30],
      ["on-3", 60],
      ["off", 15],
      ["off-2", 45],
      ["off-3", 75],
    ]);
  });

  it("moves copies of an anchored beat with the measured phrase", () => {
    const anchored: Scene = {
      ...scene([
        breath({
          startMs: 0,
          durationMs: 200,
          at: { phraseId: "c2" },
          repeat: { intervalMs: 300, untilMs: 2600 },
        }),
      ]),
      narration: { blockId: "context" },
    };
    const result = compileDraft(
      narratedSource({
        scenes: [anchored, narratedScene("after", { blockId: "mechanism" })],
      }),
    );
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
    // Phrase c2 starts at 1200 ms; copies follow at 300 ms steps.
    expect(
      result.value.scenes[0]?.beats.map((beat) => [beat.id, beat.startFrame]),
    ).toEqual([
      ["breath", 36],
      ["breath-2", 45],
      ["breath-3", 54],
      ["breath-4", 63],
      ["breath-5", 72],
    ]);
  });

  it("refuses derived ids that are taken and repeats past the copy limit", () => {
    const taken = compileDraft(
      silent([
        scene([
          breath(),
          {
            id: "breath-4",
            targetId: "figure",
            action: "transform",
            startMs: 0,
            durationMs: 100,
            params: { to: { x: 300 } },
          },
        ]),
      ]),
    );
    expect(taken.ok).toBe(false);
    const clash = taken.issues.find(
      (issue) => issue.code === "BEAT_REPEAT_INVALID",
    );
    expect(clash?.path).toBe("/scenes/0/beats/0/repeat");
    expect(clash?.message).toContain("already has a beat breath-4");

    const flood = compileDraft(
      silent([
        scene([
          breath({
            durationMs: 30,
            repeat: { intervalMs: 40, untilMs: 9000 },
          }),
        ]),
      ]),
    );
    expect(flood.ok).toBe(false);
    expect(codes(flood.issues)).toContain("BEAT_REPEAT_INVALID");
  });

  it("warns when no copy fits before untilMs and plays the beat once", () => {
    const result = compileDraft(
      silent([
        scene([breath({ repeat: { intervalMs: 1400, untilMs: 2000 } })]),
      ]),
    );
    expect(result.ok).toBe(true);
    const empty = result.issues.find(
      (issue) => issue.code === "BEAT_REPEAT_EMPTY",
    );
    expect(empty?.severity).toBe("warning");
    expect(empty?.suggestion).toContain("untilMs to 2800 or later");
    if (result.ok) expect(result.value.scenes[0]?.beats).toHaveLength(1);
  });

  it("keeps the schema strict and the render key tied to the repeat", () => {
    const parsed = ScenesSchema.safeParse({
      schemaVersion: 1,
      scenes: [scene([breath({ repeat: { intervalMs: 0, untilMs: 9000 } })])],
    });
    expect(parsed.success).toBe(false);
    const keyFor = (intervalMs: number) => {
      const result = compileDraft(
        silent([scene([breath({ repeat: { intervalMs, untilMs: 9000 } })])]),
      );
      if (!result.ok) throw new Error(codes(result.issues).join());
      return computeSceneRenderKeys(result.value)[0]?.key;
    };
    expect(keyFor(1400)).not.toBe(keyFor(1500));
  });

  it("keeps the authored source's revision, not the expanded one", () => {
    // status, outline, edit --expect and approvals all key on this hash.
    const source = silent([scene([breath()])]);
    const result = compileDraft(source);
    if (!result.ok) throw new Error(codes(result.issues).join());
    expect(result.value.sourceRevision).toBe(hashValue(source));
  });

  it("leaves a scene without repeats exactly as before", () => {
    const { repeat: _repeat, ...plain } = breath();
    const beats = compiledBeats(silent([scene([plain as Beat])]));
    expect(beats.map((beat) => beat.id)).toEqual(["breath"]);
  });
});
