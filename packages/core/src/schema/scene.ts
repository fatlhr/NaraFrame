import { z } from "zod";
import {
  ColorSchema,
  IdSchema,
  NonNegativeIntegerSchema,
  PositiveIntegerSchema,
  SchemaVersionSchema,
} from "./primitives.js";
import { SourceSchema } from "./source.js";

export const FrameSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

export const InsetsSchema = z
  .object({
    top: z.number().nonnegative(),
    right: z.number().nonnegative(),
    bottom: z.number().nonnegative(),
    left: z.number().nonnegative(),
  })
  .strict();

export const FocalPointSchema = z
  .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
  .strict();

export const StrokeSchema = z
  .object({ color: ColorSchema, width: z.number().min(0).max(40) })
  .strict();

export const ShadowSchema = z
  .object({
    color: ColorSchema,
    opacity: z.number().min(0).max(1),
    offsetX: z.number().min(-200).max(200),
    offsetY: z.number().min(-200).max(200),
    blur: z.number().min(0).max(200),
  })
  .strict();

export const TypographyRoleSchema = z.enum([
  "display",
  "heading",
  "body",
  "label",
]);

const LayerPresentationShape = {
  opacity: z.number().min(0).max(1),
  rotationDeg: z.number(),
  zIndex: z.number().int(),
  slot: IdSchema.optional(),
};

const TextLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("text"),
    text: z.string().min(1),
    frame: FrameSchema,
    role: TypographyRoleSchema.optional(),
    fontSize: z.number().min(12).max(320).optional(),
    fontWeight: z.number().int().min(100).max(900).optional(),
    lineHeight: z.number().min(0.8).max(2).optional(),
    letterSpacing: z.number().min(-20).max(40).optional(),
    color: ColorSchema.optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    verticalAlign: z.enum(["top", "center", "bottom"]).optional(),
    padding: InsetsSchema.optional(),
    maxLines: z.number().int().min(1).max(20).optional(),
    overflowPolicy: z.enum(["error", "shrink"]).optional(),
    avoidLayerIds: z.array(IdSchema).max(20).optional(),
    ...LayerPresentationShape,
  })
  .strict();

const ImageLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("image"),
    assetId: IdSchema,
    fit: z.enum(["cover", "contain"]),
    frame: FrameSchema,
    focalPoint: FocalPointSchema.optional(),
    cornerRadius: z.number().min(0).max(960).optional(),
    stroke: StrokeSchema.optional(),
    shadow: ShadowSchema.optional(),
    ...LayerPresentationShape,
  })
  .strict();

const ShapeLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("shape"),
    shape: z.enum(["rectangle", "circle"]),
    fill: ColorSchema,
    frame: FrameSchema,
    cornerRadius: z.number().min(0).max(960).optional(),
    stroke: StrokeSchema.optional(),
    shadow: ShadowSchema.optional(),
    ...LayerPresentationShape,
  })
  .strict();

const GroupLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("group"),
    memberIds: z.array(IdSchema).min(1),
    frame: FrameSchema.optional(),
    layout: z
      .discriminatedUnion("type", [
        z.object({ type: z.literal("absolute") }).strict(),
        z
          .object({
            type: z.literal("stack"),
            direction: z.enum(["horizontal", "vertical"]),
            gap: z.number().min(0).max(400),
            padding: InsetsSchema,
            align: z.enum(["start", "center", "end", "stretch"]),
          })
          .strict(),
        z
          .object({
            type: z.literal("grid"),
            columns: z.number().int().min(1).max(12),
            columnGap: z.number().min(0).max(400),
            rowGap: z.number().min(0).max(400),
            padding: InsetsSchema,
            align: z.enum(["start", "center", "end", "stretch"]),
          })
          .strict(),
      ])
      .optional(),
    transform: z
      .object({
        x: z.number(),
        y: z.number(),
        scale: z.number().positive(),
        rotationDeg: z.number(),
        opacity: z.number().min(0).max(1),
      })
      .strict(),
    zIndex: z.number().int(),
    slot: IdSchema.optional(),
  })
  .strict()
  .superRefine((group, context) => {
    if (group.layout && group.layout.type !== "absolute" && !group.frame) {
      context.addIssue({
        code: "custom",
        message: "Stack and grid groups require a frame",
        path: ["frame"],
      });
    }
  });

