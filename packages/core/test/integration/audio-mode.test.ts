import type { PlanSource } from "@naraframe/core";
import {
  checkProductionReadiness,
  compileDraft,
  narrationTextHash,
  resolveAudioMode,
  SoundtrackSchema,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import {
  audioAsset,
  narratedScene,
  narratedSource,
} from "./narrated-source.js";

const codes = (issues: Array<{ code: string }>) =>
  issues.map((issue) => issue.code).sort();

const bound = (source: PlanSource): PlanSource => ({
  ...source,
  assets: {
    ...source.assets,
    assets: source.assets.assets.map((asset) => {
      if (asset.status !== "ready" || asset.kind === "png") return asset;
      const text = source.narration?.blocks.find(
        (block) => "audioAssetId" in block && block.audioAssetId === asset.id,
      )?.text;
      return text
        ? { ...asset, generation: { textSha256: narrationTextHash(text) } }
        : asset;
    }),
  },
});

/** Explicitly timed scenes and no narration.json. */
const unnarrated = (
  project: Partial<PlanSource["project"]> = {},
  profileProduction: Partial<PlanSource["profile"]["production"]> = {},
  lockedPaths: string[] = [],
): PlanSource => {
  const base = narratedSource({ scenes: [narratedScene("s1")], lockedPaths });
  const { narration: _omit, ...rest } = base;
  return {
    ...rest,
    project: { ...rest.project, ...project },
    profile: {
      ...rest.profile,
      production: { ...rest.profile.production, ...profileProduction },
    },
    scenes: {
      ...rest.scenes,
      scenes: rest.scenes.scenes.map(({ narration: _n, ...scene }) => scene),
    },
    assets: {
      ...rest.assets,
      assets: [
        ...rest.assets.assets,
        audioAsset("bed", "c".repeat(64)),
        audioAsset("hit-fx", "d".repeat(64)),
      ] as PlanSource["assets"]["assets"],
    },
  };
};

const music = SoundtrackSchema.parse({ music: { assetId: "bed" } });

const check = (source: PlanSource, finalExport = true) => {
  const final = compileDraft(source, { type: "project" }, { mode: "final" });
  if (!final.ok)
    throw new Error(`final compile failed: ${codes(final.issues)}`);
  return checkProductionReadiness(source, final.value, final.issues, {
    finalExport,
  }).filter((issue) => issue.severity === "error");
};

describe("audio mode resolution", () => {
  it("reads a mode from the project, then the profile, then the files", () => {
    expect(resolveAudioMode(unnarrated({ audioMode: "silent" }))).toEqual({
      mode: "silent",
      source: "project",
    });
    expect(resolveAudioMode(unnarrated({}, { audioMode: "music" }))).toEqual({
      mode: "music",
      source: "profile",
    });
    expect(resolveAudioMode(narratedSource())).toEqual({
      mode: "voice",
      source: "legacy",
    });
    expect(resolveAudioMode(unnarrated({ soundtrack: music }))).toEqual({
      mode: "music",
      source: "legacy",
    });
    expect(resolveAudioMode(unnarrated())).toEqual({
      mode: "silent",
      source: "legacy",
    });
  });
});

describe("final readiness by audio mode", () => {
  it("keeps a legacy narrated project ready without a declaration", () => {
    expect(check(bound(narratedSource()))).toEqual([]);
  });

  it("exports declared music-only and silent projects without narration", () => {
    expect(
      check(unnarrated({ audioMode: "music", soundtrack: music })),
    ).toEqual([]);
    expect(check(unnarrated({ audioMode: "silent" }))).toEqual([]);
    expect(
      check(unnarrated({ soundtrack: music }, { audioMode: "music" })),
    ).toEqual([]);
  });

  it("does not promote undeclared draft timing to a final clock", () => {
    expect(codes(check(unnarrated()))).toEqual(["AUDIO_MODE_UNDECLARED"]);
    expect(codes(check(unnarrated({ soundtrack: music })))).toEqual([
      "AUDIO_MODE_UNDECLARED",
    ]);
    // A production preview of the same source is not blocked.
    expect(check(unnarrated(), false)).toEqual([]);
  });

  it("still requires narration when voice is requested", () => {
    expect(codes(check(unnarrated({ audioMode: "voice" })))).toEqual([
      "NARRATION_REQUIRED",
    ]);
  });

  it("requires a music bed for music-only", () => {
    expect(codes(check(unnarrated({ audioMode: "music" })))).toEqual([
      "MUSIC_REQUIRED",
    ]);
  });

  it("never drops narration or adds sound to match a mode", () => {
    const narrated = bound(narratedSource());
    const musicOverVoice: PlanSource = {
      ...narrated,
      project: { ...narrated.project, audioMode: "music", soundtrack: music },
      assets: {
        ...narrated.assets,
        assets: [
          ...narrated.assets.assets,
          audioAsset("bed", "c".repeat(64)),
        ] as PlanSource["assets"]["assets"],
      },
    };
    expect(codes(check(musicOverVoice))).toEqual(["AUDIO_MODE_CONFLICT"]);
    expect(codes(check(musicOverVoice, false))).toEqual([
      "AUDIO_MODE_CONFLICT",
    ]);

    const silentWithSfx = unnarrated({
      audioMode: "silent",
      soundtrack: SoundtrackSchema.parse({
        sfx: [{ id: "hit", assetId: "hit-fx", sceneId: "s1" }],
      }),
    });
    expect(codes(check(silentWithSfx))).toEqual(["AUDIO_MODE_CONFLICT"]);
  });

  it("enforces a profile-locked mode", () => {
    const locked = unnarrated({ audioMode: "silent" }, { audioMode: "music" }, [
      "production.audioMode",
    ]);
    expect(codes(check(locked))).toEqual(["AUDIO_MODE_LOCKED"]);
    const unlocked = unnarrated(
      { audioMode: "silent" },
      { audioMode: "music" },
    );
    expect(check(unlocked)).toEqual([]);
  });
});
