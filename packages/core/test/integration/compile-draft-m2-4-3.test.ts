import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft, ScenesSchema } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

const presentation = { opacity: 1, rotationDeg: 0, zIndex: 1 } as const;

const route: Extract<Layer, { type: "path" }> = {
  id: "route",
  type: "path",
  d: "M0 0 L100 0",
  viewBox: { minX: 0, minY: 0, width: 100, height: 50 },
  frame: { x: 100, y: 400, width: 800, height: 400 },
  stroke: { color: "#F2B705", width: 4 },
  ...presentation,
};

const ship: Extract<Layer, { type: "shape" }> = {
  id: "ship",
  type: "shape",
  shape: "rectangle",
  fill: "#1E2A26",
  frame: { x: 60, y: 380, width: 80, height: 40 },
  ...presentation,
};

const figure: Extract<Layer, { type: "text" }> = {
  id: "figure",
  type: "text",
  text: "50.000+",
  frame: { x: 100, y: 1200, width: 800, height: 200 },
  ...presentation,
};

const composition = (
  id: string,
  layers: Layer[],
  beats: Beat[],
  extra: Partial<Scene> = {},
): Scene => ({
  id,
  narrativeRole: "context",
  durationMs: 3000,
  visual: { type: "composition", layers },
  beats,
  transition: { type: "cut" },
  ...extra,
});

const silentSource = (scenes: Scene[]): PlanSource => {
  const source = narratedSource({ scenes });
  const { narration: _narration, ...rest } = source;
  return rest;
};

const parseScenes = (scenes: Scene[]) =>
  ScenesSchema.safeParse({ schemaVersion: 1, scenes });

