import type { Issue, Result } from "../model/issue.js";
import type { CaptionMode, Captions } from "../schema/captions.js";
import type { Narration } from "../schema/narration.js";
import type { ProfileLock } from "../schema/profile.js";
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

/** Shared half-open frame window, including the existing one-frame minimum. */
export const captionFrameWindow = (
  cue: Pick<CaptionCue, "startMs" | "endMs">,
  fps: number,
) => {
  const startFrame = Math.round((cue.startMs * fps) / 1000);
  return {
    startFrame,
    endFrame: Math.max(startFrame + 1, Math.round((cue.endMs * fps) / 1000)),
  };
};

export const resolveCaptionMode = (
  profile: ProfileLock,
  captions?: Captions,
): CaptionMode => captions?.mode ?? profile.render.captions?.mode ?? "full";

/** Policy validation uses local measured phrases even when global timing is incomplete. */
export const checkCaptionPolicy = (
  profile: ProfileLock,
  captions?: Captions,
  narration?: Narration,
): Issue[] => {
  const issues: Issue[] = [];
  const report = (
    code: string,
    path: string,
    message: string,
    suggestion: string,
  ) =>
    issues.push({
      code,
      path,
      message,
      suggestion,
      severity: "error",
      responsible: "agent",
      artifact: "captions.json",
    });
  const profileMode = profile.render.captions?.mode ?? "full";
  const locked = profile.lockedPaths.some(
    (path) =>
      path === "render" ||
      path === "render.captions" ||
      path === "render.captions.mode",
  );
  if (locked && captions?.mode && captions.mode !== profileMode)
    report(
      "CAPTION_MODE_LOCKED",
      "/mode",
      `The profile locks caption mode ${profileMode}; this project asks for ${captions.mode}.`,
      `Use mode "${profileMode}", or choose a profile that permits this caption policy.`,
    );
  captions?.selections?.forEach((selection, index) => {
    const block = narration?.blocks.find(
      (candidate) => candidate.id === selection.blockId,
    );
    const path = `/selections/${index}`;
    if (block && !("phrases" in block)) {
      report(
        "CAPTION_SELECTION_UNMEASURED",
        path,
        `Block ${block.id} has no measured phrases.`,
        "Import verified phrase timing before selecting captions.",
      );
      return;
    }
    const phrase =
      block && "phrases" in block
        ? block.phrases.find((candidate) => candidate.id === selection.phraseId)
        : undefined;
    if (!phrase) {
      report(
        "CAPTION_SELECTION_TARGET_UNKNOWN",
        path,
        `Selection targets ${selection.blockId}/${selection.phraseId}, which is not a measured phrase.`,
        "Select an existing block and phrase, or remove the selection.",
      );
      return;
    }
    const duration = phrase.endMs - phrase.startMs;
    const start = selection.startOffsetMs ?? 0;
    const end = selection.endOffsetMs ?? duration;
    if (start >= end || end > duration || start < 0)
      report(
        "CAPTION_SELECTION_OUTSIDE_PHRASE",
        path,
        `Selection ${selection.blockId}/${selection.phraseId} uses [${start}, ${end}) ms within a ${duration} ms phrase.`,
        `Use 0 <= startOffsetMs < endOffsetMs <= ${duration}, measured from the phrase start.`,
      );
  });
  return issues;
};

/**
 * One cue per phrase, using phrase timestamps. A long phrase is displayed
 * whole; no sub-phrase timing is guessed here. A display correction changes
 * only what is shown, so it needs no new voice.
 */
export const deriveCaptionCues = (
  timeline: ResolvedNarrationTimeline,
  captions: Captions = { schemaVersion: 1, corrections: [] },
  mode: CaptionMode = captions.mode ?? "full",
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
      const selection = captions.selections?.find(
        (candidate) =>
          candidate.blockId === block.id && candidate.phraseId === phrase.id,
      );
      if (mode === "none" || (mode === "selected" && !selection)) continue;
      cues.push({
        id,
        blockId: block.id,
        phraseId: phrase.id,
        text: correction ? correction.displayText : phrase.text,
        intendedText: phrase.text,
        ...(correction
          ? { correction: { id: correction.id, reason: correction.reason } }
          : {}),
        startMs:
          phrase.startMs +
          (mode === "selected" ? (selection?.startOffsetMs ?? 0) : 0),
        endMs:
          mode === "selected" && selection?.endOffsetMs !== undefined
            ? phrase.startMs + selection.endOffsetMs
            : phrase.endMs,
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
