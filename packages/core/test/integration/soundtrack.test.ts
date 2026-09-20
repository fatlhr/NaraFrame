import type { PlanSource } from "@naraframe/core";
import {
  checkProductionReadiness,
  compileDraft,
  SoundtrackSchema,
  validatePlanSource,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { audioAsset, narratedSource } from "./narrated-source.js";

const withSoundtrack = (
  input: unknown,
  options: { plannedMusic?: boolean } = {},
): PlanSource => {
  const source = narratedSource();
  return {
    ...source,
    project: { ...source.project, soundtrack: SoundtrackSchema.parse(input) },
    assets: {
      ...source.assets,
      assets: [
        ...source.assets.assets,
        options.plannedMusic
          ? {
              id: "bed",
              status: "planned",
              kind: "mp3",
              purpose: "music bed",
              intendedOrigin: "licensed",
            }
          : audioAsset("bed", "c".repeat(64)),
        audioAsset("whoosh", "d".repeat(64)),
      ] as PlanSource["assets"]["assets"],
    },
  };
};

const compiled = (source: PlanSource, scope?: { sceneId: string }) => {
  const result = compileDraft(
    source,
    scope ? { type: "scene", sceneId: scope.sceneId } : { type: "project" },
  );
  if (!result.ok)
    throw new Error(`compile failed: ${result.issues.map((i) => i.code)}`);
  return result;
};

const soundtrack = {
  music: {
    assetId: "bed",
    volume: 0.5,
    fadeInMs: 500,
    fadeOutMs: 1000,
    trimStartMs: 2000,
    duck: { volume: 0.2, attackMs: 200, releaseMs: 400 },
  },
  sfx: [{ id: "hit", assetId: "whoosh", sceneId: "s3", offsetMs: 100 }],
};

describe("soundtrack compile", () => {
  it("places music, ducking windows and scene-anchored effects on the frame timeline", () => {
    const { value } = compiled(withSoundtrack(soundtrack));
    const st = value.soundtrack;
    expect(st?.music).toMatchObject({
      assetId: "bed",
      volume: 0.5,
      loop: false,
      trimStartFrames: 60,
      fadeInFrames: 15,
      fadeOutFrames: 30,
    });
    expect(st?.music?.duck?.windows).toEqual(
      value.narration?.clips.map((clip) => ({
        startFrame: clip.startFrame,
        endFrame: clip.startFrame + clip.durationInFrames,
      })),
    );
    const s3 = value.scenes.find((scene) => scene.id === "s3");
    expect(st?.sfx).toEqual([
      {
        id: "hit",
        assetId: "whoosh",
        startFrame: (s3?.startFrame ?? 0) + 3,
        volume: 0.8,
      },
    ]);
    expect(value.label).toBe("DRAFT • WITH AUDIO");
  });

  it("never changes the timeline length", () => {
    const plain = compiled(narratedSource()).value;
    const withMusic = compiled(withSoundtrack(soundtrack)).value;
    expect(withMusic.totalFrames).toBe(plain.totalFrames);
    expect(withMusic.scenes.map((s) => [s.startFrame, s.endFrame])).toEqual(
      plain.scenes.map((s) => [s.startFrame, s.endFrame]),
    );
  });

  it("changes the assembly key only when a soundtrack is present", () => {
    const plain = compiled(narratedSource()).value;
    const loud = compiled(withSoundtrack(soundtrack)).value;
    const quiet = compiled(
      withSoundtrack({
        ...soundtrack,
        music: { ...soundtrack.music, volume: 0.4 },
      }),
    ).value;
    expect(loud.assemblyKey).not.toBe(plain.assemblyKey);
    expect(quiet.assemblyKey).not.toBe(loud.assemblyKey);
    // scene render keys are untouched, so only the assembly re-runs
    expect(compiled(withSoundtrack(soundtrack)).value.assemblyKey).toBe(
      loud.assemblyKey,
    );
  });

  it("gives a scoped preview only its own effects and no music", () => {
    const scoped = compiled(withSoundtrack(soundtrack), {
      sceneId: "s3",
    }).value;
    expect(scoped.soundtrack?.music).toBeUndefined();
    expect(scoped.soundtrack?.sfx.map((e) => e.id)).toEqual(["hit"]);
    const other = compiled(withSoundtrack(soundtrack), { sceneId: "s1" }).value;
    expect(other.soundtrack).toBeUndefined();
  });

  it("warns when music would mask speech, and stays quiet with ducking", () => {
    const loud = compiled(
      withSoundtrack({ music: { assetId: "bed", volume: 0.8 }, sfx: [] }),
    );
    expect(loud.issues.map((i) => i.code)).toContain(
      "MUSIC_MAY_MASK_NARRATION",
    );
    const ducked = compiled(withSoundtrack(soundtrack));
    expect(ducked.issues.map((i) => i.code)).not.toContain(
      "MUSIC_MAY_MASK_NARRATION",
    );
  });

  it("rejects an effect that would start after the video ends", () => {
    const source = withSoundtrack({
      sfx: [{ id: "late", assetId: "whoosh", sceneId: "s3", offsetMs: 60_000 }],
    });
    const result = compileDraft(source);
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("SFX_AFTER_END");
  });

  it("leaves a planned track out of a draft but blocks final until it is ready", () => {
    const source = withSoundtrack(soundtrack, { plannedMusic: true });
    const draft = compiled(source);
    expect(draft.value.soundtrack?.music).toBeUndefined();
    expect(draft.issues.map((i) => i.code)).toContain(
      "SOUNDTRACK_ASSET_PLANNED",
    );
    const final = compileDraft(source, { type: "project" }, { mode: "final" });
    if (!final.ok) throw new Error("final compile");
    const issues = checkProductionReadiness(source, final.value, final.issues);
    expect(
      issues.find((i) => i.code === "SOUNDTRACK_ASSET_PLANNED")?.severity,
    ).toBe("error");
  });
});

describe("soundtrack validation", () => {
  const validate = (input: unknown) => {
    const source = withSoundtrack(input);
    return validatePlanSource({
      project: source.project,
      profile: source.profile,
      scenes: source.scenes,
      assets: source.assets,
      narration: source.narration,
    });
  };

  it("accepts a valid soundtrack", () => {
    expect(validate(soundtrack).ok).toBe(true);
  });

  it("rejects undeclared assets, unknown scenes, narration audio, and duplicate ids at the schema", () => {
    const codes = (input: unknown) =>
      validate(input).issues.map((issue) => issue.code);
    expect(codes({ music: { assetId: "nope" }, sfx: [] })).toContain(
      "ASSET_UNDECLARED",
    );
    expect(codes({ music: { assetId: "voice-context" }, sfx: [] })).toContain(
      "SOUNDTRACK_ASSET_IS_NARRATION",
    );
    expect(
      codes({ sfx: [{ id: "a", assetId: "whoosh", sceneId: "ghost" }] }),
    ).toContain("SFX_SCENE_UNKNOWN");
    expect(
      SoundtrackSchema.safeParse({
        sfx: [
          { id: "a", assetId: "whoosh", sceneId: "s1" },
          { id: "a", assetId: "whoosh", sceneId: "s2" },
        ],
      }).success,
    ).toBe(false);
  });
});
