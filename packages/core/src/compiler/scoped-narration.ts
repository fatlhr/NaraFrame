import type { Issue, Result } from "../model/issue.js";
import type { CompiledDraft } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import {
  captionFrameWindow,
  deriveCaptionCues,
  resolveCaptionMode,
} from "./captions.js";
import type { ResolvedNarrationTimeline } from "./narration-timeline.js";
import { resolveNarrationTimeline } from "./narration-timeline.js";
import {
  partitionScenes,
  type SceneNarrationRef,
  sceneLocalRange,
} from "./scene-partition.js";

const msToFrames = (ms: number, fps: number): number =>
  Math.max(1, Math.round((ms * fps) / 1000));

/** Caption style in draft pixels, shared by project and scoped compiles. */
export const captionStyleFor = (
  source: PlanSource,
  scaleX: number,
  scaleY: number,
): NonNullable<CompiledDraft["captions"]>["style"] => {
  const style = source.profile.render.captions;
  const safe = source.profile.render.safeZone;
  return {
    fontSize: Math.round((style?.fontSize ?? 44) * scaleX),
    maxLines: style?.maxLines ?? 2,
    bottom: Math.round((safe.bottom + (style?.bottomOffset ?? 24)) * scaleY),
    side: Math.round((safe.left + (style?.sideOffset ?? 48)) * scaleX),
    ...(style?.scrimOpacity !== undefined
      ? { scrimOpacity: style.scrimOpacity }
      : {}),
    ...(style?.lineHeight !== undefined
      ? { lineHeight: style.lineHeight }
      : {}),
  };
};

export interface ScopedNarration {
  /** Scene length in frames: exact when the global timeline is known. */
  durationInFrames: number;
  /** Global frames of the scene, or null when an earlier block has no audio. */
  sourceStartFrame: number | null;
  sourceEndFrame: number | null;
  narration: NonNullable<CompiledDraft["narration"]>;
  captions: CompiledDraft["captions"];
}

/**
 * Narration for a preview of one scene. The scene's timeline starts at zero;
 * its block's clip is trimmed to start where the scene starts, and captions
 * are shifted the same way. When every block has audio the durations come from
 * the same global partition the full project uses, so the two agree exactly;
 * otherwise they come from the block alone and the global offset is unknown.
 */
export const compileSceneNarration = (options: {
  source: PlanSource;
  sceneId: string;
  timeline: ResolvedNarrationTimeline;
  fps: number;
  scaleX: number;
  scaleY: number;
}): Result<ScopedNarration> => {
  const { source, sceneId, timeline, fps } = options;
  const narration = source.narration;
  if (!narration) {
    return { ok: false, issues: [] };
  }
  const refs: SceneNarrationRef[] = source.scenes.scenes.flatMap((scene) =>
    scene.narration
      ? [
          {
            sceneId: scene.id,
            blockId: scene.narration.blockId,
            ...(scene.narration.phraseId
              ? { phraseId: scene.narration.phraseId }
              : {}),
          },
        ]
      : [],
  );

  const local = sceneLocalRange(narration, refs, sceneId);
  if (!local.ok) return local;
  const { blockId, localStartMs, localEndMs } = local.value;

  const block = narration.blocks.find((candidate) => candidate.id === blockId);
  if (!block || !("audioDurationMs" in block)) {
    return { ok: false, issues: [] };
  }

  const everyScenePlaced = refs.length === source.scenes.scenes.length;
  const global =
    everyScenePlaced && timeline.totalDurationMs !== null
      ? partitionScenes(timeline, refs, fps)
      : null;
  const placed = global?.ok
    ? global.value.find((entry) => entry.sceneId === sceneId)
    : undefined;

  const durationInFrames = placed
    ? placed.endFrame - placed.startFrame
    : msToFrames(localEndMs - localStartMs, fps);
  const trimStartFrames = Math.round((localStartMs * fps) / 1000);
  const audioFrames = msToFrames(block.audioDurationMs, fps);
  const clipFrames = Math.max(
    1,
    Math.min(durationInFrames, audioFrames - trimStartFrames),
  );

  // A one-block local timeline works even when an earlier block is unmeasured.
  const localTimeline = resolveNarrationTimeline({
    schemaVersion: 1,
    order: [block.id],
    blocks: [block],
  });
  const globalStart = timeline.blocks.find(
    (candidate) => candidate.id === block.id,
  )?.startMs;
  const globallyPlaced =
    placed !== undefined && globalStart !== null && globalStart !== undefined;
  const derived = deriveCaptionCues(
    globallyPlaced ? timeline : localTimeline,
    !globallyPlaced && source.captions
      ? {
          ...source.captions,
          corrections: source.captions.corrections.filter(
            (correction) => correction.blockId === block.id,
          ),
        }
      : source.captions,
    resolveCaptionMode(source.profile, source.captions),
  );
  if (!derived.ok) return derived;
  const cues = derived.value.flatMap((cue) => {
    const start = Math.max(cue.startMs, localStartMs) - localStartMs;
    const end = Math.min(cue.endMs, localEndMs) - localStartMs;
    // When placed, overlap belongs to the rounded global frame intervals.
    // A sub-frame window can round across the millisecond scene boundary.
    if (!globallyPlaced && end <= start) return [];
    const raw = captionFrameWindow(cue, fps);
    const startFrame =
      globallyPlaced && placed
        ? Math.max(placed.startFrame, raw.startFrame) - placed.startFrame
        : Math.round((start * fps) / 1000);
    const endFrame =
      globallyPlaced && placed
        ? Math.min(placed.endFrame, raw.endFrame) - placed.startFrame
        : Math.min(
            durationInFrames,
            Math.max(startFrame + 1, Math.round((end * fps) / 1000)),
          );
    if (endFrame <= startFrame) return [];
    return [
      {
        id: cue.id,
        text: cue.text,
        startFrame,
        endFrame,
      },
    ];
  });

  const issues: Issue[] = [];
  return {
    ok: true,
    value: {
      durationInFrames,
      sourceStartFrame: placed ? placed.startFrame : null,
      sourceEndFrame: placed ? placed.endFrame : null,
      narration: {
        totalDurationMs: Math.max(
          1,
          Math.round((durationInFrames * 1000) / fps),
        ),
        clips: [
          {
            blockId,
            assetId: block.audioAssetId,
            startMs: 0,
            durationMs: block.audioDurationMs,
            startFrame: 0,
            durationInFrames: clipFrames,
            ...(trimStartFrames > 0 ? { trimStartFrames } : {}),
          },
        ],
      },
      captions:
        cues.length > 0
          ? {
              style: captionStyleFor(source, options.scaleX, options.scaleY),
              cues,
            }
          : undefined,
    },
    issues,
  };
};
