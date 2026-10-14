import {
  CaptionsSchema,
  type CompileOptions,
  compileDraft,
  computeSceneRenderKeys,
  type DraftScope,
  generationKeyForBlock,
  validatePlanSource,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const resultFor = (
  source: ReturnType<typeof narratedSource>,
  options: CompileOptions & { scope?: DraftScope } = {},
) => {
  const { scope, ...settings } = options;
  return compileDraft(source, scope ?? { type: "project" }, settings);
};
const compile = (
  source: ReturnType<typeof narratedSource>,
  options: CompileOptions & { scope?: DraftScope } = {},
) => {
  const result = resultFor(source, options);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
};
const selected = {
  schemaVersion: 1 as const,
  corrections: [],
  mode: "selected" as const,
  selections: [
    {
      blockId: "context",
      phraseId: "c2",
      startOffsetMs: 100,
      endOffsetMs: 700,
    },
  ],
};

describe("caption policy", () => {
  it("preserves legacy source shape and full cues when policy is omitted", () => {
    expect(CaptionsSchema.parse({ schemaVersion: 1, corrections: [] })).toEqual(
      { schemaVersion: 1, corrections: [] },
    );
    const legacy = compile(narratedSource());
    const explicit = compile(
      narratedSource({
        captions: { schemaVersion: 1, corrections: [], mode: "full" },
      }),
    );
    expect(explicit.captions).toEqual(legacy.captions);
    expect(explicit.assemblyKey).toBe(legacy.assemblyKey);
    expect(explicit.sourceRevision).not.toBe(legacy.sourceRevision);
  });

  it.each(["none", "selected"] as const)(
    "omits every caption object for %s with no selections, without touching narration",
    (mode) => {
      const source = narratedSource({
        captions: { schemaVersion: 1, corrections: [], mode },
      });
      const plain = compile(narratedSource());
      for (const resolution of [540, 1080] as const) {
        const draft = compile(source, { resolution });
        expect(draft.captions).toBeUndefined();
        expect(draft.narration).toEqual(plain.narration);
        expect(draft.totalFrames).toBe(plain.totalFrames);
      }
      expect(
        compile(source, { scope: { type: "scene", sceneId: "s2" } }).captions,
      ).toBeUndefined();
    },
  );

  it("inherits the profile mode and lets the project override an unlocked default", () => {
    expect(
      compile(narratedSource({ captionStyle: { mode: "none" } })).captions,
    ).toBeUndefined();
    expect(
      compile(
        narratedSource({
          captionStyle: { mode: "none" },
          captions: { schemaVersion: 1, corrections: [], mode: "full" },
        }),
      ).captions?.cues,
    ).toHaveLength(3);
  });

  it.each(["render.captions", "render.captions.mode"])(
    "honors the %s lock including an implicit full default",
    (locked) => {
      const source = narratedSource({
        lockedPaths: [locked],
        captions: { schemaVersion: 1, corrections: [], mode: "none" },
      });
      expect(validatePlanSource(source).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "CAPTION_MODE_LOCKED",
            artifact: "captions.json",
            path: "/mode",
          }),
        ]),
      );
      for (const options of [
        {},
        { resolution: 1080 as const },
        { scope: { type: "scene" as const, sceneId: "s2" } },
        { mode: "final" as const },
      ])
        expect(resultFor(source, options).ok).toBe(false);
      expect(
        validatePlanSource(
          narratedSource({
            lockedPaths: [locked],
            captions: { schemaVersion: 1, corrections: [], mode: "full" },
          }),
        ).ok,
      ).toBe(true);
    },
  );

  it("uses one measured phrase-local selection in full and scoped previews", () => {
    const source = narratedSource({ captions: selected });
    expect(compile(source).captions?.cues).toEqual([
      {
        id: "context/c2",
        text: "Erupsinya panjang.",
        startFrame: 39,
        endFrame: 57,
      },
    ]);
    expect(
      compile(source, { scope: { type: "scene", sceneId: "s2" } }).captions
        ?.cues,
    ).toEqual([
      {
        id: "context/c2",
        text: "Erupsinya panjang.",
        startFrame: 3,
        endFrame: 21,
      },
    ]);
  });

  it("rounds on the global clock before scoped clipping at off-grid scene boundaries", () => {
    const source = narratedSource({
      captions: {
        ...selected,
        selections: [
          {
            blockId: "context",
            phraseId: "c2",
            startOffsetMs: 22,
            endOffsetMs: 123,
          },
        ],
      },
    });
    const block = source.narration?.blocks[0];
    if (!block || !("phrases" in block)) throw Error("fixture");
    const phrase = block.phrases[1];
    if (!phrase) throw Error("fixture");
    phrase.startMs = 1217;
    const full = compile(source),
      scoped = compile(source, { scope: { type: "scene", sceneId: "s2" } });
    const origin =
      scoped.scope.type === "scene" ? scoped.scope.sourceStartFrame : null;
    expect(origin).toBe(37);
    expect(scoped.captions?.cues).toEqual(
      full.captions?.cues.map((cue) => ({
        ...cue,
        startFrame: cue.startFrame - (origin ?? 0),
        endFrame: cue.endFrame - (origin ?? 0),
      })),
    );
    expect(scoped.captions?.cues[0]?.startFrame).toBe(0);
  });

  it("clips a one-millisecond selection after frame rounding, including across block boundaries", () => {
    const source = narratedSource({
      captions: {
        schemaVersion: 1,
        corrections: [],
        mode: "selected",
        selections: [
          {
            blockId: "context",
            phraseId: "c1",
            startOffsetMs: 1099,
            endOffsetMs: 1100,
          },
        ],
      },
    });
    const block = source.narration?.blocks[0];
    if (!block || !("phrases" in block)) throw Error("fixture");
    const phrase = block.phrases[0];
    if (!phrase) throw Error("fixture");
    phrase.endMs = 1200;
    expect(compile(source).captions?.cues[0]).toMatchObject({
      startFrame: 36,
      endFrame: 37,
    });
    expect(
      compile(source, { scope: { type: "scene", sceneId: "s1" } }).captions,
    ).toBeUndefined();
    expect(
      compile(source, { scope: { type: "scene", sceneId: "s2" } }).captions
        ?.cues[0],
    ).toMatchObject({ id: "context/c1", startFrame: 0, endFrame: 1 });
    source.captions = {
      schemaVersion: 1,
      corrections: [],
      mode: "selected",
      selections: [
        {
          blockId: "context",
          phraseId: "c2",
          startOffsetMs: 1199,
          endOffsetMs: 1200,
        },
      ],
    };
    const last = block.phrases[1];
    if (!last) throw Error("fixture");
    last.endMs = 2400;
    block.pauseAfterMs = 0;
    expect(compile(source).captions?.cues[0]).toMatchObject({
      startFrame: 72,
      endFrame: 73,
    });
    expect(
      compile(source, { scope: { type: "scene", sceneId: "s3" } }).captions
        ?.cues[0],
    ).toMatchObject({ id: "context/c2", startFrame: 0, endFrame: 1 });
  });

  it.each(["none", "selected", "full"] as const)(
    "rejects unknown and out-of-range selections even under %s",
    (mode) => {
      for (const selections of [
        [{ blockId: "context", phraseId: "missing" }],
        [{ blockId: "context", phraseId: "c2", endOffsetMs: 1001 }],
        [{ blockId: "context", phraseId: "c2", startOffsetMs: 1000 }],
      ]) {
        const result = validatePlanSource(
          narratedSource({
            captions: { schemaVersion: 1, corrections: [], mode, selections },
          }),
        );
        expect(result.ok).toBe(false);
        expect(
          result.issues.some((i) => i.code.startsWith("CAPTION_SELECTION_")),
        ).toBe(true);
      }
    },
  );

  it("rejects duplicate, inverted and unmeasured selections", () => {
    expect(
      CaptionsSchema.safeParse({
        ...selected,
        selections: [selected.selections[0], selected.selections[0]],
      }).success,
    ).toBe(false);
    expect(
      CaptionsSchema.safeParse({
        ...selected,
        selections: [
          {
            blockId: "context",
            phraseId: "c2",
            startOffsetMs: 200,
            endOffsetMs: 100,
          },
        ],
      }).success,
    ).toBe(false);
    const source = narratedSource({ captions: selected });
    if (!source.narration) throw Error("fixture");
    source.narration.blocks[0] = { id: "context", text: "Planned" };
    expect(
      validatePlanSource(source).issues.some(
        (i) => i.code === "CAPTION_SELECTION_UNMEASURED",
      ),
    ).toBe(true);
  });

  it("keeps corrections separate from spoken text, selection and voice identity", () => {
    const before = narratedSource();
    const after = narratedSource({
      captions: {
        ...selected,
        corrections: [
          {
            id: "display",
            blockId: "context",
            phraseId: "c2",
            displayText: "Erupsi berlangsung lama.",
            reason: "Display only",
          },
        ],
      },
    });
    expect(compile(after).captions?.cues[0]?.text).toBe(
      "Erupsi berlangsung lama.",
    );
    expect(after.narration).toEqual(before.narration);
    for (const block of before.narration?.blocks ?? [])
      expect(generationKeyForBlock(after, block)).toBe(
        generationKeyForBlock(before, block),
      );
    const oldKeys = computeSceneRenderKeys(compile(before));
    const newKeys = computeSceneRenderKeys(compile(after));
    expect(newKeys[1]?.key).not.toBe(oldKeys[1]?.key);
  });

  it("resolves style overrides at both resolutions and refuses locked style overrides", () => {
    const source = narratedSource({
      overridablePaths: ["render.captions"],
      overrides: {
        "render.captions.fontSize": 60,
        "render.captions.sideOffset": 72,
        "render.captions.scrimOpacity": 0,
        "render.captions.lineHeight": 1.5,
      },
    });
    const resolved = validatePlanSource(source);
    if (!resolved.ok) throw Error(JSON.stringify(resolved.issues));
    expect(
      compile(resolved.value, { resolution: 540 }).captions?.style,
    ).toMatchObject({
      fontSize: 30,
      side: 36,
      scrimOpacity: 0,
      lineHeight: 1.5,
    });
    expect(
      compile(resolved.value, { resolution: 1080 }).captions?.style,
    ).toMatchObject({
      fontSize: 60,
      side: 72,
      scrimOpacity: 0,
      lineHeight: 1.5,
    });
    source.profile.lockedPaths = ["render.captions.scrimOpacity"];
    expect(
      validatePlanSource(source).issues.some(
        (i) => i.code === "OVERRIDE_LOCKED",
      ),
    ).toBe(true);
  });
});
