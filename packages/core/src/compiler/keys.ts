import { hashValue } from "../project/hash.js";
import type { CompiledDraft } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { NarrationBlock } from "../schema/narration.js";
import { narrationTextHash } from "./voice-binding.js";

/** Bump when a renderer change can alter pixels for identical input. */
// 3: inline vector artwork and per-span headline weights changed the pixels.
// 4: bundled faces are now loaded in the frame render context, so type that
//    previously rendered in a substituted face renders in the bundled one.
// 5: preserve SVG root clipping/transforms and reject failed sibling font faces.
// 6: explicit camera/world parallax and sequential opaque object transforms.
// 7: positive depth zoom and camera-aware required-text preflight.
// 8: the exit beat fades elements out, so a held pose is no longer the
//    last frame of a shot that used to keep everything on screen.
// 9: headline spans flow inline in one text box instead of one line per run.
// 10: path layers, and draw, follow and count beats paint new motion.
// 11: AAC is encoded directly into MP4 to preserve audio priming timestamps.
// 12: explicit caption policy, selectable cue windows and shared layout tokens.
// 13: frames are captured serially; builds from parallel capture could hold
//     frames grabbed before they finished painting and are not reused.
export const RENDER_ENGINE = "naraframe-draft/13";

/**
 * Finds a retained voice clip for a block: the spoken text (whitespace
 * normalised) and the profile's voice style. Not a promise that AI sampling is
 * reproducible. Use it as the receipt `requestKey` so spend can be traced back.
 */
export const generationKeyForBlock = (
  source: PlanSource,
  block: NarrationBlock,
): string =>
  hashValue({
    kind: "voice",
    text: narrationTextHash(block.text),
    voiceStyleSignature: source.profile.production.voiceStyleSignature,
  });

type DraftBody = Omit<CompiledDraft, "assemblyKey">;

export const referencedAssetIds = (
  value: unknown,
  found = new Set<string>(),
): Set<string> => {
  if (Array.isArray(value)) {
    for (const item of value) referencedAssetIds(item, found);
  } else if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "assetId" && typeof nested === "string") found.add(nested);
      else referencedAssetIds(nested, found);
    }
  }
  return found;
};

/** Render tokens that can change pixels; lint policy such as variety is not one. */
const renderSubset = (draft: DraftBody) => {
  const {
    variety: _variety,
    captions: _captions,
    ...pixelTokens
  } = draft.profile.render;
  return pixelTokens;
};

export interface SceneRenderKey {
  sceneId: string;
  key: string;
}

/**
 * Identifies one scene's rendered output. It uses the scene's own content,
 * the hashes of assets it uses, the pixel-relevant profile subset, and its
 * timing relative to the scene start, never absolute offsets, so moving a scene
 * later in the timeline does not invalidate it. Captions and narration audio
 * overlapping the scene, and the neighbour's transition that plays inside it,
 * are included.
 */
export const computeSceneRenderKeys = (
  draft: DraftBody,
  runtime = "unpinned",
): SceneRenderKey[] =>
  draft.scenes.map((scene, index) => {
    const previous = draft.scenes[index - 1];
    const incoming = scene.transitionIn ?? previous?.transitionOut;
    const assets = [...referencedAssetIds([scene.visual, scene.layers])]
      .sort()
      .map((id) => [id, draft.assets[id] ?? null]);
    const overlap = <T extends { startFrame: number; endFrame: number }>(
      item: T,
    ) => item.startFrame < scene.endFrame && item.endFrame > scene.startFrame;

    const cues = (draft.captions?.cues ?? []).filter(overlap).map((cue) => ({
      id: cue.id,
      text: cue.text,
      from: Math.max(cue.startFrame, scene.startFrame) - scene.startFrame,
      to: Math.min(cue.endFrame, scene.endFrame) - scene.startFrame,
    }));
    // Trim, offset and length inside this scene, so the same audio in the same
    // place gives the same key whether the scene is compiled alone or in the
    // whole project.
    const audio = (draft.narration?.clips ?? [])
      .map((clip) => {
        const clipStart = clip.startFrame;
        const clipEnd = clipStart + clip.durationInFrames;
        return {
          clip,
          from: Math.max(clipStart, scene.startFrame),
          to: Math.min(clipEnd, scene.endFrame),
        };
      })
      .filter((entry) => entry.to > entry.from)
      .map(({ clip, from, to }) => ({
        asset: draft.assets[clip.assetId] ?? null,
        trimStartFrames: (clip.trimStartFrames ?? 0) + (from - clip.startFrame),
        offset: from - scene.startFrame,
        durationInFrames: to - from,
      }));

    return {
      sceneId: scene.id,
      key: hashValue({
        engine: RENDER_ENGINE,
        runtime,
        format: {
          width: draft.width,
          height: draft.height,
          fps: draft.fps,
          label: draft.label,
        },
        content: {
          visual: scene.visual,
          layers: scene.layers,
          beats: scene.beats,
          camera: scene.camera,
          transitionOut: scene.transitionOut,
        },
        durationInFrames: scene.endFrame - scene.startFrame,
        incomingTransition:
          incoming && incoming.type !== "cut" ? incoming : null,
        assets,
        fonts: draft.fonts,
        render: renderSubset(draft),
        captions:
          cues.length > 0 ? { style: draft.captions?.style, cues } : null,
        audio,
      }),
    };
  });

/**
 * Identifies the assembled output: ordered scene keys with their global
 * placement, the narration mix, captions, and export settings. It does not
 * include the source revision, so a change that cannot alter the render (an
 * editorial note, say) does not invalidate it.
 */
export const computeAssemblyKey = (
  draft: DraftBody,
  runtime = "unpinned",
): string =>
  hashValue({
    engine: RENDER_ENGINE,
    runtime,
    scope: draft.scope,
    format: {
      width: draft.width,
      height: draft.height,
      fps: draft.fps,
      label: draft.label,
    },
    scenes: computeSceneRenderKeys(draft, runtime).map((entry, index) => ({
      ...entry,
      startFrame: draft.scenes[index]?.startFrame,
      endFrame: draft.scenes[index]?.endFrame,
    })),
    narration: draft.narration
      ? draft.narration.clips.map((clip) => ({
          ...clip,
          asset: draft.assets[clip.assetId] ?? null,
        }))
      : null,
    captions: draft.captions ?? null,
    fonts: draft.fonts,
    // Absent unless the project has one, so existing builds keep their keys.
    ...(draft.soundtrack
      ? {
          soundtrack: {
            ...draft.soundtrack,
            assets: [
              draft.soundtrack.music?.assetId,
              ...draft.soundtrack.sfx.map((effect) => effect.assetId),
            ].map((id) => (id ? (draft.assets[id] ?? null) : null)),
          },
        }
      : {}),
  });
