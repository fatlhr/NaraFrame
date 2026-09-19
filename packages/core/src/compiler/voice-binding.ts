import type { Issue } from "../model/issue.js";
import { sha256Text } from "../project/hash.js";
import type { PlanSource } from "../schema/export-schema.js";

/** Hash of the intended speech, ignoring only whitespace differences. */
export const narrationTextHash = (text: string): string =>
  sha256Text(text.trim().replace(/\s+/gu, " "));

const bindingIssue = (
  code: string,
  severity: Issue["severity"],
  blockIndex: number,
  blockId: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact: "narration.json",
  path: `/blocks/${blockIndex}/text`,
  entityId: blockId,
  message,
  suggestion,
});

/**
 * Refuses to play a clip against text it was not spoken from. A clip with no
 * recorded binding is only a warning, because prepared audio may predate it.
 */
export const checkVoiceBindings = (source: PlanSource): Issue[] => {
  const narration = source.narration;
  if (!narration) return [];
  const issues: Issue[] = [];

  narration.blocks.forEach((block, index) => {
    if (!("audioAssetId" in block)) return;
    const asset = source.assets.assets.find(
      (candidate) => candidate.id === block.audioAssetId,
    );
    if (asset?.status !== "ready" || asset.kind === "png") return;

    const expected = narrationTextHash(block.text);
    const generation = "generation" in asset ? asset.generation : undefined;
    if (!generation) {
      issues.push(
        bindingIssue(
          "VOICE_BINDING_MISSING",
          "warning",
          index,
          block.id,
          `Audio asset ${asset.id} does not record the text it was spoken from, so a stale voice cannot be detected.`,
          `If it was spoken from exactly this block text, add generation.textSha256 "${expected}" to the asset.`,
        ),
      );
      return;
    }

    if (generation.textSha256 !== expected) {
      issues.push(
        bindingIssue(
          "STALE_VOICE",
          "error",
          index,
          block.id,
          `Block ${block.id} text changed since audio asset ${asset.id} was generated.`,
          "Generate new audio for the edited text and point the block at it, or restore the spoken text.",
        ),
      );
    }

    const signature = generation.voiceStyleSignature;
    if (
      signature !== undefined &&
      signature !== source.profile.production.voiceStyleSignature
    ) {
      issues.push(
        bindingIssue(
          "VOICE_STYLE_MISMATCH",
          "error",
          index,
          block.id,
          `Audio asset ${asset.id} was generated with voice style "${signature}", but the profile now uses "${source.profile.production.voiceStyleSignature}".`,
          "Regenerate the block with the profile's voice style, or update the profile deliberately.",
        ),
      );
    }
  });

  return issues;
};
