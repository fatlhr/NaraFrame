import type { Issue, Result } from "../model/issue.js";
import type { Narration } from "../schema/narration.js";
import type { ResolvedNarrationTimeline } from "./narration-timeline.js";

export interface SceneNarrationRef {
  sceneId: string;
  blockId: string;
  /** Phrase where this scene begins. Optional only for a block's first scene. */
  phraseId?: string;
}

export interface PartitionedScene {
  sceneId: string;
  startMs: number;
  endMs: number;
  startFrame: number;
  /** Exclusive: the range is [startFrame, endFrame). */
  endFrame: number;
}

const issue = (code: string, path: string, message: string): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "scenes.json",
  path,
  message,
  suggestion: "Correct the scene's narration reference and validate again.",
});

const msToFrame = (ms: number, fps: number): number =>
  Math.round((ms * fps) / 1000);

/**
 * Partitions [0, totalDurationMs) into scenes. A block's first scene owns the
 * block's leading silence; each later scene starts at its own phrase; inter-
 * phrase gaps belong to the scene that precedes them; the last scene of a
 * block owns trailing silence and pauseAfterMs. Boundaries are converted to
 * frames once and shared, and the final end uses ceil so audible tail samples
 * are never truncated.
 */
export const partitionScenes = (
  timeline: ResolvedNarrationTimeline,
  refs: readonly SceneNarrationRef[],
  fps: number,
): Result<PartitionedScene[]> => {
  const issues: Issue[] = [];
  const total = timeline.totalDurationMs;
  if (
    total === null ||
    timeline.blocks.some((block) => block.startMs === null)
  ) {
    return {
      ok: false,
      issues: [
        issue(
          "TIMELINE_INCOMPLETE",
          "/",
          "Every block needs measured audio before scenes can be partitioned against the narration clock.",
        ),
      ],
    };
  }

  const blockOrder = new Map(
    timeline.blocks.map((block, index) => [block.id, index]),
  );
  const starts: Array<{ sceneId: string; startMs: number }> = [];
  let lastBlockIndex = -1;
  let lastPhraseIndex = -1;
  const coveredBlocks = new Set<string>();

  refs.forEach((ref, sceneIndex) => {
    const path = `/scenes/${sceneIndex}/narration`;
    const blockIndex = blockOrder.get(ref.blockId);
    const block =
      blockIndex === undefined ? undefined : timeline.blocks[blockIndex];
    if (!block || blockIndex === undefined || block.startMs === null) {
      issues.push(
        issue(
          "NARRATION_BLOCK_UNKNOWN",
          `${path}/blockId`,
          `Unknown block ${ref.blockId}.`,
        ),
      );
      return;
    }
    if (blockIndex < lastBlockIndex) {
      issues.push(
        issue(
          "SCENE_BLOCK_ORDER",
          `${path}/blockId`,
          `Scene ${ref.sceneId} references block ${ref.blockId} out of narration order.`,
        ),
      );
      return;
    }

    const isFirstInBlock = !coveredBlocks.has(ref.blockId);
    if (isFirstInBlock) {
      coveredBlocks.add(ref.blockId);
      lastPhraseIndex = -1;
      starts.push({ sceneId: ref.sceneId, startMs: block.startMs });
    }
    lastBlockIndex = blockIndex;

    if (ref.phraseId === undefined) {
      if (!isFirstInBlock) {
        issues.push(
          issue(
            "SCENE_PHRASE_REQUIRED",
            `${path}/phraseId`,
            `Scene ${ref.sceneId} is not the first scene of block ${ref.blockId} and must name the phrase it starts at.`,
          ),
        );
      }
      return;
    }

    const phraseIndex = block.phrases.findIndex(
      (phrase) => phrase.id === ref.phraseId,
    );
    const phrase = block.phrases[phraseIndex];
    if (!phrase) {
      issues.push(
        issue(
          "NARRATION_PHRASE_UNKNOWN",
          `${path}/phraseId`,
          `Block ${ref.blockId} has no phrase ${ref.phraseId}.`,
        ),
      );
      return;
    }
    if (phraseIndex <= lastPhraseIndex) {
      issues.push(
        issue(
          "SCENE_PHRASE_ORDER",
          `${path}/phraseId`,
          `Scene ${ref.sceneId} starts at phrase ${ref.phraseId}, which does not follow the previous scene's phrase.`,
        ),
      );
      return;
    }
    lastPhraseIndex = phraseIndex;
    if (!isFirstInBlock) {
      starts.push({ sceneId: ref.sceneId, startMs: phrase.startMs });
    }
  });

  for (const block of timeline.blocks) {
    if (!coveredBlocks.has(block.id)) {
      issues.push(
        issue(
          "BLOCK_WITHOUT_SCENE",
          "/scenes",
          `Block ${block.id} has no scene, so part of the narration clock would be uncovered.`,
        ),
      );
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const scenes: PartitionedScene[] = starts.map((entry, index) => {
    const next = starts[index + 1];
    const endMs = next ? next.startMs : total;
    const startFrame = msToFrame(entry.startMs, fps);
    const endFrame = next
      ? msToFrame(next.startMs, fps)
      : Math.ceil((total * fps) / 1000);
    return {
      sceneId: entry.sceneId,
      startMs: entry.startMs,
      endMs,
      startFrame,
      endFrame,
    };
  });

  scenes.forEach((scene, index) => {
    if (scene.endFrame <= scene.startFrame) {
      issues.push(
        issue(
          "SCENE_ZERO_FRAMES",
          `/scenes/${index}`,
          `Scene ${scene.sceneId} rounds to zero frames at ${fps} fps.`,
        ),
      );
    }
  });
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, value: scenes, issues: [] };
};

export interface SceneLocalRange {
  sceneId: string;
  blockId: string;
  /** Milliseconds from the start of the block's audio clip. */
  localStartMs: number;
  localEndMs: number;
}

/**
 * Where one scene sits inside its own block, in block-local time. This needs
 * only that block's measured audio, so it works even when an earlier block
 * still has none and the global offset is unknown. Same ownership rules as
 * `partitionScenes`: the block's first scene owns the leading silence, later
 * scenes start at their phrase, and the last scene owns the trailing silence
 * and the pause.
 */
export const sceneLocalRange = (
  narration: Narration,
  refs: readonly SceneNarrationRef[],
  sceneId: string,
): Result<SceneLocalRange> => {
  const fail = (code: string, message: string): Result<SceneLocalRange> => ({
    ok: false,
    issues: [issue(code, "/scope/sceneId", message)],
  });
  const own = refs.find((ref) => ref.sceneId === sceneId);
  if (!own) {
    return fail(
      "SCENE_NARRATION_MISSING",
      `Scene ${sceneId} has no narration reference.`,
    );
  }
  const block = narration.blocks.find(
    (candidate) => candidate.id === own.blockId,
  );
  if (!block) {
    return fail("NARRATION_BLOCK_UNKNOWN", `Unknown block ${own.blockId}.`);
  }
  if (!("audioDurationMs" in block)) {
    return fail(
      "SCENE_BLOCK_NOT_READY",
      `Scene ${sceneId} belongs to block ${block.id}, which has no measured audio yet.`,
    );
  }

  const siblings = refs.filter((ref) => ref.blockId === block.id);
  const startOf = (ref: SceneNarrationRef, index: number): number | null => {
    if (index === 0) return 0;
    const phrase = block.phrases.find(
      (candidate) => candidate.id === ref.phraseId,
    );
    return phrase ? phrase.startMs : null;
  };
  const index = siblings.findIndex((ref) => ref.sceneId === sceneId);
  const start = startOf(own, index);
  if (start === null) {
    return fail(
      "NARRATION_PHRASE_UNKNOWN",
      `Scene ${sceneId} does not name a phrase of block ${block.id} to start at.`,
    );
  }
  const next = siblings[index + 1];
  const end = next
    ? startOf(next, index + 1)
    : block.audioDurationMs + block.pauseAfterMs;
  if (end === null || end <= start) {
    return fail(
      "SCENE_PHRASE_ORDER",
      `Scene ${sceneId} would end at or before it starts inside block ${block.id}.`,
    );
  }
  return {
    ok: true,
    value: { sceneId, blockId: block.id, localStartMs: start, localEndMs: end },
    issues: [],
  };
};
