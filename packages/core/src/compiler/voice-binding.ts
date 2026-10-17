import type { Issue } from "../model/issue.js";
import { sha256Text } from "../project/hash.js";
import type { PlanSource } from "../schema/export-schema.js";
import { preparedTimingHash } from "./prepared-audio.js";

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
    if (block.prepared) {
      const prepared = block.prepared;
      if (
        prepared.audioSha256 !== asset.sha256 ||
        prepared.textSha256 !== expected ||
        prepared.audioDurationMs !== block.audioDurationMs ||
        prepared.timingSha256 !== preparedTimingHash(block)
      ) {
        issues.push(
          bindingIssue(
            "PREPARED_AUDIO_STALE",
            "error",
            index,
            block.id,
            "Prepared audio receipt no longer matches the referenced audio, spoken text or local timing.",
            "Restore the reviewed bindings or stage a new timing package with a new listening review.",
          ),
        );
      }
      if (prepared.verification.state === "pending") {
        issues.push(
          bindingIssue(
            "PREPARED_AUDIO_PENDING",
            "warning",
            index,
            block.id,
            "Prepared audio is awaiting listening review; its speech has not been confirmed.",
            "Listen to the captured master against the text and cue boundaries, then stage an attested timing package.",
          ),
        );
        if (generation)
          issues.push(
            bindingIssue(
              "PREPARED_AUDIO_UNCONFIRMED_BINDING",
              "error",
              index,
              block.id,
              "Pending prepared audio must not assert a confirmed generation text binding.",
              "Remove the generation binding or complete listening review.",
            ),
          );
        return;
      }
      if (!generation)
        issues.push(
          bindingIssue(
            "PREPARED_AUDIO_BINDING_MISSING",
            "error",
            index,
            block.id,
            "Verified prepared audio requires its confirmed generation text binding.",
            "Stage the reviewed package again.",
          ),
        );
    }
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
          "warning",
          index,
          block.id,
          `Audio asset ${asset.id} was generated with voice style "${signature}", but the profile now uses "${source.profile.production.voiceStyleSignature}".`,
          "Regenerate the block with the profile's voice style before final export, or update the profile deliberately.",
        ),
      );
    }
  });

  return issues;
};
