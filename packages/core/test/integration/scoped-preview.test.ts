import type { PlanSource } from "@naraframe/core";
import {
  compileDraft,
  computeSceneRenderKeys,
  narrationTextHash,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const scoped = (source: PlanSource, sceneId: string) =>
  compileDraft(source, { type: "scene", sceneId });

const codes = (issues: Array<{ code: string }>) =>
  issues.map((issue) => issue.code);

const plannedContext = (): PlanSource => {
  const source = narratedSource();
  const mechanism = source.narration?.blocks.find(
    (block) => block.id === "mechanism",
  );
  return {
    ...source,
    narration: {
      schemaVersion: 1,
      order: ["context", "mechanism"],
      blocks: [
        { id: "context", text: "Belum direkam." },
        ...(mechanism ? [mechanism] : []),
      ],
    },
  };
};

describe("preview of one scene with narration", () => {
  it("gives the scene its own timeline, trims the block's clip, and shifts captions", () => {
    const result = scoped(narratedSource(), "s2");
    expect(result.ok, JSON.stringify(!result.ok && result.issues)).toBe(true);
    if (!result.ok) return;
    const draft = result.value;
    // In the whole project s2 is frames [36, 81).
    expect(draft.totalFrames).toBe(45);
    expect(draft.scenes).toHaveLength(1);
    expect(draft.scenes[0]).toMatchObject({
      id: "s2",
      startFrame: 0,
      endFrame: 45,
    });
    expect(draft.scope).toEqual({
      type: "scene",
      sceneId: "s2",
      sourceStartFrame: 36,
      sourceEndFrame: 81,
    });
    expect(draft.timelineScope).toBe("local");
    expect(draft.narration?.clips).toEqual([
      {
        blockId: "context",
        assetId: "voice-context",
        startMs: 0,
        durationMs: 2400,
        startFrame: 0,
        durationInFrames: 36,
        trimStartFrames: 36,
      },
    ]);
    // Only the phrase that belongs to this scene is captioned, from frame 0.
    expect(draft.captions?.cues).toEqual([
      {
        id: "context/c2",
        text: "Erupsinya panjang.",
        startFrame: 0,
        endFrame: 30,
      },
    ]);
  });

  it("does not trim a scene that starts at its block's start", () => {
    const result = scoped(narratedSource(), "s3");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalFrames).toBe(54);
    expect(result.value.scope).toMatchObject({
      sourceStartFrame: 81,
      sourceEndFrame: 135,
    });
    expect(result.value.narration?.clips[0]).toMatchObject({
      blockId: "mechanism",
      startFrame: 0,
      durationInFrames: 54,
    });
    expect(result.value.narration?.clips[0]?.trimStartFrames).toBeUndefined();
  });

  it("reports an unknown global offset instead of inventing one when an earlier block has no audio", () => {
    const source = plannedContext();
    // The whole project cannot be placed on the narration clock...
    const project = compileDraft(source);
    expect(project.ok).toBe(false);
    if (!project.ok)
      expect(codes(project.issues)).toContain("TIMELINE_INCOMPLETE");
    // ...but the ready scene can still be previewed on a local timeline.
    const result = scoped(source, "s3");
    expect(result.ok, JSON.stringify(!result.ok && result.issues)).toBe(true);
    if (!result.ok) return;
    expect(result.value.scope).toEqual({
      type: "scene",
      sceneId: "s3",
      sourceStartFrame: null,
      sourceEndFrame: null,
    });
    expect(result.value.timelineScope).toBe("local");
    expect(result.value.totalFrames).toBe(54);
  });

  it("refuses to preview a scene whose own block has no audio", () => {
    const result = scoped(plannedContext(), "s1");
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(codes(result.issues)).toContain("SCENE_BLOCK_NOT_READY");
  });

  it("does not let another block's stale voice block this scene, but keeps it visible", () => {
    const base = narratedSource();
    const stale: PlanSource = {
      ...base,
      assets: {
        ...base.assets,
        assets: base.assets.assets.map((asset) =>
          asset.status === "ready" && asset.kind !== "png"
            ? {
                ...asset,
                generation: {
                  textSha256: narrationTextHash("Bukan teks ini."),
                },
              }
            : asset,
        ),
      },
    };
    const whole = compileDraft(stale);
    expect(whole.ok).toBe(false);
    const result = scoped(stale, "s3");
    expect(result.ok).toBe(false); // its own block is stale too
    const ownFine: PlanSource = {
      ...stale,
      assets: {
        ...stale.assets,
        assets: stale.assets.assets.map((asset) =>
          asset.id === "voice-mechanism" &&
          asset.status === "ready" &&
          asset.kind !== "png"
            ? {
                ...asset,
                generation: {
                  textSha256: narrationTextHash("Tekanan magma meningkat."),
                },
              }
            : asset,
        ),
      },
    };
    const partial = scoped(ownFine, "s3");
    expect(partial.ok, JSON.stringify(!partial.ok && partial.issues)).toBe(
      true,
    );
    if (!partial.ok) return;
    const other = partial.issues.find((issue) => issue.code === "STALE_VOICE");
    expect(other?.severity).toBe("warning");
  });

  it("carries the previous scene's transition into the scene it plays inside", () => {
    const source = narratedSource({
      scenes: [
        narratedScene("s1", { blockId: "context" }),
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ].map((scene) =>
        scene.id === "s2"
          ? {
              ...scene,
              transition: {
                type: "push-through" as const,
                durationMs: 500,
                direction: "left" as const,
              },
            }
          : scene,
      ),
    });
    const result = scoped(source, "s3");
    expect(result.ok, JSON.stringify(!result.ok && result.issues)).toBe(true);
    if (!result.ok) return;
    expect(result.value.scenes[0]?.transitionIn).toEqual({
      type: "push-through",
      direction: "left",
      durationInFrames: 15,
    });
    expect(result.value.scenes[0]?.hasNextScene).toBeUndefined(); // s3 is the last scene

    const middle = scoped(source, "s2");
    expect(middle.ok).toBe(true);
    if (middle.ok)
      expect(middle.value.scenes[0]).toMatchObject({ hasNextScene: true });
  });

  it("gives a scene the same render key alone as inside the whole project", () => {
    const source = narratedSource();
    const whole = compileDraft(source);
    if (!whole.ok) throw new Error("fixture");
    const wholeKeys = Object.fromEntries(
      computeSceneRenderKeys(whole.value).map((k) => [k.sceneId, k.key]),
    );
    for (const sceneId of ["s1", "s2", "s3"]) {
      const alone = scoped(source, sceneId);
      if (!alone.ok) throw new Error(`scoped ${sceneId} failed`);
      expect(computeSceneRenderKeys(alone.value)[0]?.key, sceneId).toBe(
        wholeKeys[sceneId],
      );
    }
  });
});
