import type { Narration } from "../schema/narration.js";

export interface ResolvedPhrase {
  id: string;
  text: string;
  localStartMs: number;
  localEndMs: number;
  startMs: number;
  endMs: number;
}

export interface ResolvedBlock {
  id: string;
  ready: boolean;
  /** Global start; null once any earlier block has no measured duration. */
  startMs: number | null;
  /** End of the audible clip (start + audioDurationMs). */
  endMs: number | null;
  /** End of the pause hold (endMs + pauseAfterMs). */
  holdEndMs: number | null;
  pauseAfterMs: number;
  phrases: ResolvedPhrase[];
}

export interface ResolvedNarrationTimeline {
  blocks: ResolvedBlock[];
  /** Null when any block is still planned, so the total cannot be measured. */
  totalDurationMs: number | null;
}

/**
 * Derives global block offsets from measured local clip durations and pauses.
 * Local phrase timing is never rewritten; only offsets shift when an earlier
 * block's duration or pause changes.
 */
export const resolveNarrationTimeline = (
  narration: Narration,
): ResolvedNarrationTimeline => {
  const byId = new Map(narration.blocks.map((block) => [block.id, block]));
  const blocks: ResolvedBlock[] = [];
  let cursor: number | null = 0;

  for (const id of narration.order) {
    const block = byId.get(id);
    if (!block) {
      continue;
    }

    if (!("audioDurationMs" in block)) {
      blocks.push({
        id,
        ready: false,
        startMs: cursor,
        endMs: null,
        holdEndMs: null,
        pauseAfterMs: 0,
        phrases: [],
      });
      cursor = null;
      continue;
    }

    const startMs: number | null = cursor;
    const endMs: number | null =
      startMs === null ? null : startMs + block.audioDurationMs;
    const holdEndMs: number | null =
      endMs === null ? null : endMs + block.pauseAfterMs;
    blocks.push({
      id,
      ready: true,
      startMs,
      endMs,
      holdEndMs,
      pauseAfterMs: block.pauseAfterMs,
      phrases:
        startMs === null
          ? []
          : block.phrases.map((phrase) => ({
              id: phrase.id,
              text: phrase.text,
              localStartMs: phrase.startMs,
              localEndMs: phrase.endMs,
              startMs: startMs + phrase.startMs,
              endMs: startMs + phrase.endMs,
            })),
    });
    cursor = holdEndMs;
  }

  return { blocks, totalDurationMs: cursor };
};
