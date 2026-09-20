import type { PlanSource } from "@naraframe/core";
import {
  compileDraft,
  computeSceneRenderKeys,
  generationKeyForBlock,
  narrationTextHash,
  pendingGeneration,
  ScenesSchema,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const bound = (source: PlanSource): PlanSource => ({
  ...source,
  assets: {
    ...source.assets,
    assets: source.assets.assets.map((asset) => {
      if (asset.status !== "ready" || asset.kind === "png") return asset;
      const text = source.narration?.blocks.find(
        (block) => "audioAssetId" in block && block.audioAssetId === asset.id,
      )?.text;
      return text
        ? { ...asset, generation: { textSha256: narrationTextHash(text) } }
        : asset;
    }),
  },
});

const base = () => bound(narratedSource());

const compiled = (source: PlanSource) => {
  const result = compileDraft(source);
  if (!result.ok)
    throw new Error(`compile failed: ${result.issues.map((i) => i.code)}`);
  return result.value;
};

const keys = (source: PlanSource) =>
  Object.fromEntries(
    computeSceneRenderKeys(compiled(source)).map((k) => [k.sceneId, k.key]),
  );

const blockKeys = (source: PlanSource) =>
  Object.fromEntries(
    (source.narration?.blocks ?? []).map((block) => [
      block.id,
      generationKeyForBlock(source, block),
    ]),
  );

const withSceneField = (
  source: PlanSource,
  sceneId: string,
  fields: Record<string, unknown>,
): PlanSource => ({
  ...source,
  scenes: {
    ...source.scenes,
    scenes: source.scenes.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...fields } : scene,
    ),
  },
});

describe("pendingGeneration", () => {
  it("is empty for a project whose audio is ready and bound to its text", () => {
    expect(pendingGeneration(base())).toEqual([]);
  });

  it("lists a block with no audio, a block whose text changed, and a block whose voice style changed", () => {
    const source = base();
    const planned: PlanSource = {
      ...source,
      narration: {
        schemaVersion: 1,
        order: ["context", "mechanism"],
        blocks: [
          { id: "context", text: "Belum direkam." },
          ...(source.narration?.blocks.filter((b) => b.id === "mechanism") ??
            []),
        ],
      },
    };
    expect(pendingGeneration(planned)).toEqual([
      expect.objectContaining({ blockId: "context", reason: "no-audio" }),
    ]);

    const edited: PlanSource = {
      ...source,
      narration: {
        ...source.narration,
        blocks: (source.narration?.blocks ?? []).map((block) =>
          block.id === "mechanism"
            ? { ...block, text: "Tekanan magma turun." }
            : block,
        ),
      } as PlanSource["narration"],
    };
    expect(pendingGeneration(edited)).toEqual([
      expect.objectContaining({
        blockId: "mechanism",
        reason: "stale-text",
        generationKey: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    ]);

    const restyled: PlanSource = {
      ...source,
      assets: {
        ...source.assets,
        assets: source.assets.assets.map((asset) =>
          asset.id === "voice-context" &&
          asset.status === "ready" &&
          asset.kind !== "png" &&
          asset.generation
            ? {
                ...asset,
                generation: {
                  ...asset.generation,
                  voiceStyleSignature: "old-voice",
                },
              }
            : asset,
        ),
      },
    };
    expect(pendingGeneration(restyled)).toEqual([
      expect.objectContaining({ blockId: "context", reason: "voice-style" }),
    ]);
  });

  it("does not list audio that merely has no recorded binding", () => {
    expect(pendingGeneration(narratedSource())).toEqual([]);
  });
});

describe("edits that must not cost a generation call or touch other scenes", () => {
  const before = base();
  const beforeKeys = keys(before);
  const beforeBlockKeys = blockKeys(before);

  it("a caption correction changes only the scene that shows that caption", () => {
    const after: PlanSource = {
      ...before,
      captions: {
        schemaVersion: 1,
        corrections: [
          {
            id: "fix",
            blockId: "context",
            phraseId: "c2",
            displayText: "Erupsinya sangat panjang.",
            reason: "wording",
          },
        ],
      },
    };
    expect(pendingGeneration(after)).toEqual([]);
    expect(blockKeys(after)).toEqual(beforeBlockKeys);
    const afterKeys = keys(after);
    expect(afterKeys.s1).toBe(beforeKeys.s1);
    expect(afterKeys.s3).toBe(beforeKeys.s3);
    expect(afterKeys.s2).not.toBe(beforeKeys.s2);
  });

  it("a caption style change reaches only scenes that show captions, and no voice", () => {
    const after: PlanSource = {
      ...before,
      profile: {
        ...before.profile,
        render: {
          ...before.profile.render,
          captions: { fontSize: 60, maxLines: 3 },
        },
      },
    };
    expect(pendingGeneration(after)).toEqual([]);
    expect(blockKeys(after)).toEqual(beforeBlockKeys);
    const afterKeys = keys(after);
    // Every scene here overlaps a caption, so all change; none needed new audio.
    expect(
      Object.values(afterKeys).every(
        (key, i) => key !== Object.values(beforeKeys)[i],
      ),
    ).toBe(true);
  });

  it("a layout or text edit in one scene leaves every other scene's key and every voice untouched", () => {
    const after = withSceneField(before, "s3", {
      visual: { type: "text", text: "Teks lain" },
    });
    expect(pendingGeneration(after)).toEqual([]);
    expect(blockKeys(after)).toEqual(beforeBlockKeys);
    const afterKeys = keys(after);
    expect(afterKeys.s1).toBe(beforeKeys.s1);
    expect(afterKeys.s2).toBe(beforeKeys.s2);
    expect(afterKeys.s3).not.toBe(beforeKeys.s3);
  });

  it("an editorial note changes the source revision but no pixels", () => {
    const after = withSceneField(before, "s2", {
      note: "Cek angka korban dengan sumber terbaru.",
    });
    const a = compiled(before);
    const b = compiled(after);
    expect(b.sourceRevision).not.toBe(a.sourceRevision);
    expect(b.assemblyKey).toBe(a.assemblyKey);
    expect(keys(after)).toEqual(beforeKeys);
    expect(pendingGeneration(after)).toEqual([]);
    expect(blockKeys(after)).toEqual(beforeBlockKeys);
  });

  it("accepts a note and rejects an empty one when the scenes file is parsed", () => {
    const scene = { ...before.scenes.scenes[0] };
    const parse = (note: string) =>
      ScenesSchema.safeParse({ schemaVersion: 1, scenes: [{ ...scene, note }] })
        .success;
    expect(parse("Cek ulang angkanya.")).toBe(true);
    expect(parse("   ")).toBe(false);
  });
});
