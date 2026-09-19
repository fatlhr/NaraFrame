import type { PlanSource, Scene } from "@naraframe/core";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);

const render: PlanSource["profile"]["render"] = {
  palette: {
    background: "#11130F",
    surface: "#E8E0D2",
    text: "#F5F1E8",
    accent: "#FF5A36",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    headingWeight: 800,
    bodyWeight: 500,
  },
  safeZone: { top: 0, right: 0, bottom: 0, left: 0 },
  spacingUnit: 8,
  motion: { revealDurationMs: 500, emphasizeScale: 1.08, focusScale: 1.14 },
};

export const narratedScene = (
  id: string,
  narration?: { blockId: string; phraseId?: string },
): Scene => ({
  id,
  narrativeRole: "context",
  // Deliberately unrelated to the narration clock: it must be ignored.
  durationMs: 999,
  visual: { type: "text", text: id },
  beats: [],
  transition: { type: "cut" },
  ...(narration ? { narration } : {}),
});

export const audioAsset = (id: string, sha256: string) =>
  ({
    id,
    status: "ready",
    kind: "mp3",
    path: `audio/narration/${sha256}.mp3`,
    sha256,
    origin: { type: "generated", source: "google-ai-studio" },
  }) as const;

export interface NarratedOverrides {
  contextDurationMs?: number;
  contextAsset?: { id: string; sha256: string };
  requireSourcing?: boolean;
  scenes?: Scene[];
  blocks?: unknown[];
  captionStyle?: NonNullable<PlanSource["profile"]["render"]["captions"]>;
  captions?: PlanSource["captions"];
}

/** Two ready blocks: context (2 phrases) and mechanism, per the spec example. */
export const narratedSource = (
  overrides: NarratedOverrides = {},
): PlanSource => {
  const contextAsset = overrides.contextAsset ?? {
    id: "voice-context",
    sha256: SHA_A,
  };
  return {
    project: {
      schemaVersion: 1,
      id: "narrated",
      title: "Narrated",
      profile: { id: "probe-profile", version: "0.1.0" },
      format: {
        design: { width: 1080, height: 1920, fps: 30 },
        draft: { width: 540, height: 960, fps: 30 },
      },
      safetyMaxDurationMs: 180_000,
    },
    profile: {
      schemaVersion: 1,
      id: "probe-profile",
      version: "0.1.0",
      source: { kind: "local", identity: "probe@0.1.0" },
      direction: { text: "Probe direction.", sha256: "a".repeat(64) },
      render: overrides.captionStyle
        ? { ...render, captions: overrides.captionStyle }
        : render,
      production: {
        voiceStyleSignature: "probe",
        illustrationStyleSignature: "probe",
        timing: { wordLevelRequired: false },
        assetPolicy: { allowPlannedInDraft: true },
        ...(overrides.requireSourcing ? { requireSourcing: true } : {}),
      },
      duration: { preferredMinMs: 1000, preferredMaxMs: 60_000 },
      lockedPaths: [],
      overridablePaths: [],
      assets: [],
    },
    scenes: {
      schemaVersion: 1,
      scenes: overrides.scenes ?? [
        narratedScene("s1", { blockId: "context" }),
        narratedScene("s2", { blockId: "context", phraseId: "c2" }),
        narratedScene("s3", { blockId: "mechanism" }),
      ],
    },
    assets: {
      schemaVersion: 1,
      assets: [
        audioAsset(contextAsset.id, contextAsset.sha256),
        audioAsset("voice-mechanism", SHA_B),
      ],
    },
    ...(overrides.captions ? { captions: overrides.captions } : {}),
    narration: {
      schemaVersion: 1,
      order: ["context", "mechanism"],
      blocks: (overrides.blocks ?? [
        {
          id: "context",
          text: "Krakatau memiliki sejarah. Erupsinya panjang.",
          audioAssetId: contextAsset.id,
          audioDurationMs: overrides.contextDurationMs ?? 2400,
          pauseAfterMs: 300,
          phrases: [
            {
              id: "c1",
              text: "Krakatau memiliki sejarah.",
              startMs: 100,
              endMs: 1000,
            },
            {
              id: "c2",
              text: "Erupsinya panjang.",
              startMs: 1200,
              endMs: 2200,
            },
          ],
        },
        {
          id: "mechanism",
          text: "Tekanan magma meningkat.",
          audioAssetId: "voice-mechanism",
          audioDurationMs: 1800,
          pauseAfterMs: 0,
          phrases: [
            {
              id: "m1",
              text: "Tekanan magma meningkat.",
              startMs: 100,
              endMs: 1700,
            },
          ],
        },
      ]) as NonNullable<PlanSource["narration"]>["blocks"],
    },
  };
};
