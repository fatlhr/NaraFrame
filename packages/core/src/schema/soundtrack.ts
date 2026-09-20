import { z } from "zod";
import { IdSchema } from "./primitives.js";

const Gain = z.number().min(0).max(1);
const Ms = z.number().int().nonnegative().max(600_000);

/**
 * Ducking lowers the music while narration speaks. `volume` is the fraction
 * of the music's own level that remains under speech.
 */
export const DuckSchema = z
  .object({
    volume: Gain.default(0.35),
    attackMs: Ms.default(200),
    releaseMs: Ms.default(500),
  })
  .strict();

export const MusicTrackSchema = z
  .object({
    assetId: IdSchema,
    volume: Gain.default(0.3),
    loop: z.boolean().default(false),
    trimStartMs: Ms.default(0),
    fadeInMs: Ms.default(0),
    fadeOutMs: Ms.default(0),
    duck: DuckSchema.optional(),
  })
  .strict();

/** A short effect anchored to a scene, so scene edits move it along. */
export const SfxSchema = z
  .object({
    id: IdSchema,
    assetId: IdSchema,
    sceneId: IdSchema,
    offsetMs: Ms.default(0),
    volume: Gain.default(0.8),
  })
  .strict();

export const SoundtrackSchema = z
  .object({
    music: MusicTrackSchema.optional(),
    sfx: z.array(SfxSchema).max(64).default([]),
  })
  .strict()
  .superRefine((soundtrack, context) => {
    const ids = new Set<string>();
    soundtrack.sfx.forEach((effect, index) => {
      if (ids.has(effect.id)) {
        context.addIssue({
          code: "custom",
          message: "SFX IDs must be unique",
          path: ["sfx", index, "id"],
        });
      }
      ids.add(effect.id);
    });
  });

export type Soundtrack = z.infer<typeof SoundtrackSchema>;
export type MusicTrack = z.infer<typeof MusicTrackSchema>;
