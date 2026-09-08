import { z } from "zod";
import { IdSchema, SchemaVersionSchema, VersionSchema } from "./primitives.js";

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
  })
  .strict();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
