import { generationKeyForBlock } from "../compiler/keys.js";
import { checkVoiceBindings } from "../compiler/voice-binding.js";
import type { PlanSource } from "../schema/export-schema.js";

export interface PendingGeneration {
  blockId: string;
  reason: "no-audio" | "stale-text" | "voice-style";
  /** The key a new receipt for this block should carry as its requestKey. */
  generationKey: string;
}

/**
 * Voice blocks that would need a provider call before a final export: those
 * with no audio yet, whose spoken text changed, or whose voice style changed.
 * Anything else, including caption, style, layout and note edits, needs none.
 * Audio with no recorded binding is not listed: nothing says it is stale.
 */
export const pendingGeneration = (source: PlanSource): PendingGeneration[] => {
  const narration = source.narration;
  if (!narration) return [];
  const staleReason = new Map<string, PendingGeneration["reason"]>();
  for (const issue of checkVoiceBindings(source)) {
    if (!issue.entityId) continue;
    if (issue.code === "STALE_VOICE")
      staleReason.set(issue.entityId, "stale-text");
    if (
      issue.code === "VOICE_STYLE_MISMATCH" &&
      !staleReason.has(issue.entityId)
    ) {
      staleReason.set(issue.entityId, "voice-style");
    }
  }
  return narration.blocks.flatMap((block) => {
    const reason = !("audioAssetId" in block)
      ? "no-audio"
      : staleReason.get(block.id);
    return reason
      ? [
          {
            blockId: block.id,
            reason,
            generationKey: generationKeyForBlock(source, block),
          },
        ]
      : [];
  });
};
