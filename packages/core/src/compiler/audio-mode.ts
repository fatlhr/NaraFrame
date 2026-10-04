import type { Issue } from "../model/issue.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { AudioMode } from "../schema/project.js";

/**
 * Where the mode came from. `legacy` means nothing declared it and it was
 * read off the files present; that is reported, never treated as approval of
 * the scenes' durations as a final clock.
 */
export type AudioModeSource = "project" | "profile" | "legacy";

export interface ResolvedAudioMode {
  mode: AudioMode;
  source: AudioModeSource;
}

const LOCK_PATH = "production.audioMode";

const problem = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion,
});

/**
 * The project's audio mode: its own declaration, else the profile default,
 * else a conservative reading of the files (narration → voice, a music bed →
 * music, nothing → silent).
 */
export const resolveAudioMode = (source: PlanSource): ResolvedAudioMode => {
  const declared = source.project.audioMode;
  if (declared) return { mode: declared, source: "project" };
  const profileDefault = source.profile.production.audioMode;
  if (profileDefault) return { mode: profileDefault, source: "profile" };
  if (source.narration) return { mode: "voice", source: "legacy" };
  if (source.project.soundtrack?.music) {
    return { mode: "music", source: "legacy" };
  }
  return { mode: "silent", source: "legacy" };
};

/**
 * Audio a project carries that contradicts its mode. These block previews
 * and exports alike: a mode never drops narration or adds sound silently.
 */
export const checkAudioModeConflicts = (
  source: PlanSource,
  resolved: ResolvedAudioMode,
): Issue[] => {
  const issues: Issue[] = [];
  const profileDefault = source.profile.production.audioMode;
  const locked = source.profile.lockedPaths.some(
    (path) =>
      path === LOCK_PATH ||
      path === "production" ||
      LOCK_PATH.startsWith(`${path}.`),
  );
  if (
    locked &&
    profileDefault &&
    source.project.audioMode &&
    source.project.audioMode !== profileDefault
  ) {
    issues.push(
      problem(
        "AUDIO_MODE_LOCKED",
        "naraframe.json",
        "/audioMode",
        `The profile locks audio mode ${profileDefault}; this project asks for ${source.project.audioMode}.`,
        `Use audioMode "${profileDefault}", or choose a profile that allows ${source.project.audioMode}.`,
      ),
    );
  }
  if (resolved.mode === "voice") return issues;
  if (source.narration) {
    issues.push(
      problem(
        "AUDIO_MODE_CONFLICT",
        "narration.json",
        "/",
        `Audio mode is ${resolved.mode}, but the project has narration.json; narration is never dropped silently.`,
        'Set audioMode to "voice" to keep the narration, or remove narration.json if the video has no speech.',
      ),
    );
  }
  const soundtrack = source.project.soundtrack;
  if (
    resolved.mode === "silent" &&
    (soundtrack?.music || soundtrack?.sfx.length)
  ) {
    issues.push(
      problem(
        "AUDIO_MODE_CONFLICT",
        "naraframe.json",
        "/soundtrack",
        "Audio mode is silent, but the project declares a soundtrack; a silent video carries no audio stream.",
        'Set audioMode to "music" to keep the soundtrack, or remove it.',
      ),
    );
  }
  return issues;
};

/**
 * What a final export needs from its audio mode beyond a conflict-free source:
 * voice needs narration, music needs a music bed, and a mode inferred from the
 * files must be declared before scene durations count as the final clock.
 */
export const checkFinalAudioMode = (
  source: PlanSource,
  resolved: ResolvedAudioMode,
  compiledNarration = source.narration !== undefined,
): Issue[] => {
  if (resolved.mode === "voice") {
    return source.narration && compiledNarration
      ? []
      : [
          problem(
            "NARRATION_REQUIRED",
            "narration.json",
            "/",
            "Audio mode is voice, so a final export needs narration; this project has none.",
            'Add narration.json with ready audio blocks, or set audioMode to "music" or "silent" if the video has no speech.',
          ),
        ];
  }
  const issues: Issue[] = [];
  if (resolved.source === "legacy") {
    issues.push(
      problem(
        "AUDIO_MODE_UNDECLARED",
        "naraframe.json",
        "/audioMode",
        `This project declares no audio mode; without narration its scene durations are draft timing, read as ${resolved.mode}.`,
        `Set audioMode to "${resolved.mode}" in naraframe.json to approve the scene durations as the final clock.`,
      ),
    );
  }
  if (resolved.mode === "music" && !source.project.soundtrack?.music) {
    issues.push(
      problem(
        "MUSIC_REQUIRED",
        "naraframe.json",
        "/soundtrack/music",
        "Audio mode is music, but the project declares no music bed.",
        'Add soundtrack.music with a ready audio asset, or set audioMode to "silent".',
      ),
    );
  }
  return issues;
};
