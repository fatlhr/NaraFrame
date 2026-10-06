import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  PositiveIntegerSchema,
  RelativeAudioPathSchema,
  RelativeFontPathSchema,
  RelativePngPathSchema,
  RelativeSvgPathSchema,
  SchemaVersionSchema,
  Sha256Schema,
  VersionSchema,
} from "./primitives.js";
import { RenderTokensSchema } from "./profile.js";
import { FocalPointSchema, LayerSchema } from "./scene.js";

const EasingPresetSchema = z.enum(["linear", "smooth", "snappy"]);

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

const CompiledCameraSchema = z
  .object({
    initial: z
      .object({ x: z.number(), y: z.number(), zoom: z.number().positive() })
      .strict(),
    moves: z.array(
      z
        .object({
          id: IdSchema,
          startFrame: NonNegativeIntegerSchema,
          durationInFrames: PositiveIntegerSchema,
          to: z
            .object({
              x: z.number(),
              y: z.number(),
              zoom: z.number().positive(),
            })
            .strict(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    ),
  })
  .strict();

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
      kind: z.literal("svg"),
      publicPath: RelativeSvgPathSchema,
      sha256: Sha256Schema,
      /** Sanitised inner markup, ready to inline. */
      body: z.string(),
      viewBox: z
        .object({
          minX: z.number(),
          minY: z.number(),
          width: z.number().positive(),
          height: z.number().positive(),
        })
        .strict(),
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

/** One recipe text slot after resolving its style against the profile. */
export const CompiledTextSlotSchema = z
  .object({
    id: IdSchema,
    param: z.string().min(2),
    style: z
      .object({
        fontFamily: z.string().min(1),
        fontWeight: z.number().int().min(100).max(900),
        fontSize: z.number().positive(),
        /** CSS pixels between lines, not a multiplier. */
        lineHeight: z.number().positive(),
        letterSpacing: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
        maxLines: z.number().int().positive(),
        wrap: z.enum(["words", "none"]),
      })
      .strict(),
    /** One entry per string the slot covers (an array param gives several). */
    instances: z.array(
      z.object({ pointer: z.string().min(2), text: z.string() }).strict(),
    ),
  })
  .strict();

export type CompiledTextSlot = z.infer<typeof CompiledTextSlotSchema>;

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
  z
    .object({
      type: z.literal("recipe"),
      recipe: IdSchema,
      /**
       * How recipe code is executed. 2: bundled from a staged copy of exactly
       * the listed, hashed files; builds made before that are not reused.
       */
      executor: z.literal("naraframe-recipe/2"),
      version: z.string().min(1),
      /** Hash of the trusted code; any code change changes every key. */
      codeSha256: Sha256Schema,
      params: z.record(z.string(), z.unknown()),
      /** The PNGs the params reference, with their real pixel size. */
      assets: z.record(
        IdSchema,
        z
          .object({
            publicPath: z.string().min(1),
            width: z.number().int().positive(),
            height: z.number().int().positive(),
          })
          .strict(),
      ),
      /**
       * Declared text slots with the style resolved from the profile and
       * each instance's text; measured by the preview/render preflight and
       * passed to the recipe as props.textSlots. Absent when the recipe
       * declares none, so older recipe keys are unchanged.
       */
      textSlots: z.array(CompiledTextSlotSchema).optional(),
      /**
       * Version of the text-fit rules the preflight applies to the slots.
       * Present only with textSlots, so it is part of the keys of slot
       * recipes alone: a build checked under older rules is never reused
       * (preview reuse skips the preflight). 2: CSS line boxes (terminal
       * breaks, empty text) and only space/tab collapsing in pre-line.
       */
      textFitRules: z.literal("naraframe-text-fit/2").optional(),
    })
    .strict(),
]);

const CompiledBeatBaseShape = {
  id: IdSchema,
  targetId: IdSchema,
  startFrame: NonNegativeIntegerSchema,
  durationInFrames: PositiveIntegerSchema,
};

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
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("exit"),
      params: z
        .object({
          direction: z.enum(["up", "down", "left", "right"]).optional(),
          distance: z.number().nonnegative().optional(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("transform"),
      params: z
        .object({
          to: z
            .object({
              x: z.number().optional(),
              y: z.number().optional(),
              scale: z.number().positive().optional(),
              rotationDeg: z.number().optional(),
            })
            .strict(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("draw"),
      params: z
        .object({
          from: z.number().min(0).max(1).optional(),
          to: z.number().min(0).max(1).optional(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("follow"),
      params: z
        .object({
          pathId: IdSchema,
          from: z.number().min(0).max(1).optional(),
          to: z.number().min(0).max(1).optional(),
          orient: z.boolean().optional(),
          easingPreset: EasingPresetSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...CompiledBeatBaseShape,
      action: z.literal("count"),
      params: z
        .object({
          from: z.number(),
          to: z.number(),
          decimals: z.number().int().min(0).max(3).optional(),
          grouping: z.enum(["none", ".", ",", " "]).optional(),
          prefix: z.string().max(48).optional(),
          suffix: z.string().max(48).optional(),
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
    camera: CompiledCameraSchema.optional(),
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

const CompiledSoundtrackSchema = z
  .object({
    music: z
      .object({
        assetId: IdSchema,
        volume: z.number().min(0).max(1),
        loop: z.boolean(),
        trimStartFrames: NonNegativeIntegerSchema,
        fadeInFrames: NonNegativeIntegerSchema,
        fadeOutFrames: NonNegativeIntegerSchema,
        duck: z
          .object({
            volume: z.number().min(0).max(1),
            attackFrames: NonNegativeIntegerSchema,
            releaseFrames: NonNegativeIntegerSchema,
            windows: z.array(
              z
                .object({
                  startFrame: NonNegativeIntegerSchema,
                  endFrame: PositiveIntegerSchema,
                })
                .strict(),
            ),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    sfx: z.array(
      z
        .object({
          id: IdSchema,
          assetId: IdSchema,
          startFrame: NonNegativeIntegerSchema,
          volume: z.number().min(0).max(1),
        })
        .strict(),
    ),
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
    soundtrack: CompiledSoundtrackSchema.optional(),
  })
  .strict()
  .superRefine((draft, context) => {
    const isFinal = draft.mode === "final";
    const native = draft.width === 1080 && draft.height === 1920;
    const half = draft.width === 540 && draft.height === 960;
    if (
      (isFinal ? !native : !(native || half)) ||
      isFinal !== (draft.label === "FINAL")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "A final draft uses the 1080x1920 design format and the FINAL label; a draft uses 540x960 or native 1080x1920 and a DRAFT label",
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
export type CompiledSoundtrack = z.infer<typeof CompiledSoundtrackSchema>;
export type CompiledAudioClip = z.infer<typeof CompiledAudioClipSchema>;
export type CompiledDraft = z.infer<typeof CompiledDraftSchema>;
