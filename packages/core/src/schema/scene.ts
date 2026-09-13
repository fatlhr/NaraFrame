import { z } from "zod";
import {
  ColorSchema,
  IdSchema,
  NonNegativeIntegerSchema,
  PositiveIntegerSchema,
  SchemaVersionSchema,
} from "./primitives.js";

export const FrameSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

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
    ...LayerPresentationShape,
  })
  .strict();

const GroupLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("group"),
    memberIds: z.array(IdSchema).min(1),
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
  .strict();

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

export const SceneSchema = z
  .object({
    id: IdSchema,
    narrativeRole: IdSchema,
    durationMs: PositiveIntegerSchema,
    visual: SceneVisualSchema,
    beats: z.array(BeatSchema),
    transition: z.object({ type: z.literal("cut") }).strict(),
  })
  .strict();

export const ScenesSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
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
export type Layer = z.infer<typeof LayerSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type SceneVisual = z.infer<typeof SceneVisualSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Scenes = z.infer<typeof ScenesSchema>;
