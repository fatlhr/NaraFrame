import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompiledDraft } from "@naraframe/core";
import { compileDraft, SoundtrackSchema } from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  audioAsset,
  narratedSource,
} from "../../../core/test/integration/narrated-source.js";
import { preflightSoundtrackAudio } from "../../src/final-build.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((r) => rm(r, { recursive: true, force: true })),
  );
});

const draftWith = (music: unknown): CompiledDraft => {
  const source = narratedSource();
  const result = compileDraft({
    ...source,
    project: {
      ...source.project,
      soundtrack: SoundtrackSchema.parse({ music, sfx: [] }),
    },
    assets: {
      ...source.assets,
      assets: [...source.assets.assets, audioAsset("bed", "c".repeat(64))],
    },
  });
  if (!result.ok) throw new Error("compile");
  return result.value;
};

/** Runs the preflight with a fixed measured level for the bed and for narration. */
const check = async (bedDb: number, voiceDb: number, music: unknown) => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-loud-"));
  roots.push(root);
  const issues = await preflightSoundtrackAudio(
    root,
    draftWith(music),
    async () => 60_000,
    async (path) => (path.includes("c".repeat(64)) ? bedDb : voiceDb),
  );
  return issues.map((issue) => issue.code);
};

describe("music loudness measured from the real files", () => {
  // The numbers are the owner's own: narration at -16.7 dB, and the two beds
  // from the soundtrack demo, one of which he could not hear at all.
  const NARRATION_DB = -16.7;

  it("catches the bed that could not be heard, at the settings that produced it", async () => {
    expect(
      await check(-23.7, NARRATION_DB, {
        assetId: "bed",
        volume: 0.4,
        duck: { volume: 0.25 },
      }),
    ).toContain("MUSIC_INAUDIBLE");
  });

  it("stays quiet for the corrected mix he confirmed he could hear", async () => {
    expect(
      await check(-7.7, NARRATION_DB, {
        assetId: "bed",
        volume: 0.6,
        duck: { volume: 0.15 },
      }),
    ).toEqual([]);
  });

  it("warns when music sits too close to the voice, and ducking fixes it", async () => {
    expect(
      await check(-7.7, NARRATION_DB, { assetId: "bed", volume: 0.9 }),
    ).toContain("MUSIC_MASKS_NARRATION");
    expect(
      await check(-7.7, NARRATION_DB, {
        assetId: "bed",
        volume: 0.9,
        duck: { volume: 0.1 },
      }),
    ).not.toContain("MUSIC_MASKS_NARRATION");
  });

  it("says nothing when the level cannot be measured", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-loud-"));
    roots.push(root);
    const issues = await preflightSoundtrackAudio(
      root,
      draftWith({ assetId: "bed", volume: 0.4 }),
      async () => 60_000,
      async () => null,
    );
    expect(issues).toEqual([]);
  });
});
