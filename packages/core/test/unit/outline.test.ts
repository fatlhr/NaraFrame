import type { PlanSource, Scene } from "@naraframe/core";
import {
  buildOutline,
  compileDraft,
  narrowOutlineToScene,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "../integration/narrated-source.js";

const still = { opacity: 1, rotationDeg: 0, zIndex: 1 };

const composition: Scene = {
  id: "density",
  narrativeRole: "evidence",
  durationMs: 4000,
  visual: {
    type: "composition",
    layers: [
      {
        id: "title",
        type: "text",
        text: "Es lebih ringan",
        frame: { x: 88, y: 200, width: 900, height: 300 },
        ...still,
      },
      {
        id: "bar",
        type: "shape",
        shape: "rectangle",
        fill: "palette.accent",
        frame: { x: 88, y: 600, width: 400, height: 40 },
        ...still,
      },
      {
        id: "pair",
        type: "group",
        memberIds: ["title", "bar"],
        transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
        zIndex: 2,
      },
    ],
  },
  beats: [
    {
      id: "show-title",
      targetId: "title",
      action: "reveal",
      startMs: 100,
      durationMs: 500,
      at: { phraseId: "c2", offsetMs: 50 },
      params: { direction: "up", distance: 24 },
    },
  ],
  camera: {
    initial: { x: 0, y: 0, zoom: 1 },
    moves: [
      {
        id: "push",
        startMs: 1000,
        durationMs: 1500,
        to: { x: 10, y: 0, zoom: 1.2 },
      },
    ],
  },
  transition: { type: "push-through", durationMs: 600, direction: "up" },
  narration: { blockId: "context", phraseId: "c2" },
  carriesFactualClaim: true,
  sourceIds: ["pvmbg"],
  note: "Takeaway: ice is lighter.",
};

const source = (): PlanSource => {
  const base = narratedSource({
    scenes: [
      {
        id: "intro",
        narrativeRole: "hook",
        durationMs: 3000,
        visual: { type: "text", text: "Halo" },
        beats: [],
        transition: { type: "cut" },
        narration: { blockId: "context" },
      },
      composition,
    ],
  });
  return {
    ...base,
    scenes: { ...base.scenes, sources: [{ id: "pvmbg", title: "PVMBG" }] },
    narration: {
      ...(base.narration as NonNullable<PlanSource["narration"]>),
      order: ["context", "mechanism", "outro"],
      blocks: [
        ...(base.narration?.blocks ?? []),
        { id: "outro", text: "Sampai jumpa." },
      ],
    },
  };
};

describe("buildOutline", () => {
  it("maps project, scenes, layers, beats, narration, captions and assets", () => {
    const loaded = source();
    const outline = buildOutline(loaded);

    expect(outline.project).toEqual({
      id: "narrated",
      title: "Narrated",
      profile: { id: "probe-profile", version: "0.1.0" },
      currentRevision: expect.stringMatching(/^[a-f0-9]{64}$/),
      sceneCount: 2,
      totalDurationMs: 7000,
    });
    expect(outline.scenes[0]).toEqual({
      id: "intro",
      role: "hook",
      startMs: 0,
      durationMs: 3000,
      transition: { type: "cut" },
      visual: { type: "text", text: "Halo" },
      narration: { blockId: "context" },
      beats: [],
    });
    expect(outline.scenes[1]).toEqual({
      id: "density",
      role: "evidence",
      startMs: 3000,
      durationMs: 4000,
      transition: { type: "push-through", durationMs: 600, direction: "up" },
      visual: { type: "composition" },
      camera: {
        initial: { x: 0, y: 0, zoom: 1 },
        moves: [
          {
            id: "push",
            startMs: 1000,
            durationMs: 1500,
            to: { x: 10, y: 0, zoom: 1.2 },
          },
        ],
      },
      narration: { blockId: "context", phraseId: "c2" },
      carriesFactualClaim: true,
      sourceIds: ["pvmbg"],
      note: "Takeaway: ice is lighter.",
      layers: [
        {
          id: "title",
          type: "text",
          text: "Es lebih ringan",
          frame: { x: 88, y: 200, width: 900, height: 300 },
        },
        {
          id: "bar",
          type: "shape",
          frame: { x: 88, y: 600, width: 400, height: 40 },
        },
        { id: "pair", type: "group", memberIds: ["title", "bar"] },
      ],
      beats: [
        {
          id: "show-title",
          action: "reveal",
          targetId: "title",
          startMs: 100,
          durationMs: 500,
          at: { phraseId: "c2", offsetMs: 50 },
          params: { direction: "up", distance: 24 },
        },
      ],
    });
    expect(outline.captions).toEqual({ mode: "full" });
    expect(outline.assets).toEqual([
      { id: "voice-context", kind: "mp3", status: "ready" },
      { id: "voice-mechanism", kind: "mp3", status: "ready" },
    ]);
    expect(outline.sources).toEqual([{ id: "pvmbg", title: "PVMBG" }]);
  });

  it("lists narration blocks in order with phrases but no word lists", () => {
    const loaded = source();
    const withWords = {
      ...loaded,
      narration: {
        ...(loaded.narration as NonNullable<PlanSource["narration"]>),
        blocks: (loaded.narration?.blocks ?? []).map((block) =>
          "phrases" in block
            ? {
                ...block,
                phrases: block.phrases.map((phrase) => ({
                  ...phrase,
                  words: [
                    {
                      id: "w1",
                      text: "x",
                      startMs: phrase.startMs,
                      endMs: phrase.startMs + 1,
                    },
                  ],
                })),
              }
            : block,
        ),
      },
    };
    const { narration } = buildOutline(withWords);

    expect(narration.map((block) => block.id)).toEqual([
      "context",
      "mechanism",
      "outro",
    ]);
    expect(narration[0]).toEqual({
      id: "context",
      text: "Krakatau memiliki sejarah. Erupsinya panjang.",
      status: "ready",
      audioAssetId: "voice-context",
      audioDurationMs: 2400,
      pauseAfterMs: 300,
      phrases: [
        {
          id: "c1",
          text: "Krakatau memiliki sejarah.",
          startMs: 100,
          endMs: 1000,
        },
        { id: "c2", text: "Erupsinya panjang.", startMs: 1200, endMs: 2200 },
      ],
    });
    expect(narration[2]).toEqual({
      id: "outro",
      text: "Sampai jumpa.",
      status: "planned",
    });
    expect(JSON.stringify(narration)).not.toContain('"words"');
  });

  it("reports the same revision as the draft compile and omits absent parts", () => {
    const loaded = narratedSource();
    const compiled = compileDraft(loaded);
    if (!compiled.ok) throw new Error("fixture must compile");
    expect(buildOutline(loaded).project.currentRevision).toBe(
      compiled.value.sourceRevision,
    );

    const { narration: _narration, ...withoutNarration } = loaded;
    const bare = buildOutline({
      ...withoutNarration,
      scenes: { ...loaded.scenes, scenes: [] },
    });
    expect(bare.narration).toEqual([]);
    expect(bare.scenes).toEqual([]);
    expect(bare.project.totalDurationMs).toBe(0);
  });
});

describe("narrowOutlineToScene", () => {
  const withPhoto = (): PlanSource => {
    const base = source();
    const [intro, density] = base.scenes.scenes;
    if (!intro || !density || density.visual.type !== "composition")
      throw new Error("fixture shape");
    return {
      ...base,
      scenes: {
        ...base.scenes,
        scenes: [
          intro,
          {
            ...density,
            visual: {
              type: "composition",
              layers: [
                ...density.visual.layers,
                {
                  id: "photo",
                  type: "image",
                  assetId: "photo-ice",
                  fit: "cover",
                  frame: { x: 0, y: 700, width: 540, height: 540 },
                  ...still,
                },
              ],
            },
          },
        ],
      },
      assets: {
        ...base.assets,
        assets: [
          ...base.assets.assets,
          {
            id: "photo-ice",
            status: "planned",
            kind: "png",
            purpose: "Ice cube",
            intendedOrigin: "generated",
          },
        ],
      },
    };
  };

  it("keeps one scene in full and narrows narration and assets to it", () => {
    const full = buildOutline(withPhoto());
    const narrowed = narrowOutlineToScene(full, "density");

    expect(narrowed?.scenes).toEqual([full.scenes[1]]);
    expect(narrowed?.scenes[0]?.layers?.map((layer) => layer.id)).toEqual([
      "title",
      "bar",
      "pair",
      "photo",
    ]);
    expect(narrowed?.narration.map((block) => block.id)).toEqual(["context"]);
    expect(narrowed?.assets).toEqual([
      { id: "photo-ice", kind: "png", status: "planned" },
    ]);
    expect(narrowed?.project).toEqual(full.project);
    expect(narrowed?.captions).toEqual(full.captions);
    expect(narrowed?.sources).toEqual(full.sources);
  });

  it("drops narration and assets a scene does not reference", () => {
    const full = buildOutline(withPhoto());
    const narrowed = narrowOutlineToScene(full, "intro");

    expect(narrowed?.scenes.map((scene) => scene.id)).toEqual(["intro"]);
    expect(narrowed?.narration.map((block) => block.id)).toEqual(["context"]);
    expect(narrowed?.assets).toEqual([]);

    const unvoiced = narrowOutlineToScene(
      {
        ...full,
        scenes: full.scenes.map((scene) => {
          const { narration: _narration, ...rest } = scene;
          return rest;
        }),
      },
      "intro",
    );
    expect(unvoiced?.narration).toEqual([]);
  });

  it("returns null for an unknown scene", () => {
    expect(narrowOutlineToScene(buildOutline(withPhoto()), "nope")).toBeNull();
  });
});
