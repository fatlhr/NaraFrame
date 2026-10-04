import { z } from "zod";
import {
  ColorSchema,
  ColorValueSchema,
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
  space: z.enum(["world", "overlay"]).optional(),
  parallax: z.number().min(0).max(2).optional(),
};

/**
 * A run inside a headline. `emphasis` is what the run means, not how it is
 * painted: the profile decides what an accented or quiet run looks like, so
 * the same source reads correctly under a different visual identity.
 */
const TextSpanSchema = z
  .object({
    text: z.string().min(1),
    emphasis: z.enum(["accent", "strong", "quiet"]).optional(),
  })
  .strict();

const TextLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("text"),
    text: z.string().min(1),
    /**
     * Optional typographic detail for the same string. When present its runs
     * must join back to `text`, so every measurement, caption and check that
     * reads `text` keeps working and a legacy layer needs no migration.
     */
    spans: z.array(TextSpanSchema).min(1).optional(),
    frame: FrameSchema,
    role: TypographyRoleSchema.optional(),
    fontSize: z.number().min(12).max(320).optional(),
    fontWeight: z.number().int().min(100).max(900).optional(),
    lineHeight: z.number().min(0.8).max(2).optional(),
    letterSpacing: z.number().min(-20).max(40).optional(),
    color: ColorValueSchema.optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    verticalAlign: z.enum(["top", "center", "bottom"]).optional(),
    padding: InsetsSchema.optional(),
    maxLines: z.number().int().min(1).max(20).optional(),
    overflowPolicy: z.enum(["error", "shrink"]).optional(),
    avoidLayerIds: z.array(IdSchema).max(20).optional(),
    /**
     * The profile value this text must show, such as the call to action. The
     * compiler checks it against the pinned profile; a switch never rewrites
     * it silently.
     */
    binding: z
      .enum(["brand.name", "brand.cta.label", "brand.cta.url"])
      .optional(),
    ...LayerPresentationShape,
  })
  .strict()
  .superRefine((layer, context) => {
    if (!layer.spans) return;
    const joined = layer.spans.map((span) => span.text).join("");
    if (joined !== layer.text) {
      context.addIssue({
        code: "custom",
        message: "Text spans must join back to the layer's text exactly",
        path: ["spans"],
      });
    }
  });

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
    fill: ColorValueSchema,
    frame: FrameSchema,
    cornerRadius: z.number().min(0).max(960).optional(),
    stroke: StrokeSchema.optional(),
    shadow: ShadowSchema.optional(),
    ...LayerPresentationShape,
  })
  .strict();

