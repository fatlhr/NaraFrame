import type { Issue } from "../model/issue.js";
import type { AssetManifest } from "../schema/asset.js";
import type { CompiledSoundtrack } from "../schema/compiled.js";
import type { ProjectConfig } from "../schema/project.js";

/** Music this loud under speech is likely to hide it, so the compiler says so. */
export const MASKING_LIMIT = 0.35;

const toFrames = (ms: number, fps: number): number =>
  Math.round((ms * fps) / 1000);

const issue = (
  code: string,
  severity: Issue["severity"],
  path: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact: "naraframe.json",
  path,
  message,
  suggestion,
});

export interface SoundtrackInput {
  project: Pick<ProjectConfig, "soundtrack">;
  assets: AssetManifest;
  fps: number;
  totalFrames: number;
  /** Start frame of each compiled scene on the timeline being compiled. */
  sceneStarts: ReadonlyMap<string, number>;
  narrationWindows: ReadonlyArray<{ startFrame: number; endFrame: number }>;
  /** Music belongs to the whole project; a scoped preview carries none. */
  includeMusic: boolean;
}

/**
 * Resolves the soundtrack onto the frame timeline. It only ever adds audio:
 * nothing here can lengthen or shorten the video, and an effect that would
 * start after the last frame is an error instead of being clipped silently.
 */
export const compileSoundtrack = (
  input: SoundtrackInput,
): { value: CompiledSoundtrack | undefined; issues: Issue[] } => {
  const spec = input.project.soundtrack;
  if (!spec || (!spec.music && spec.sfx.length === 0)) {
    return { value: undefined, issues: [] };
  }
  const issues: Issue[] = [];
  const ready = new Set(
    input.assets.assets.flatMap((asset) =>
      asset.status === "ready" && asset.kind !== "png" ? [asset.id] : [],
    ),
  );
  const usable = (assetId: string, path: string): boolean => {
    if (ready.has(assetId)) return true;
    issues.push(
      issue(
        "SOUNDTRACK_ASSET_PLANNED",
        "warning",
        path,
        `Audio asset ${assetId} is not ready, so it is left out of this build.`,
        "Add the audio file and mark the asset ready before final export.",
      ),
    );
    return false;
  };

  let music: CompiledSoundtrack["music"];
  if (
    spec.music &&
    input.includeMusic &&
    usable(spec.music.assetId, "/soundtrack/music/assetId")
  ) {
    const track = spec.music;
    const duck = track.duck
      ? {
          volume: track.duck.volume,
          attackFrames: toFrames(track.duck.attackMs, input.fps),
          releaseFrames: toFrames(track.duck.releaseMs, input.fps),
          windows: input.narrationWindows.map((window) => ({ ...window })),
        }
      : undefined;
    music = {
      assetId: track.assetId,
      volume: track.volume,
      loop: track.loop,
      trimStartFrames: toFrames(track.trimStartMs, input.fps),
      fadeInFrames: toFrames(track.fadeInMs, input.fps),
      fadeOutFrames: toFrames(track.fadeOutMs, input.fps),
      ...(duck ? { duck } : {}),
    };
    if (
      music.fadeInFrames + music.fadeOutFrames > input.totalFrames &&
      input.totalFrames > 0
    ) {
      issues.push(
        issue(
          "MUSIC_FADES_OVERLAP",
          "warning",
          "/soundtrack/music",
          "Fade in and fade out together are longer than the video.",
          "Shorten the fades.",
        ),
      );
    }
    if (input.narrationWindows.length > 0) {
      const underSpeech = track.volume * (track.duck?.volume ?? 1);
      if (underSpeech > MASKING_LIMIT) {
        issues.push(
          issue(
            "MUSIC_MAY_MASK_NARRATION",
            "warning",
            "/soundtrack/music",
            `Music plays at ${underSpeech.toFixed(2)} of full scale under narration; above ${MASKING_LIMIT} it can hide speech.`,
            "Lower the music volume or add ducking.",
          ),
        );
      }
    }
  }

  const sfx: CompiledSoundtrack["sfx"] = [];
  spec.sfx.forEach((effect, index) => {
    const path = `/soundtrack/sfx/${index}`;
    const sceneStart = input.sceneStarts.get(effect.sceneId);
    // Outside a scoped preview's scene, the effect simply is not part of it.
    if (sceneStart === undefined) return;
    if (!usable(effect.assetId, `${path}/assetId`)) return;
    const startFrame = sceneStart + toFrames(effect.offsetMs, input.fps);
    if (startFrame >= input.totalFrames) {
      issues.push(
        issue(
          "SFX_AFTER_END",
          "error",
          `${path}/offsetMs`,
          `Effect ${effect.id} would start at frame ${startFrame}, after the video ends at ${input.totalFrames}.`,
          "Move the effect earlier or into a scene that is on screen.",
        ),
      );
      return;
    }
    sfx.push({
      id: effect.id,
      assetId: effect.assetId,
      startFrame,
      volume: effect.volume,
    });
  });

  if (!music && sfx.length === 0) return { value: undefined, issues };
  return { value: { ...(music ? { music } : {}), sfx }, issues };
};
