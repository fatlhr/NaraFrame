import type { PlanSource } from "@naraframe/core";
import {
  compileDraft,
  computeSceneRenderKeys,
  generationKeyForBlock,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const compile = (
  source: PlanSource,
  scope?: { type: "scene"; sceneId: string },
) => {
  const result = compileDraft(source, scope);
  if (!result.ok)
    throw new Error(`compile failed: ${result.issues.map((i) => i.code)}`);
  return result.value;
};

const keysById = (source: PlanSource): Record<string, string> =>
  Object.fromEntries(
    computeSceneRenderKeys(compile(source)).map((k) => [k.sceneId, k.key]),
  );

const withSceneText = (
  source: PlanSource,
  id: string,
  text: string,
): PlanSource => ({
  ...source,
  scenes: {
    ...source.scenes,
    scenes: source.scenes.scenes.map((scene) =>
      scene.id === id ? { ...scene, visual: { type: "text", text } } : scene,
    ),
  },
});

describe("generationKeyForBlock", () => {
  const block = (source: PlanSource) => {
    const found = source.narration?.blocks[0];
    if (!found) throw new Error("fixture");
    return found;
  };

  it("ignores whitespace and changes with the spoken text or the profile voice style", () => {
    const source = narratedSource();
    const base = generationKeyForBlock(source, block(source));
    expect(base).toMatch(/^[a-f0-9]{64}$/);

    const spaced = {
      ...block(source),
      text: `  ${block(source).text.replace(" ", "   ")} \n`,
    };
    expect(generationKeyForBlock(source, spaced)).toBe(base);
    expect(
      generationKeyForBlock(source, { ...block(source), text: "Teks lain." }),
    ).not.toBe(base);

    const otherVoice: PlanSource = {
      ...source,
      profile: {
        ...source.profile,
        production: {
          ...source.profile.production,
          voiceStyleSignature: "another-voice",
        },
      },
    };
    expect(generationKeyForBlock(otherVoice, block(otherVoice))).not.toBe(base);
  });
});

describe("sceneRenderKey", () => {
  it("is stable across compiles and differs per scene", () => {
    const keys = keysById(narratedSource());
    expect(keysById(narratedSource())).toEqual(keys);
    expect(new Set(Object.values(keys)).size).toBe(3);
  });

  it("changes only for the scene whose own content changed", () => {
    const before = keysById(narratedSource());
    const after = keysById(
      withSceneText(narratedSource(), "s3", "Teks scene tiga berubah"),
    );
    expect(after.s1).toBe(before.s1);
    expect(after.s2).toBe(before.s2);
    expect(after.s3).not.toBe(before.s3);
  });

  it("does not invalidate a later scene when an earlier clip only moves it in time", () => {
    const before = keysById(narratedSource());
    const after = keysById(narratedSource({ contextDurationMs: 3000 }));
    // s3 starts 500 ms later, yet its own content, audio and local timing are the same.
    expect(after.s3).toBe(before.s3);
    // s2 owns the longer tail of the context block, so it does change.
    expect(after.s2).not.toBe(before.s2);
  });

  it("changes when a caption shown in the scene changes", () => {
    const before = keysById(narratedSource());
    const after = keysById(
      narratedSource({
        captions: {
          schemaVersion: 1,
          corrections: [
            {
              id: "fix",
              blockId: "context",
              phraseId: "c2",
              displayText: "Erupsinya sangat panjang.",
              reason: "clearer",
            },
          ],
        },
      }),
    );
    expect(after.s2).not.toBe(before.s2);
    expect(after.s3).toBe(before.s3);
  });

  it("changes when a pixel-relevant profile token changes but not for lint-only policy", () => {
    const base = narratedSource();
    const before = keysById(base);
    const recolored: PlanSource = {
      ...base,
      profile: {
        ...base.profile,
        render: {
          ...base.profile.render,
          palette: { ...base.profile.render.palette, accent: "#00FF00" },
        },
      },
    };
    expect(keysById(recolored).s1).not.toBe(before.s1);

    const policy: PlanSource = {
      ...base,
      profile: {
        ...base.profile,
        render: {
          ...base.profile.render,
          variety: { maxConsecutiveSameEntry: 5 },
        },
      },
    };
    expect(keysById(policy)).toEqual(before);
  });
});

describe("assemblyKey", () => {
  it("is deterministic and independent of the source revision when nothing rendered changes", () => {
    const base = narratedSource();
    const editorial: PlanSource = {
      ...base,
      scenes: {
        ...base.scenes,
        sources: [{ id: "pvmbg", title: "PVMBG bulletin" }],
      },
    };
    const a = compile(base);
    const b = compile(editorial);
    expect(b.sourceRevision).not.toBe(a.sourceRevision);
    expect(b.assemblyKey).toBe(a.assemblyKey);
    expect(compile(base).assemblyKey).toBe(a.assemblyKey);
  });

  it("changes when a scene, the audio, or the scope changes", () => {
    const base = compile(narratedSource());
    expect(
      compile(withSceneText(narratedSource(), "s1", "Berubah")).assemblyKey,
    ).not.toBe(base.assemblyKey);
    expect(
      compile(
        narratedSource({
          contextAsset: { id: "voice-context-v2", sha256: "c".repeat(64) },
        }),
      ).assemblyKey,
    ).not.toBe(base.assemblyKey);
    expect(
      compile(narratedSource(), { type: "scene", sceneId: "s1" }).assemblyKey,
    ).not.toBe(base.assemblyKey);
  });

  it("changes when scenes are placed in a different order on the timeline", () => {
    const base = narratedSource();
    const swapped = narratedSource({
      scenes: [
        narratedScene("s1", { blockId: "context" }),
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ].map((scene) => (scene.id === "s3" ? { ...scene, id: "s3" } : scene)),
    });
    expect(compile(swapped).assemblyKey).toBe(compile(base).assemblyKey);
    const renamed = narratedSource({
      scenes: [
        narratedScene("s1", { blockId: "context" }),
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s4", { blockId: "mechanism" }),
      ],
    });
    expect(compile(renamed).assemblyKey).not.toBe(compile(base).assemblyKey);
  });
});
