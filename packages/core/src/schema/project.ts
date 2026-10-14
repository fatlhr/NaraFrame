import { z } from "zod";
import { LibraryImportSchema } from "./library.js";
import {
  ConfigPathSchema,
  IdSchema,
  SchemaVersionSchema,
  VersionSchema,
} from "./primitives.js";
import { RecipeDeclarationSchema } from "./recipe.js";
import { SoundtrackSchema } from "./soundtrack.js";

/**
 * Which audio a production carries. `voice` is narrated (optionally with
 * music); `music` is a music bed with no speech; `silent` has no audio stream.
 * Without speech, the scenes' own durations are the final clock.
 */
export const AudioModeSchema = z.enum(["voice", "music", "silent"]);
export type AudioMode = z.infer<typeof AudioModeSchema>;

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
    /** Trusted local recipes this project's scenes may use (NF-AU-01). */
    recipes: z.array(RecipeDeclarationSchema).max(8).optional(),
    /** The production's audio intent; overrides the profile default. */
    audioMode: AudioModeSchema.optional(),
    /** One optional music bed plus scene-anchored effects; never changes the timeline. */
    soundtrack: SoundtrackSchema.optional(),
    /** Passive pinned authoring receipts; never reads a catalog during render. */
    libraryImports: z.array(LibraryImportSchema).optional(),
  })
  .strict()
  .superRefine((project, ctx) => {
    const instances = new Set<string>(),
      scenes = new Set<string>();
    for (const [index, receipt] of (project.libraryImports ?? []).entries()) {
      if (instances.has(receipt.instance) || scenes.has(receipt.sceneId))
        ctx.addIssue({
          code: "custom",
          path: ["libraryImports", index],
          message: "Library import instance and scene IDs must be unique",
        });
      instances.add(receipt.instance);
      scenes.add(receipt.sceneId);
    }
  });

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
