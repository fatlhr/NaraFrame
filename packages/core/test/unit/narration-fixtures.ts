import type { Narration } from "@naraframe/core";
import { NarrationSchema } from "@naraframe/core";

export const specNarration = (contextDurationMs = 2400): Narration =>
  NarrationSchema.parse({
    schemaVersion: 1,
    order: ["context", "mechanism"],
    blocks: [
      {
        id: "context",
        text: "Krakatau memiliki sejarah erupsi yang panjang.",
        audioAssetId: "voice-context",
        audioDurationMs: contextDurationMs,
        pauseAfterMs: 300,
        phrases: [
          { id: "c1", text: "Krakatau memiliki", startMs: 100, endMs: 1000 },
          {
            id: "c2",
            text: "sejarah erupsi yang panjang.",
            startMs: 1200,
            endMs: 2200,
          },
        ],
      },
      {
        id: "mechanism",
        text: "Tekanan magma dapat meningkat.",
        audioAssetId: "voice-mechanism",
        audioDurationMs: 1800,
        pauseAfterMs: 0,
        phrases: [
          {
            id: "m1",
            text: "Tekanan magma dapat meningkat.",
            startMs: 100,
            endMs: 1700,
          },
        ],
      },
    ],
  });

export const must = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error("Expected fixture value to exist");
  }
  return value;
};