describe("draw, follow and count beats (M2.4.3)", () => {
  it("accepts a drawn route, a follower and a counted figure", () => {
    const scene = composition(
      "route",
      [route, ship, figure],
      [
        {
          id: "draw",
          targetId: "route",
          action: "draw",
          startMs: 0,
          durationMs: 1000,
          params: {},
        },
        {
          id: "sail",
          targetId: "ship",
          action: "follow",
          startMs: 500,
          durationMs: 2000,
          params: { pathId: "route", orient: true },
        },
        {
          id: "count",
          targetId: "figure",
          action: "count",
          startMs: 1000,
          durationMs: 1000,
          params: { from: 0, to: 50000, grouping: ".", suffix: "+" },
        },
      ],
    );
    expect(parseScenes([scene]).success).toBe(true);
    const result = compileDraft(silentSource([scene]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [compiled] = result.value.scenes;
    // Path data stays in viewBox units; only the frame follows the draft scale.
    const path = compiled?.layers.find((layer) => layer.id === "route");
    expect(path).toMatchObject({
      d: "M0 0 L100 0",
      frame: { x: 50, y: 200, width: 400, height: 200 },
      stroke: { width: 4 },
    });
    expect(compiled?.beats.map((beat) => beat.action)).toEqual([
      "draw",
      "follow",
      "count",
    ]);
  });

  it("rejects beats aimed at the wrong kind of layer", () => {
    const grouped = composition(
      "bad",
      [
        route,
        ship,
        { ...figure, spans: [{ text: "50.000+", emphasis: "accent" }] },
        {
          id: "rig",
          type: "group",
          memberIds: ["ship"],
          transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
          zIndex: 2,
        },
      ],
      [
        {
          id: "draw-ship",
          targetId: "ship",
          action: "draw",
          startMs: 0,
          durationMs: 500,
          params: {},
        },
        {
          id: "follow-grouped",
          targetId: "ship",
          action: "follow",
          startMs: 0,
          durationMs: 500,
          params: { pathId: "route" },
        },
        {
          id: "count-spans",
          targetId: "figure",
          action: "count",
          startMs: 0,
          durationMs: 500,
          params: { from: 0, to: 50000, grouping: ".", suffix: "+" },
        },
      ],
    );
    const parsed = parseScenes([grouped]);
    expect(parsed.success).toBe(false);
    const messages = parsed.error?.issues.map((issue) => issue.message) ?? [];
    expect(messages).toEqual(
      expect.arrayContaining([
        "A draw beat targets a path layer",
        "A follow beat moves an ungrouped text, image or shape layer",
        "A count beat targets a text layer without spans",
      ]),
    );
  });

  it("keeps a follower in its path's plane", () => {
    const scene = composition(
      "planes",
      [
        { ...route, space: "world", parallax: 2 },
        { ...ship, space: "world" },
      ],
      [
        {
          id: "sail",
          targetId: "ship",
          action: "follow",
          startMs: 0,
          durationMs: 500,
          params: { pathId: "route" },
        },
      ],
    );
    const parsed = parseScenes([scene]);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toContain("share one plane");
  });

  it("requires a billboard group to live in the world", () => {
    const scene = composition(
      "labels",
      [
        figure,
        {
          id: "rig",
          type: "group",
          memberIds: ["figure"],
          transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
          zIndex: 2,
          billboard: { x: 500, y: 1200 },
        },
      ],
      [],
    );
    expect(parseScenes([scene]).success).toBe(false);
  });

  it("scales a billboard point with the draft", () => {
    const scene = composition(
      "labels",
      [
        figure,
        {
          id: "rig",
          type: "group",
          memberIds: ["figure"],
          transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
          zIndex: 2,
          space: "world",
          billboard: { x: 500, y: 1200 },
        },
      ],
      [],
    );
    const result = compileDraft(silentSource([scene]));
    if (!result.ok) throw new Error(codes(result.issues).join());
    expect(
      result.value.scenes[0]?.layers.find((layer) => layer.id === "rig"),
    ).toMatchObject({ billboard: { x: 250, y: 600 } });
  });

  it("rejects a path laid onto a frame of another shape", () => {
    const scene = composition(
      "stretched",
      [{ ...route, frame: { x: 100, y: 400, width: 800, height: 800 } }],
      [],
    );
    const result = compileDraft(silentSource([scene]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("PATH_VIEWBOX_ASPECT");
  });

  it("requires counted text to read the settled value as formatted", () => {
    const count = (to: number): Beat => ({
      id: "count",
      targetId: "figure",
      action: "count",
      startMs: 0,
      durationMs: 1000,
      params: { from: 0, to, grouping: ".", suffix: "+" },
    });
    const wrong = compileDraft(
      silentSource([composition("n", [figure], [count(40000)])]),
    );
    expect(wrong.ok).toBe(false);
    expect(codes(wrong.issues)).toContain("COUNT_TEXT_MISMATCH");
    const right = compileDraft(
      silentSource([composition("n", [figure], [count(50000)])]),
    );
    expect(right.ok).toBe(true);
  });

  it("rejects overlapping writes to one position, path or number", () => {
    const scene = composition(
      "clash",
      [route, ship, figure],
      [
        {
          id: "sail",
          targetId: "ship",
          action: "follow",
          startMs: 0,
          durationMs: 1000,
          params: { pathId: "route" },
        },
        {
          id: "nudge",
          targetId: "ship",
          action: "transform",
          startMs: 500,
          durationMs: 1000,
          params: { to: { x: 40 } },
        },
        {
          id: "draw-a",
          targetId: "route",
          action: "draw",
          startMs: 0,
          durationMs: 1000,
          params: {},
        },
        {
          id: "draw-b",
          targetId: "route",
          action: "draw",
          startMs: 900,
          durationMs: 500,
          params: { from: 1, to: 0 },
        },
        {
          id: "count-a",
          targetId: "figure",
          action: "count",
          startMs: 0,
          durationMs: 1000,
          params: { from: 0, to: 20000, grouping: "." },
        },
        {
          id: "count-b",
          targetId: "figure",
          action: "count",
          startMs: 500,
          durationMs: 1000,
          params: { from: 20000, to: 50000, grouping: ".", suffix: "+" },
        },
      ],
    );
    const result = compileDraft(silentSource([scene]));
    expect(result.ok).toBe(false);
    const overlaps = result.issues.filter(
      (issue) => issue.code === "MOTION_PROPERTY_OVERLAP",
    );
    expect(overlaps.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("writes x on ship"),
        expect.stringContaining("writes draw on route"),
        expect.stringContaining("writes text on figure"),
      ]),
    );
  });

  it("lets a fade-in with no travel overlap a follower's journey", () => {
    const scene = composition(
      "fade",
      [route, ship],
      [
        {
          id: "sail",
          targetId: "ship",
          action: "follow",
          startMs: 0,
          durationMs: 2000,
          params: { pathId: "route" },
        },
        {
          id: "appear",
          targetId: "ship",
          action: "reveal",
          startMs: 200,
          durationMs: 500,
          params: { direction: "up", distance: 0 },
        },
      ],
    );
    expect(compileDraft(silentSource([scene])).ok).toBe(true);
  });

  it("lets camera-framed world text sit outside the design canvas, but not other text", () => {
    const outside = { ...figure, frame: { ...figure.frame, x: 1200 } };
    const rig: Layer = {
      id: "rig",
      type: "group",
      memberIds: ["figure"],
      transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
      zIndex: 2,
      space: "world",
    };
    const framed = composition("framed", [outside, rig], [], {
      camera: { initial: { x: 400, y: 0, zoom: 1 }, moves: [] },
    });
    expect(compileDraft(silentSource([framed])).ok).toBe(true);
    const unframed = composition("unframed", [outside, rig], []);
    const result = compileDraft(silentSource([unframed]));
    expect(codes(result.issues)).toContain("LAYER_OUTSIDE_CANVAS");
  });
});

describe("phrase-anchored beats (M2.4.3)", () => {
  const anchored = (beats: Beat[]): Scene => ({
    ...composition("s1", [ship], beats),
    narration: { blockId: "context" },
  });
  const source = (beats: Beat[], c1StartMs = 100) => {
    const base = narratedSource({
      scenes: [
        anchored(beats),
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ],
    });
    const block = base.narration?.blocks[0];
    if (block && "phrases" in block && block.phrases[0]) {
      block.phrases[0].startMs = c1StartMs;
    }
    return base;
  };
  const nudge = (id: string, startMs: number, at?: Beat["at"]): Beat => ({
    id,
    targetId: "ship",
    action: "transform",
    startMs,
    durationMs: 300,
    params: { to: { x: 40 } },
    ...(at ? { at } : {}),
  });

  it("starts a beat at its phrase plus offset, and moves it when the phrase moves", () => {
    const beat = nudge("nudge", 0, { phraseId: "c1", offsetMs: 200 });
    const first = compileDraft(source([beat]));
    if (!first.ok) throw new Error(codes(first.issues).join());
    expect(first.value.scenes[0]?.beats[0]?.startFrame).toBe(9);
    const moved = compileDraft(source([beat], 400));
    if (!moved.ok) throw new Error(codes(moved.issues).join());
    expect(moved.value.scenes[0]?.beats[0]?.startFrame).toBe(18);
    // The retimed beat is a different render.
    expect(moved.value.assemblyKey).not.toBe(first.value.assemblyKey);
  });

  it("keeps the authored time in a silent draft", () => {
    const beat = nudge("nudge", 600, { phraseId: "c1", offsetMs: 200 });
    const result = compileDraft(silentSource([anchored([beat])]));
    if (!result.ok) throw new Error(codes(result.issues).join());
    expect(result.value.scenes[0]?.beats[0]?.startFrame).toBe(18);
  });

  it("checks overlaps at the resolved times, not the authored ones", () => {
    const beats = [
      nudge("first", 0),
      nudge("second", 600, { phraseId: "c1", offsetMs: 0 }),
    ];
    expect(compileDraft(silentSource([anchored(beats)])).ok).toBe(true);
    const narrated = compileDraft(source(beats));
    expect(narrated.ok).toBe(false);
    expect(codes(narrated.issues)).toContain("MOTION_PROPERTY_OVERLAP");
  });

  it("rejects an unknown phrase and a phrase outside the scene", () => {
    const unknown = compileDraft(
      source([nudge("nudge", 0, { phraseId: "nope" })]),
    );
    expect(codes(unknown.issues)).toContain("BEAT_PHRASE_UNKNOWN");
    // c2 is where s2 begins, so it is not a moment of s1.
    const outside = compileDraft(
      source([nudge("nudge", 0, { phraseId: "c2" })]),
    );
    expect(codes(outside.issues)).toContain("BEAT_PHRASE_OUTSIDE_SCENE");
  });

  it("resolves the same local start in a scene preview", () => {
    const beat = nudge("nudge", 0, { phraseId: "c1", offsetMs: 200 });
    const result = compileDraft(source([beat]), {
      type: "scene",
      sceneId: "s1",
    });
    if (!result.ok) throw new Error(codes(result.issues).join());
    expect(result.value.scenes[0]?.beats[0]?.startFrame).toBe(9);
  });
});

describe("render identity of new geometry", () => {
  it("changes the assembly key when a path's data changes", () => {
    const scene = (d: string) => composition("route", [{ ...route, d }], []);
    const a = compileDraft(silentSource([scene("M0 0 L100 0")]));
    const b = compileDraft(silentSource([scene("M0 0 L100 50")]));
    if (!a.ok || !b.ok) throw new Error("expected both to compile");
    expect(a.value.assemblyKey).not.toBe(b.value.assemblyKey);
  });
});

describe("supervisor findings, 2026-09-27", () => {
  // One scene over the whole context block, so it covers phrases c1 and c2.
  const countSource = (text: string, c2StartMs: number, beats: Beat[]) => {
    const base = narratedSource({
      scenes: [
        {
          ...composition("s1", [{ ...figure, text }], beats),
          narration: { blockId: "context" },
        },
        narratedScene("s3", { blockId: "mechanism" }),
      ],
    });
    const block = base.narration?.blocks[0];
    if (block && "phrases" in block && block.phrases[1]) {
      block.phrases[1].startMs = c2StartMs;
      block.phrases[1].endMs = c2StartMs + 200;
    }
    return base;
  };
  const count = (
    id: string,
    startMs: number,
    to: number,
    at: NonNullable<Beat["at"]>,
  ): Beat => ({
    id,
    targetId: "figure",
    action: "count",
    startMs,
    durationMs: 100,
    at,
    params: { from: 0, to },
  });

  it("judges the settled count in resolved order when anchors reverse the authored order", () => {
    // Authored: "twenty" first, "ten" last. Resolved: ten at 100 ms, twenty
    // at 1200 ms, so the renderer ends on 20.
    const beats = [
      count("twenty", 0, 20, { phraseId: "c2" }),
      count("ten", 1000, 10, { phraseId: "c1" }),
    ];
    const stale = compileDraft(countSource("10", 1200, beats));
    expect(stale.ok).toBe(false);
    expect(codes(stale.issues)).toContain("COUNT_TEXT_MISMATCH");
    expect(compileDraft(countSource("20", 1200, beats)).ok).toBe(true);
  });

  it("follows the phrase timing when a retime swaps which count ends last", () => {
    const beats = [
      count("twenty", 0, 20, { phraseId: "c2", offsetMs: -1000 }),
      count("ten", 1000, 10, { phraseId: "c1", offsetMs: 400 }),
    ];
    // c2 at 1200: twenty at 200 ms, ten at 500 ms -> ends on 10.
    expect(compileDraft(countSource("10", 1200, beats)).ok).toBe(true);
    expect(
      codes(compileDraft(countSource("20", 1200, beats)).issues),
    ).toContain("COUNT_TEXT_MISMATCH");
    // c2 at 2000: twenty at 1000 ms, ten at 500 ms -> ends on 20.
    expect(compileDraft(countSource("20", 2000, beats)).ok).toBe(true);
    expect(
      codes(compileDraft(countSource("10", 2000, beats)).issues),
    ).toContain("COUNT_TEXT_MISMATCH");
  });

  const sail: Beat = {
    id: "sail",
    targetId: "ship",
    action: "follow",
    startMs: 0,
    durationMs: 1000,
    params: { pathId: "route" },
  };

  it("refuses a follower on a rotated path", () => {
    const result = compileDraft(
      silentSource([
        composition("rotated", [{ ...route, rotationDeg: 90 }, ship], [sail]),
      ]),
    );
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("FOLLOW_PATH_TRANSFORMED");
  });

  it("refuses a follower on a path that its beats move or scale", () => {
    for (const mover of [
      {
        id: "slide",
        targetId: "route",
        action: "transform",
        startMs: 0,
        durationMs: 500,
        params: { to: { x: 40 } },
      },
      {
        id: "pulse",
        targetId: "route",
        action: "emphasize",
        startMs: 0,
        durationMs: 500,
        params: { scale: 1.2 },
      },
      {
        id: "rise",
        targetId: "route",
        action: "reveal",
        startMs: 0,
        durationMs: 500,
        params: { direction: "up", distance: 30 },
      },
    ] satisfies Beat[]) {
      const result = compileDraft(
        silentSource([composition("moved", [route, ship], [sail, mover])]),
      );
      expect(codes(result.issues)).toContain("FOLLOW_PATH_TRANSFORMED");
    }
  });

  it("still lets a followed path be drawn, faded in and faded out", () => {
    const result = compileDraft(
      silentSource([
        composition(
          "drawn",
          [route, ship],
          [
            sail,
            {
              id: "draw",
              targetId: "route",
              action: "draw",
              startMs: 0,
              durationMs: 500,
              params: {},
            },
            {
              id: "appear",
              targetId: "route",
              action: "reveal",
              startMs: 0,
              durationMs: 300,
              params: { direction: "up", distance: 0 },
            },
            {
              id: "leave",
              targetId: "route",
              action: "exit",
              startMs: 2000,
              durationMs: 300,
              params: {},
            },
          ],
        ),
      ]),
    );
    expect(result.ok).toBe(true);
  });
});
