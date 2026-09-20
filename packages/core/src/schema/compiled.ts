import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  PositiveIntegerSchema,
  RelativeAudioPathSchema,
  RelativeFontPathSchema,
  RelativePngPathSchema,
  SchemaVersionSchema,
  Sha256Schema,
  VersionSchema,
} from "./primitives.js";
import { RenderTokensSchema } from "./profile.js";
import { FocalPointSchema, LayerSchema } from "./scene.js";

/** A bundled profile font ready to register before measurement/preflight. */
export const CompiledFontSchema = z
  .object({
    family: z.string().trim().min(1),
    weight: z.number().int().min(100).max(900),
    publicPath: RelativeFontPathSchema,
    sha256: Sha256Schema,
  })
  .strict();

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
      kind: z.enum(["mp3", "wav", "m4a"]),
      publicPath: RelativeAudioPathSchema,
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
      /** Null when an earlier block has no measured audio: never invented. */
      sourceStartFrame: NonNegativeIntegerSchema.nullable(),
      sourceEndFrame: PositiveIntegerSchema.nullable(),
    })
    .strict()
    .refine(
      (scope) =>
        (scope.sourceStartFrame === null) === (scope.sourceEndFrame === null) &&
        (scope.sourceStartFrame === null ||
          (scope.sourceEndFrame ?? 0) > scope.sourceStartFrame),
      {
        message:
          "Both source frames are null together, or sourceEndFrame is greater than sourceStartFrame",
        path: ["sourceEndFrame"],
      },
    ),
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
    /**
     * Set only in a preview of one scene: the previous scene's transition
     * handle that plays inside this scene's first frames.
     */
    transitionIn: CompiledTransitionSchema.optional(),
    /** Set only in a preview of one scene that is not the project's last scene. */
    hasNextScene: z.boolean().optional(),
  })
  .strict()
  .refine((scene) => scene.endFrame > scene.startFrame, {
    message: "endFrame must be greater than startFrame",
    path: ["endFrame"],
  });

const CompiledAudioClipSchema = z
  .object({
    blockId: IdSchema,
    assetId: IdSchema,
    startFrame: NonNegativeIntegerSchema,
    durationInFrames: PositiveIntegerSchema,
    startMs: NonNegativeIntegerSchema,
    durationMs: PositiveIntegerSchema,
    /** Frames skipped at the start of the clip (a scoped preview starts mid-block). */
    trimStartFrames: NonNegativeIntegerSchema.optional(),
  })
  .strict();

const CompiledCaptionsSchema = z
  .object({
    style: z
      .object({
        fontSize: z.number().positive(),
        maxLines: PositiveIntegerSchema,
        bottom: z.number().nonnegative(),
        side: z.number().nonnegative(),
      })
      .strict(),
    cues: z.array(
      z
        .object({
          id: z.string().min(1),
          text: z.string().min(1),
          startFrame: NonNegativeIntegerSchema,
          endFrame: PositiveIntegerSchema,
        })
        .strict(),
    ),
  })
  .strict();

export const CompiledDraftSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    mode: z.enum(["draft", "final"]),
    width: z.union([z.literal(540), z.literal(1080)]),
    height: z.union([z.literal(960), z.literal(1920)]),
    fps: z.literal(30),
    totalFrames: PositiveIntegerSchema,
    scope: CompiledScopeSchema,
    timelineScope: z.enum(["project", "local"]),
    label: z.enum(["DRAFT • NO AUDIO", "DRAFT • WITH AUDIO", "FINAL"]),
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
    fonts: z.array(CompiledFontSchema),
    scenes: z.array(CompiledSceneSchema).min(1),
    narration: z
      .object({
        totalDurationMs: PositiveIntegerSchema,
        clips: z.array(CompiledAudioClipSchema),
      })
      .optional(),
    captions: CompiledCaptionsSchema.optional(),
  })
  .strict()
  .superRefine((draft, context) => {
    const isFinal = draft.mode === "final";
    if (
      isFinal !== (draft.width === 1080 && draft.height === 1920) ||
      isFinal !== (draft.label === "FINAL")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "A final draft uses the 1080x1920 design format and the FINAL label; a draft uses 540x960 and a DRAFT label",
        path: ["mode"],
      });
    }
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
export type CompiledFont = z.infer<typeof CompiledFontSchema>;
export type CompiledTransition = z.infer<typeof CompiledTransitionSchema>;
export type CompiledCaptions = z.infer<typeof CompiledCaptionsSchema>;
export type CompiledAudioClip = z.infer<typeof CompiledAudioClipSchema>;
export type CompiledDraft = z.infer<typeof CompiledDraftSchema>;