export const LayerSchema = z.discriminatedUnion("type", [
  TextLayerSchema,
  ImageLayerSchema,
  ShapeLayerSchema,
  GroupLayerSchema,
]);

const TextVisualSchema = z
  .object({ type: z.literal("text"), text: z.string().min(1) })
  .strict();

const MediaVisualSchema = z
  .object({
    type: z.literal("media"),
    assetId: IdSchema,
    fit: z.enum(["cover", "contain"]),
  })
  .strict();

const CompositionVisualSchema = z
  .object({
    type: z.literal("composition"),
    layers: z.array(LayerSchema).min(1),
  })
  .strict();

export const SceneVisualSchema = z.discriminatedUnion("type", [
  TextVisualSchema,
  MediaVisualSchema,
  CompositionVisualSchema,
]);

const BeatBaseShape = {
  id: IdSchema,
  targetId: IdSchema,
  startMs: NonNegativeIntegerSchema,
  durationMs: PositiveIntegerSchema,
};

const EasingPresetSchema = z.enum(["linear", "smooth", "snappy"]);

const RevealBeatSchema = z
  .object({
    ...BeatBaseShape,
    action: z.literal("reveal"),
    params: z
      .object({
        direction: z.enum(["up", "down", "left", "right"]),
        distance: z.number().nonnegative(),
        easingPreset: EasingPresetSchema.optional(),
      })
      .strict(),
  })
  .strict();

const EmphasizeBeatSchema = z
  .object({
    ...BeatBaseShape,
    action: z.literal("emphasize"),
    params: z
      .object({
        scale: z.number().min(1).max(2),
        easingPreset: EasingPresetSchema.optional(),
      })
      .strict(),
  })
  .strict();

