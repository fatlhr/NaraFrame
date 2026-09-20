import type { CompiledDraft } from "@naraframe/core";

type Music = NonNullable<NonNullable<CompiledDraft["soundtrack"]>["music"]>;

const ramp = (frame: number, start: number, end: number): number =>
  end <= start
    ? frame >= end
      ? 1
      : 0
    : Math.min(1, Math.max(0, (frame - start) / (end - start)));

/**
 * Gain of the music bed at a timeline frame: base volume, fades at both ends,
 * and ducking that eases down before speech starts and back up after it ends.
 */
export const musicGainAt = (
  music: Music,
  frame: number,
  totalFrames: number,
): number => {
  let gain = music.volume;
  if (music.fadeInFrames > 0) gain *= ramp(frame, 0, music.fadeInFrames);
  if (music.fadeOutFrames > 0) {
    gain *= 1 - ramp(frame, totalFrames - music.fadeOutFrames, totalFrames);
  }
  if (music.duck) {
    let ducked = 0;
    for (const window of music.duck.windows) {
      const down = ramp(
        frame,
        window.startFrame - music.duck.attackFrames,
        window.startFrame,
      );
      const up =
        1 -
        ramp(
          frame,
          window.endFrame,
          window.endFrame + music.duck.releaseFrames,
        );
      ducked = Math.max(ducked, Math.min(down, up));
    }
    gain *= 1 - ducked * (1 - music.duck.volume);
  }
  return gain;
};