const PathViewBoxSchema = z
  .object({
    minX: z.number(),
    minY: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

/**
 * A line the scene can draw and move things along: a route, a river course,
 * a trend. `d` is SVG path data in `viewBox` units, and the viewBox is laid
 * onto `frame` without distortion (the compiler rejects a mismatched aspect
 * ratio), so stroke widths and dashes are in the same units as the path. It
 * is plain geometry, not markup: only path data is accepted.
 */
const PathLayerSchema = z
  .object({
    id: IdSchema,
    type: z.literal("path"),
    d: z
      .string()
      .trim()
      .min(1)
      .max(20000)
      .regex(
        /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]+$/u,
        "Path data may contain only SVG path commands and numbers",
      ),
    viewBox: PathViewBoxSchema,
    frame: FrameSchema,
    stroke: z
      .object({ color: ColorValueSchema, width: z.number().positive() })
      .strict(),
    fill: ColorValueSchema.optional(),
    dash: z.tuple([z.number().positive(), z.number().positive()]).optional(),
    lineCap: z.enum(["butt", "round", "square"]).optional(),
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
    space: z.enum(["world", "overlay"]).optional(),
    parallax: z.number().min(0).max(2).optional(),
    /**
     * Pins a world group to one world point without scaling it with the
     * camera: the point follows the camera, the group keeps its design size.
     * A map label stays readable while the map zooms under it. The point is
     * in the same design coordinates as the members' frames.
     */
    billboard: z.object({ x: z.number(), y: z.number() }).strict().optional(),
  })
  .strict()
  .superRefine((group, context) => {
    if (group.billboard && group.space !== "world") {
      context.addIssue({
        code: "custom",
        message: "A billboard pins a world group; set space to world",
        path: ["billboard"],
      });
    }
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
  PathLayerSchema,
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

/**
 * A scene drawn by a trusted local recipe (NF-AU-01). `params` is the
 * episode's JSON content for that recipe; any `assetId` inside refers to a
 * ready PNG and a sibling `crop` is a view onto it, never an edit of the file.
 */
const RecipeVisualSchema = z
  .object({
    type: z.literal("recipe"),
    recipe: IdSchema,
    params: z.record(z.string(), z.unknown()),
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
  RecipeVisualSchema,
]);

/**
 * Ties a motion to a measured phrase of the scene's narration block. When the
 * block has audio, the start is the phrase's measured start plus `offsetMs`,
 * relative to where the scene begins; `startMs` stays the local time used by
 * silent drafts. There is no word-level timing: a phrase is the finest
 * anchor the measured audio supports.
 */
export const PhraseAnchorSchema = z
  .object({
    phraseId: IdSchema,
    offsetMs: z.number().int().min(-10000).max(60000).optional(),
  })
  .strict();

const BeatBaseShape = {
  id: IdSchema,
  targetId: IdSchema,
  startMs: NonNegativeIntegerSchema,
  durationMs: PositiveIntegerSchema,
  at: PhraseAnchorSchema.optional(),
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

/**
 * Takes an element off screen. The mirror of `reveal`: opacity falls to zero
 * over the window and stays there, so a shot can finish a statement instead
 * of holding every element it ever introduced. Frame-derived like the rest,
 * so seeking straight to a late frame gives the same hidden pose as playing
 * to it.
 */
const ExitBeatSchema = z
  .object({
    ...BeatBaseShape,
    action: z.literal("exit"),
    params: z
      .object({
        direction: z.enum(["up", "down", "left", "right"]).optional(),
        distance: z.number().nonnegative().optional(),
        easingPreset: EasingPresetSchema.optional(),
      })
      .strict(),
  })
  .strict();

const TransformBeatSchema = z
  .object({
    ...BeatBaseShape,
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
          .strict()
          .refine(
            (value) => Object.values(value).some((item) => item !== undefined),
            "Transform must write at least one property",
          ),
        easingPreset: EasingPresetSchema.optional(),
      })
      .strict(),
  })
  .strict();

/**
 * Draws a path layer from one fraction of its length to another. Before its
 * first draw a path stands at that draw's starting fraction, so a route meant
 * to be drawn is not visible in full before it is drawn.
 */
const DrawBeatSchema = z
  .object({
    ...BeatBaseShape,
    action: z.literal("draw"),
    params: z
      .object({
        from: z.number().min(0).max(1).optional(),
        to: z.number().min(0).max(1).optional(),
        easingPreset: EasingPresetSchema.optional(),
      })
      .strict(),
  })
  .strict();

/**
 * Moves a layer's centre along a path layer in the same plane. When it is the
 * first beat to move the layer, the layer waits at the path's starting point
 * before the window, so a follower never jumps onto its route.
 */
const FollowBeatSchema = z
  .object({
    ...BeatBaseShape,
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
  .strict();

/**
 * Counts a number in a text layer. The layer's `text` must be the settled
 * value exactly as formatted, so measurement, captions and every static check
 * read what the viewer ends on.
 */
const CountBeatSchema = z
  .object({
    ...BeatBaseShape,
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
  .strict();

export const BeatSchema = z.discriminatedUnion("action", [
  ExitBeatSchema,
  RevealBeatSchema,
  EmphasizeBeatSchema,
  FocusBeatSchema,
  TransformBeatSchema,
  DrawBeatSchema,
  FollowBeatSchema,
  CountBeatSchema,
]);

const CameraPoseSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().positive().min(0.25).max(4),
  })
  .strict();

export const CameraSchema = z
  .object({
    initial: CameraPoseSchema,
    moves: z.array(
      z
        .object({
          id: IdSchema,
          startMs: NonNegativeIntegerSchema,
          durationMs: PositiveIntegerSchema,
          to: CameraPoseSchema,
          easingPreset: EasingPresetSchema.optional(),
          at: PhraseAnchorSchema.optional(),
        })
        .strict(),
    ),
  })
  .strict();

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
    camera: CameraSchema.optional(),
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
      if (scene.camera && scene.visual.type !== "composition") {
        context.addIssue({
          code: "custom",
          message: "Explicit camera requires a composition visual",
          path: ["scenes", sceneIndex, "camera"],
        });
      }

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
        if (beat.action === "transform" && beat.targetId === scene.id) {
          context.addIssue({
            code: "custom",
            message:
              "Transform beats target a layer or group; use camera for world framing",
            path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
          });
        }

        if (beat.targetId !== scene.id && !layersById.has(beat.targetId)) {
          context.addIssue({
            code: "custom",
            message:
              "Beat target must resolve to its scene or one of its layers",
            path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
          });
        }

        const target = layersById.get(beat.targetId);
        const grouped = (id: string) =>
          layers.some(
            (layer) => layer.type === "group" && layer.memberIds.includes(id),
          );
        if (beat.action === "draw" && target?.type !== "path") {
          context.addIssue({
            code: "custom",
            message: "A draw beat targets a path layer",
            path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
          });
        }
        if (beat.action === "count") {
          if (target?.type !== "text" || target.spans) {
            context.addIssue({
              code: "custom",
              message: "A count beat targets a text layer without spans",
              path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
            });
          }
        }
        if (beat.action === "follow") {
          const path = layersById.get(beat.params.pathId);
          if (
            !target ||
            target.type === "group" ||
            target.type === "path" ||
            grouped(target.id)
          ) {
            context.addIssue({
              code: "custom",
              message:
                "A follow beat moves an ungrouped text, image or shape layer",
              path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
            });
          }
          if (path?.type !== "path" || grouped(path.id)) {
            context.addIssue({
              code: "custom",
              message: "A follow beat's pathId names an ungrouped path layer",
              path: [
                "scenes",
                sceneIndex,
                "beats",
                beatIndex,
                "params",
                "pathId",
              ],
            });
          } else if (
            target &&
            target.type !== "group" &&
            ((target.space === "world") !== (path.space === "world") ||
              (path.space === "world" &&
                (target.parallax ?? 1) !== (path.parallax ?? 1)))
          ) {
            context.addIssue({
              code: "custom",
              message:
                "A follower and its path must share one plane: the same space and parallax",
              path: ["scenes", sceneIndex, "beats", beatIndex, "targetId"],
            });
          }
        }
      });

      const cameraMoveIds = new Set<string>();
      scene.camera?.moves.forEach((move, moveIndex) => {
        if (cameraMoveIds.has(move.id)) {
          context.addIssue({
            code: "custom",
            message: "Camera move IDs must be unique within a scene",
            path: ["scenes", sceneIndex, "camera", "moves", moveIndex, "id"],
          });
        }
        cameraMoveIds.add(move.id);
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
