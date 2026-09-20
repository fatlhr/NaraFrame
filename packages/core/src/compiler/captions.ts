import type { Issue, Result } from "../model/issue.js";
import type { Captions } from "../schema/captions.js";
import type { ResolvedNarrationTimeline } from "./narration-timeline.js";

export interface CaptionCue {
  /** Stable across offset shifts: `<blockId>/<phraseId>`. */
  id: string;
  blockId: string;
  phraseId: string;
  /** Text shown on screen: the correction if one exists, else the spoken text. */
  text: string;
  /** Text the voice was generated from; never altered by a display correction. */
  intendedText: string;
  correction?: { id: string; reason: string };
  startMs: number;
  endMs: number;
}

/**
 * One cue per phrase, using phrase timestamps. A long phrase is displayed
 * whole; no sub-phrase timing is guessed here. A display correction changes
 * only what is shown, so it needs no new voice.
 */
export const deriveCaptionCues = (
  timeline: ResolvedNarrationTimeline,
  captions: Captions = { schemaVersion: 1, corrections: [] },
): Result<CaptionCue[]> => {
  const issues: Issue[] = [];
  const cues: CaptionCue[] = [];
  const known = new Set<string>();

  for (const block of timeline.blocks) {
    for (const phrase of block.phrases) {
      const id = `${block.id}/${phrase.id}`;
      known.add(id);
      const correction = captions.corrections.find(
        (candidate) =>
          candidate.blockId === block.id && candidate.phraseId === phrase.id,
      );
      cues.push({
        id,
        blockId: block.id,
        phraseId: phrase.id,
        text: correction ? correction.displayText : phrase.text,
        intendedText: phrase.text,
        ...(correction
          ? { correction: { id: correction.id, reason: correction.reason } }
          : {}),
        startMs: phrase.startMs,
        endMs: phrase.endMs,
      });
    }
  }

  captions.corrections.forEach((correction, index) => {
    if (!known.has(`${correction.blockId}/${correction.phraseId}`)) {
      issues.push({
        code: "CAPTION_CORRECTION_TARGET_UNKNOWN",
        severity: "error",
        responsible: "agent",
        artifact: "captions.json",
        path: `/corrections/${index}`,
        message: `Correction ${correction.id} targets ${correction.blockId}/${correction.phraseId}, which is not a resolved phrase.`,
        suggestion:
          "Point the correction at an existing block and phrase, or remove it.",
      });
    }
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, value: cues, issues: [] };
};
