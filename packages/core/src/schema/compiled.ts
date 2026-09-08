import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  PositiveIntegerSchema,
  RelativePngPathSchema,
  SchemaVersionSchema,
  Sha256Schema,
  VersionSchema,
} from "./primitives.js";
import { RenderTokensSchema } from "./profile.js";
import { LayerSchema } from "./scene.js";

const CompiledAssetSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("png"),
      publicPath: RelativePngPathSchema,
      sha256: Sha256Schema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("placeholder"),
      assetId: IdSchema,
      label: z.string().trim().min(1),
    })
    .strict(),
]);

const CompiledVisualSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().min(1) }).strict(),
  z
    .object({
      type: z.literal("media"),
      assetId: IdSchema,
      fit: z.enum(["cover", "contain"]),
    })
    .strict(),
  z.object({ type: z.literal("composition") }).strict(),
]);

const CompiledBeatSchema = z
  .object({
    id: IdSchema,
    targetId: IdSchema,
    action: z.enum(["reveal", "emphasize", "focus"]),
    startFrame: NonNegativeIntegerSchema,
    durationInFrames: PositiveIntegerSchema,
  })
  .strict();

const CompiledSceneSchema = z
  .object({
    id: IdSchema,
    startFrame: NonNegativeIntegerSchema,
    endFrame: PositiveIntegerSchema,
    visual: CompiledVisualSchema,
    layers: z.array(LayerSchema),
    beats: z.array(CompiledBeatSchema),
  })
  .strict()
  .refine((scene) => scene.endFrame > scene.startFrame, {
    message: "endFrame must be greater than startFrame",
    path: ["endFrame"],
  });

export const CompiledDraftSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    mode: z.literal("draft"),
    width: z.literal(540),
    height: z.literal(960),
    fps: z.literal(30),
    totalFrames: PositiveIntegerSchema,
    timelineScope: z.enum(["project", "local"]),
    label: z.literal("DRAFT • NO AUDIO"),
    sourceRevision: Sha256Schema,
    assemblyKey: Sha256Schema,
    profile: z
      .object({
        id: IdSchema,
        version: VersionSchema,
        render: RenderTokensSchema,
      })
      .strict(),
    assets: z.record(IdSchema, CompiledAssetSchema),
    scenes: z.array(CompiledSceneSchema).min(1),
  })
  .strict()
  .superRefine((draft, context) => {
    draft.scenes.forEach((scene, index) => {
      if (scene.endFrame > draft.totalFrames) {
        context.addIssue({
          code: "custom",
          message: "Scene frame range exceeds totalFrames",
          path: ["scenes", index, "endFrame"],
        });
      }
    });
  });

export type CompiledAsset = z.infer<typeof CompiledAssetSchema>;
export type CompiledDraft = z.infer<typeof CompiledDraftSchema>;
