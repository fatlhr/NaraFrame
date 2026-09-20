import { z } from "zod";
import {
  ConfigPathSchema,
  IdSchema,
  SchemaVersionSchema,
  VersionSchema,
} from "./primitives.js";
import { SoundtrackSchema } from "./soundtrack.js";

const DesignFormatSchema = z
  .object({
    width: z.literal(1080),
    height: z.literal(1920),
    fps: z.literal(30),
  })
  .strict();

const DraftFormatSchema = z
  .object({
    width: z.literal(540),
    height: z.literal(960),
    fps: z.literal(30),
  })
  .strict();

export const ProjectConfigSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    id: IdSchema,
    title: z.string().trim().min(1),
    profile: z.object({ id: IdSchema, version: VersionSchema }).strict(),
    format: z
      .object({ design: DesignFormatSchema, draft: DraftFormatSchema })
      .strict(),
    safetyMaxDurationMs: z.literal(180_000),
    /**
     * Explicit project overrides of profile settings, by dotted config path.
     * Only paths the profile declares overridable are accepted.
     */
    overrides: z.record(ConfigPathSchema, z.unknown()).optional(),
    /** One optional music bed plus scene-anchored effects; never changes the timeline. */
    soundtrack: SoundtrackSchema.optional(),
  })
  .strict();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