const FocusBeatSchema = z
  .object({
    ...BeatBaseShape,
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
  .strict();

export const BeatSchema = z.discriminatedUnion("action", [
  RevealBeatSchema,
  EmphasizeBeatSchema,
  FocusBeatSchema,
]);

const TransitionDurationSchema = z.number().int().min(200).max(1200);

/**
 * Declares how THIS scene exits into the next one. The first scene's value
 * has no predecessor to affect; the last scene's value has no successor to
 * carry it into, and the compiler reports that as a warning rather than
 * silently dropping it. `cut` remains the zero-effect default — every
 * primitive beyond it needs a bounded duration that must fit inside both
 * neighbouring scenes' own runtime (see TRANSITION_DURATION_EXCEEDS_SCENE).
 */
export const TransitionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cut") }).strict(),
  z
    .object({
      type: z.literal("push-through"),
      durationMs: TransitionDurationSchema,
      direction: z.enum(["up", "down", "left", "right"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("mask-reveal"),
      durationMs: TransitionDurationSchema,
      shape: z.enum(["circle", "rectangle"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("match-cut"),
      durationMs: TransitionDurationSchema,
      anchor: FocalPointSchema.optional(),
    })
    .strict(),
]);

export const SceneNarrationSchema = z
  .object({
    blockId: IdSchema,
    phraseId: IdSchema.optional(),
  })
  .strict();

export const SceneSchema = z
  .object({
    id: IdSchema,
    narrativeRole: IdSchema,
    durationMs: PositiveIntegerSchema,
    visual: SceneVisualSchema,
    beats: z.array(BeatSchema),
    transition: TransitionSchema,
    narration: SceneNarrationSchema.optional(),
    carriesFactualClaim: z.boolean().optional(),
    sourceIds: z.array(IdSchema).optional(),
    /** An editorial note. It is never rendered and never affects a render key. */
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export const ScenesSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    sources: z.array(SourceSchema).optional(),
    scenes: z.array(SceneSchema),
  })
  .strict()
  .superRefine((document, context) => {
    const sceneIds = new Set<string>();

    document.scenes.forEach((scene, sceneIndex) => {
      if (sceneIds.has(scene.id)) {
        context.addIssue({
          code: "custom",
          message: "Scene IDs must be unique",
          path: ["scenes", sceneIndex, "id"],
        });
      }
      sceneIds.add(scene.id);

      const layers =
        scene.visual.type === "composition" ? scene.visual.layers : [];
      const layersById = new Map<string, z.infer<typeof LayerSchema>>();
      layers.forEach((layer, layerIndex) => {
        if (layersById.has(layer.id)) {
          context.addIssue({
            code: "custom",
            message: "Layer IDs must be unique within a scene",
            path: ["scenes", sceneIndex, "visual", "layers", layerIndex, "id"],
          });
        }
        layersById.set(layer.id, layer);
      });

      layers.forEach((layer, layerIndex) => {
        if (layer.type !== "text" || !layer.avoidLayerIds) {
          return;
        }

        const avoided = new Set<string>();
        layer.avoidLayerIds.forEach((avoidId, avoidIndex) => {
          if (
            avoidId === layer.id ||
            !layersById.has(avoidId) ||
            avoided.has(avoidId)
          ) {
            context.addIssue({
              code: "custom",
              message:
                "Text avoid targets must be unique IDs of other layers in the same scene",
              path: [
                "scenes",
                sceneIndex,
                "visual",
                "layers",
                layerIndex,
                "avoidLayerIds",
                avoidIndex,
              ],
            });
          }
          avoided.add(avoidId);
        });
      });

      layers.forEach((layer, layerIndex) => {
        if (layer.type !== "group") {
          return;
        }

        const members = new Set<string>();
        layer.memberIds.forEach((memberId, memberIndex) => {
          const member = layersById.get(memberId);
          if (!member || member.type === "group" || members.has(memberId)) {
            context.addIssue({
              code: "custom",
              message:
                "Group members must be unique IDs of non-group layers in the same scene",
              path: [
                "scenes",
                sceneIndex,
                "visual",
                "layers",
                layerIndex,
                "memberIds",
                memberIndex,
              ],
            });
          }
          members.add(memberId);
        });
      });

      const memberOwners = new Map<string, string>();
      layers.forEach((layer, layerIndex) => {
        if (layer.type !== "group") {
          return;
        }

        layer.memberIds.forEach((memberId, memberIndex) => {
          const owner = memberOwners.get(memberId);
          if (owner) {
            context.addIssue({
              code: "custom",
              message: `Layer already belongs to group ${owner}`,
              path: [
                "scenes",
                sceneIndex,
                "visual",
                "layers",
                layerIndex,
                "memberIds",
                memberIndex,
              ],
            });
          } else {
            memberOwners.set(memberId, layer.id);
          }
        });
      });

      const beatIds = new Set<string>();
      scene.beats.forEach((beat, beatIndex) => {
        if (beatIds.has(beat.id)) {
          context.addIssue({
            code: "custom",
            message: "Beat IDs must be unique within a scene",
            path: ["scenes", sceneIndex, "beats", beatIndex, "id"],
          });
        }
        beatIds.add(beat.id);

        if (beat.targetId !== scene.id && !layersById.has(beat.targetId)) {
          context.addIssue({
            code: "custom",
            message:
              "Beat target must resolve to its scene or one of its layers",
            path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
          });
        }
      });
    });
  });

export type Frame = z.infer<typeof FrameSchema>;
export type Insets = z.infer<typeof InsetsSchema>;
export type FocalPoint = z.infer<typeof FocalPointSchema>;
export type Stroke = z.infer<typeof StrokeSchema>;
export type Shadow = z.infer<typeof ShadowSchema>;
export type TypographyRole = z.infer<typeof TypographyRoleSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type SceneVisual = z.infer<typeof SceneVisualSchema>;
export type SceneNarration = z.infer<typeof SceneNarrationSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Scenes = z.infer<typeof ScenesSchema>;
