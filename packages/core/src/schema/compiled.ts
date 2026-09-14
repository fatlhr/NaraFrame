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
import { FocalPointSchema, LayerSchema } from "./scene.js";

/**
 * Frame-space counterpart of `TransitionSchema`: `durationMs` becomes
 * `durationInFrames` once fps is known, same shape otherwise.
 */
export const CompiledTransitionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cut") }).strict(),
  z
    .object({
      type: z.literal("push-through"),
      durationInFrames: PositiveIntegerSchema,
      direction: z.enum(["up", "down", "left", "right"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("mask-reveal"),
      durationInFrames: PositiveIntegerSchema,
      shape: z.enum(["circle", "rectangle"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("match-cut"),
      durationInFrames: PositiveIntegerSchema,
      anchor: FocalPointSchema.optional(),
    })
    .strict(),
]);

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

const CompiledBeatBaseShape = {
  id: IdSchema,
  targetId: IdSchema,
  startFrame: NonNegativeIntegerSchema,
  durationInFrames: PositiveIntegerSchema,
};

const EasingPresetSchema = z.enum(["linear", "smooth", "snappy"]);

export const CompiledBeatSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("reveal"),
      params: z
        .object({
          direction: z.enum(["up", "down", "left", "right"]),
          distance: z.number().nonnegative(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("emphasize"),
      params: z
        .object({
          scale: z.number().min(1).max(2),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("focus"),
      params: z
        .object({
          camera: z.enum(["push", "pan", "zoom"]),
          intensity: z.number().min(0).max(1),
          anchor: FocalPointSchema.optional(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
]);

const CompiledScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project") }).strict(),
  z
    .object({
      type: z.literal("scene"),
      sceneId: IdSchema,
      sourceStartFrame: NonNegativeIntegerSchema,
      sourceEndFrame: PositiveIntegerSchema,
    })
    .strict()
    .refine((scope) => scope.sourceEndFrame > scope.sourceStartFrame, {
      message: "sourceEndFrame must be greater than sourceStartFrame",
      path: ["sourceEndFrame"],
    }),
]);

const CompiledSceneSchema = z
  .object({
    id: IdSchema,
    startFrame: NonNegativeIntegerSchema,
    endFrame: PositiveIntegerSchema,
    visual: CompiledVisualSchema,
    layers: z.array(LayerSchema),
    beats: z.array(CompiledBeatSchema),
    /** How this scene exits into the next one; `cut` on the last scene. */
    transitionOut: CompiledTransitionSchema,
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
    scope: CompiledScopeSchema,
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
export type CompiledBeat = z.infer<typeof CompiledBeatSchema>;
export type CompiledTransition = z.infer<typeof CompiledTransitionSchema>;
export type CompiledDraft = z.infer<typeof CompiledDraftSchema>;
