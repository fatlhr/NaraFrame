import { formatCount } from "../count-format.js";
import { type Issue, type Result, sortIssues } from "../model/issue.js";
import { checkBrandBindings } from "../profile/brand-bindings.js";
import { hashValue } from "../project/hash.js";
import { compileTextSlots, textFitCoverage } from "../recipe/text-slots.js";
import type { CompiledAsset, CompiledDraft } from "../schema/compiled.js";
import { CompiledDraftSchema } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { RenderTokens } from "../schema/profile.js";
import type {
  Beat,
  Frame,
  Insets,
  Layer,
  Scene,
  Transition,
} from "../schema/scene.js";
import { deriveCaptionCues } from "./captions.js";
import { checkContrast } from "./contrast.js";
import { computeAssemblyKey } from "./keys.js";
import { resolveNarrationTimeline } from "./narration-timeline.js";
import { checkSourceProvenance } from "./provenance.js";
import {
  partitionScenes,
  type SceneNarrationRef,
  sceneLocalRange,
} from "./scene-partition.js";
import {
  captionStyleFor,
  compileSceneNarration,
  type ScopedNarration,
} from "./scoped-narration.js";
import { compileSoundtrack } from "./soundtrack.js";
import { checkVariety, type VarietyScene } from "./variety.js";
import { checkVoiceBindings } from "./voice-binding.js";

export type DraftScope =
  | { type: "project" }
  | { type: "scene"; sceneId: string };

const msToFrameOffset = (milliseconds: number, fps: number): number =>
  Math.round((milliseconds / 1000) * fps);

const msToDurationFrames = (milliseconds: number, fps: number): number =>
  Math.max(1, msToFrameOffset(milliseconds, fps));

const compileIssue = (
  code: string,
  path: string,
  message: string,
  severity: Issue["severity"] = "error",
  suggestion = "Correct the reported scene value and compile again.",
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact: "scenes.json",
  path,
  message,
  suggestion,
});

type CompiledRecipeVisual = Extract<
  CompiledDraft["scenes"][number]["visual"],
  { type: "recipe" }
>;

/**
 * A recipe scene's compiled form: the trusted code's identity and the PNGs
 * its params reference, each checked to exist, be ready, and contain any
 * crop drawn from it. Recipe scenes draw their own motion, so declarative
 * beats and camera moves are refused there.
 */
const compileRecipeVisual = (
  source: PlanSource,
  scene: PlanSource["scenes"]["scenes"][number],
  sceneIndex: number,
  issues: Issue[],
): CompiledRecipeVisual | null => {
  if (scene.visual.type !== "recipe") return null;
  const at = `/scenes/${sceneIndex}/visual`;
  const fail = (path: string, message: string, suggestion: string) =>
    issues.push(
      compileIssue("RECIPE_PARAM_INVALID", path, message, "error", suggestion),
    );
  const recipeId = scene.visual.recipe;
  const recipe = source.recipes?.find((candidate) => candidate.id === recipeId);
  if (!recipe) {
    issues.push(
      compileIssue(
        "RECIPE_UNKNOWN",
        `${at}/recipe`,
        `Scene ${scene.id} uses recipe ${scene.visual.recipe}, which naraframe.json does not declare.`,
        "error",
        "Declare the recipe under recipes in naraframe.json, or use a declared one.",
      ),
    );
    return null;
  }
  if (scene.beats.length > 0 || scene.camera) {
    fail(
      `/scenes/${sceneIndex}/beats`,
      `Scene ${scene.id} is drawn by recipe ${recipe.id}, which owns its motion; declarative beats and camera moves do not apply.`,
      "Remove beats and camera from this scene and express motion through the recipe's parameters.",
    );
  }
  const assets: CompiledRecipeVisual["assets"] = {};
  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${path}/${index}`);
      });
      return;
    }
    if (value === null || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const assetId = record.assetId;
    if (typeof assetId === "string") {
      const asset = source.assets.assets.find((item) => item.id === assetId);
      const size = source.imageSizes?.[assetId];
      if (asset?.status !== "ready" || asset.kind !== "png" || !size) {
        fail(
          `${path}/assetId`,
          `Recipe parameter asset ${assetId} must be a ready PNG in the asset manifest.`,
          "Reference a ready PNG asset, or add and mark it ready first.",
        );
      } else {
        assets[assetId] = {
          publicPath: asset.path,
          width: size.width,
          height: size.height,
        };
        if ("crop" in record) {
          const crop = record.crop;
          const shaped =
            crop !== null &&
            typeof crop === "object" &&
            !Array.isArray(crop) &&
            ["x", "y", "width", "height"].every((key) => {
              const value = (crop as Record<string, unknown>)[key];
              return typeof value === "number" && Number.isFinite(value);
            });
          const rect = shaped
            ? (crop as { x: number; y: number; width: number; height: number })
            : null;
          if (
            !rect ||
            rect.width <= 0 ||
            rect.height <= 0 ||
            rect.x < 0 ||
            rect.y < 0 ||
            rect.x + rect.width > size.width ||
            rect.y + rect.height > size.height
          ) {
            fail(
              `${path}/crop`,
              rect
                ? `Crop on asset ${assetId} must be a rectangle inside its ${size.width}×${size.height} pixels.`
                : `Crop on asset ${assetId} must be an object with numeric x, y, width and height.`,
              "Use x, y, width and height in source pixels that stay within the image; the file itself is never edited.",
            );
          }
        }
      }
    }
    for (const [key, nested] of Object.entries(record)) {
      if (key !== "assetId") walk(nested, `${path}/${key}`);
    }
  };
  walk(scene.visual.params, `${at}/params`);
  const textSlots = compileTextSlots(
    recipe,
    scene.id,
    sceneIndex,
    scene.visual.params,
    source.profile.render,
    issues,
  );
  issues.push(textFitCoverage(recipe, scene.id, sceneIndex, textSlots));
  return {
    type: "recipe",
    recipe: recipe.id,
    executor: "naraframe-recipe/2",
    version: recipe.version,
    codeSha256: recipe.codeSha256,
    params: scene.visual.params,
    assets,
    // Only when declared: recipes without slots keep their compiled form.
    ...(textSlots
      ? { textSlots, textFitRules: "naraframe-text-fit/2" as const }
      : {}),
  };
};

const compiledAssets = (source: PlanSource): Record<string, CompiledAsset> =>
  Object.fromEntries(
    source.assets.assets.flatMap((asset): Array<[string, CompiledAsset]> => {
      if (asset.status !== "ready") {
        return [
          [
            asset.id,
            {
              kind: "placeholder" as const,
              assetId: asset.id,
              label: asset.purpose,
            },
          ],
        ];
      }
      if (asset.kind === "png") {
        return [
          [
            asset.id,
            {
              kind: "png" as const,
              publicPath: asset.path,
              sha256: asset.sha256,
            },
          ],
        ];
      }
      if (asset.kind === "svg") {
        const vector = source.vectors?.[asset.id];
        // An unresolved vector is reported by compileDraft; leaving it out
        // here keeps the compiled draft free of unchecked markup.
        return vector
          ? [
              [
                asset.id,
                {
                  kind: "svg" as const,
                  publicPath: asset.path,
                  sha256: asset.sha256,
                  body: vector.body,
                  viewBox: vector.viewBox,
                },
              ],
            ]
          : [];
      }
      return [
        [
          asset.id,
          {
            kind: asset.kind,
            publicPath: asset.path,
            sha256: asset.sha256,
          },
        ],
      ];
    }),
  );

/**
 * Profile font assets are already copied, hashed, and locked into
 * profile.lock.json by `createProject` (kind-agnostic since M0.3); this is
 * the first place that actually exposes them to the renderer.
 */
const compiledFonts = (source: PlanSource): CompiledDraft["fonts"] =>
  source.profile.assets
    .filter((asset) => asset.kind === "font")
    .map((asset) => ({
      family: asset.family ?? asset.id,
      weight: asset.weight ?? source.profile.render.typography.headingWeight,
      publicPath: asset.path,
      sha256: asset.sha256,
    }));

const scaleFrame = (frame: Frame, scaleX: number, scaleY: number): Frame => ({
  x: frame.x * scaleX,
  y: frame.y * scaleY,
  width: frame.width * scaleX,
  height: frame.height * scaleY,
});

const scaleInsets = (
  insets: Insets,
  scaleX: number,
  scaleY: number,
): Insets => ({
  top: insets.top * scaleY,
  right: insets.right * scaleX,
  bottom: insets.bottom * scaleY,
  left: insets.left * scaleX,
});

const scaleShadow = (
  shadow: NonNullable<Extract<Layer, { type: "shape" }>["shadow"]>,
  scaleX: number,
  scaleY: number,
) => ({
  ...shadow,
  offsetX: shadow.offsetX * scaleX,
  offsetY: shadow.offsetY * scaleY,
  blur: shadow.blur * Math.min(scaleX, scaleY),
});

const scaleLayer = (layer: Layer, scaleX: number, scaleY: number): Layer => {
  if (layer.type === "group") {
    return {
      ...layer,
      ...(layer.frame
        ? { frame: scaleFrame(layer.frame, scaleX, scaleY) }
        : {}),
      ...(layer.layout && layer.layout.type !== "absolute"
        ? {
            layout:
              layer.layout.type === "stack"
                ? {
                    ...layer.layout,
                    gap:
                      layer.layout.gap *
                      (layer.layout.direction === "horizontal"
                        ? scaleX
                        : scaleY),
                    padding: scaleInsets(layer.layout.padding, scaleX, scaleY),
                  }
                : {
                    ...layer.layout,
                    columnGap: layer.layout.columnGap * scaleX,
                    rowGap: layer.layout.rowGap * scaleY,
                    padding: scaleInsets(layer.layout.padding, scaleX, scaleY),
                  },
          }
        : {}),
      transform: {
        ...layer.transform,
        x: layer.transform.x * scaleX,
        y: layer.transform.y * scaleY,
      },
      ...(layer.billboard
        ? {
            billboard: {
              x: layer.billboard.x * scaleX,
              y: layer.billboard.y * scaleY,
            },
          }
        : {}),
    };
  }

  if (layer.type === "text") {
    return {
      ...layer,
      frame: scaleFrame(layer.frame, scaleX, scaleY),
      ...(layer.fontSize ? { fontSize: layer.fontSize * scaleY } : {}),
      ...(layer.letterSpacing !== undefined
        ? { letterSpacing: layer.letterSpacing * scaleX }
        : {}),
      ...(layer.padding
        ? { padding: scaleInsets(layer.padding, scaleX, scaleY) }
        : {}),
    };
  }

  if (layer.type === "path") {
    // Stroke width and dashes are viewBox units; the viewBox is laid onto the
    // scaled frame, so they scale with it and need no conversion here.
    return { ...layer, frame: scaleFrame(layer.frame, scaleX, scaleY) };
  }

  return {
    ...layer,
    frame: scaleFrame(layer.frame, scaleX, scaleY),
    ...(layer.cornerRadius !== undefined
      ? { cornerRadius: layer.cornerRadius * Math.min(scaleX, scaleY) }
      : {}),
    ...(layer.stroke
      ? {
          stroke: {
            ...layer.stroke,
            width: layer.stroke.width * Math.min(scaleX, scaleY),
          },
        }
      : {}),
    ...(layer.shadow
      ? { shadow: scaleShadow(layer.shadow, scaleX, scaleY) }
      : {}),
  };
};

const zeroInsets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Turns a `palette.*` reference into the profile's own colour. */
const resolveColor = (
  value: string | undefined,
  render: RenderTokens,
): string | undefined => {
  if (value === undefined) return undefined;
  if (!value.startsWith("palette.")) return value;
  const slot = value.slice("palette.".length) as keyof RenderTokens["palette"];
  return render.palette[slot] ?? value;
};

const resolveLayerAppearance = (layer: Layer, render: RenderTokens): Layer => {
  if (layer.type === "text") {
    const role = layer.role ?? "heading";
    const roleDefaults = render.typography.roles?.[role];
    // Schema-v1 profiles created before typography roles rendered every layer
    // at 34px in draft space (68px in the 1080x1920 design space).
    const legacyFontSize = 68;
    const legacyLineHeight = 1.15;
    return {
      ...layer,
      role,
      fontSize: layer.fontSize ?? roleDefaults?.fontSize ?? legacyFontSize,
      fontWeight:
        layer.fontWeight ??
        roleDefaults?.fontWeight ??
        (role === "body"
          ? render.typography.bodyWeight
          : render.typography.headingWeight),
      lineHeight:
        layer.lineHeight ?? roleDefaults?.lineHeight ?? legacyLineHeight,
      letterSpacing: layer.letterSpacing ?? roleDefaults?.letterSpacing ?? 0,
      color: resolveColor(layer.color, render) ?? render.palette.text,
      textAlign: layer.textAlign ?? "left",
      verticalAlign: layer.verticalAlign ?? "center",
      padding: layer.padding ?? zeroInsets,
      maxLines: layer.maxLines ?? 20,
      overflowPolicy:
        layer.overflowPolicy ?? (render.typography.roles ? "error" : "shrink"),
    };
  }

  if (layer.type === "image") {
    return {
      ...layer,
      focalPoint: layer.focalPoint ?? { x: 0.5, y: 0.5 },
      cornerRadius:
        layer.cornerRadius ?? render.appearance?.media.cornerRadius ?? 0,
    };
  }

  if (layer.type === "shape") {
    return {
      ...layer,
      fill: resolveColor(layer.fill, render) ?? layer.fill,
      cornerRadius:
        layer.shape === "circle"
          ? Math.min(layer.frame.width, layer.frame.height) / 2
          : (layer.cornerRadius ?? render.appearance?.radius.medium ?? 44),
    };
  }

  if (layer.type === "path") {
    return {
      ...layer,
      stroke: {
        ...layer.stroke,
        color: resolveColor(layer.stroke.color, render) ?? layer.stroke.color,
      },
      ...(layer.fill ? { fill: resolveColor(layer.fill, render) } : {}),
    };
  }

  return { ...layer, layout: layer.layout ?? { type: "absolute" } };
};

const alignedOffset = (
  available: number,
  size: number,
  align: "start" | "center" | "end" | "stretch",
): number => {
  if (align === "center") return (available - size) / 2;
  if (align === "end") return available - size;
  return 0;
};

const resolveGroupLayouts = (
  layers: Layer[],
  sceneIndex: number,
): { layers: Layer[]; issues: Issue[] } => {
  const resolved = layers.map((layer) => structuredClone(layer));
  const byId = new Map(resolved.map((layer) => [layer.id, layer]));
  const issues: Issue[] = [];

  for (const group of resolved) {
    if (
      group.type !== "group" ||
      !group.frame ||
      !group.layout ||
      group.layout.type === "absolute"
    ) {
      continue;
    }
    const layout = group.layout;
    const members = group.memberIds.flatMap((id) => {
      const member = byId.get(id);
      return member && member.type !== "group" ? [member] : [];
    });
    const { padding } = layout;
    const inner = {
      x: group.frame.x + padding.left,
      y: group.frame.y + padding.top,
      width: group.frame.width - padding.left - padding.right,
      height: group.frame.height - padding.top - padding.bottom,
    };
    if (inner.width <= 0 || inner.height <= 0) {
      issues.push(
        compileIssue(
          "GROUP_LAYOUT_INVALID",
          `/scenes/${sceneIndex}/visual/layers/${layers.findIndex((layer) => layer.id === group.id)}/layout/padding`,
          `Group ${group.id} padding leaves no usable layout area.`,
        ),
      );
      continue;
    }

    if (layout.type === "stack") {
      const horizontal = layout.direction === "horizontal";
      const availableMain = horizontal ? inner.width : inner.height;
      const usedMain =
        members.reduce(
          (total, member) =>
            total + (horizontal ? member.frame.width : member.frame.height),
          0,
        ) +
        Math.max(0, members.length - 1) * layout.gap;
      if (usedMain > availableMain) {
        issues.push(
          compileIssue(
            "GROUP_LAYOUT_OVERFLOW",
            `/scenes/${sceneIndex}/visual/layers/${layers.findIndex((layer) => layer.id === group.id)}/frame`,
            `Group ${group.id} stack needs ${usedMain}px but only ${availableMain}px is available.`,
          ),
        );
        continue;
      }
      let cursor = horizontal ? inner.x : inner.y;
      for (const member of members) {
        const crossAvailable = horizontal ? inner.height : inner.width;
        const crossSize = horizontal ? member.frame.height : member.frame.width;
        const crossOffset = alignedOffset(
          crossAvailable,
          crossSize,
          layout.align,
        );
        member.frame = horizontal
          ? {
              x: cursor,
              y: inner.y + crossOffset,
              width: member.frame.width,
              height:
                layout.align === "stretch" ? inner.height : member.frame.height,
            }
          : {
              x: inner.x + crossOffset,
              y: cursor,
              width:
                layout.align === "stretch" ? inner.width : member.frame.width,
              height: member.frame.height,
            };
        cursor +=
          (horizontal ? member.frame.width : member.frame.height) + layout.gap;
      }
      continue;
    }

    const rows = Math.ceil(members.length / layout.columns);
    const cellWidth =
      (inner.width - Math.max(0, layout.columns - 1) * layout.columnGap) /
      layout.columns;
    const cellHeight =
      (inner.height - Math.max(0, rows - 1) * layout.rowGap) /
      Math.max(1, rows);
    if (cellWidth <= 0 || cellHeight <= 0) {
      issues.push(
        compileIssue(
          "GROUP_LAYOUT_OVERFLOW",
          `/scenes/${sceneIndex}/visual/layers/${layers.findIndex((layer) => layer.id === group.id)}/frame`,
          `Group ${group.id} grid gaps leave no usable cell area.`,
        ),
      );
      continue;
    }
    members.forEach((member, index) => {
      const column = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      const width =
        layout.align === "stretch"
          ? cellWidth
          : Math.min(member.frame.width, cellWidth);
      const height =
        layout.align === "stretch"
          ? cellHeight
          : Math.min(member.frame.height, cellHeight);
      member.frame = {
        x:
          inner.x +
          column * (cellWidth + layout.columnGap) +
          alignedOffset(cellWidth, width, layout.align),
        y:
          inner.y +
          row * (cellHeight + layout.rowGap) +
          alignedOffset(cellHeight, height, layout.align),
        width,
        height,
      };
    });
  }

  return { layers: resolved, issues };
};

const scaleBeat = (
  beat: Beat,
  startFrame: number,
  durationInFrames: number,
  scaleX: number,
  scaleY: number,
): CompiledDraft["scenes"][number]["beats"][number] => {
  const common = {
    id: beat.id,
    targetId: beat.targetId,
    startFrame,
    durationInFrames,
  };

  if (beat.action === "reveal") {
    const distanceScale =
      beat.params.direction === "left" || beat.params.direction === "right"
        ? scaleX
        : scaleY;
    return {
      ...common,
      action: beat.action,
      params: {
        ...beat.params,
        distance: beat.params.distance * distanceScale,
      },
    };
  }

  if (beat.action === "exit") {
    // Its drift is a design-space distance, scaled like a reveal's.
    const distanceScale =
      beat.params.direction === "left" || beat.params.direction === "right"
        ? scaleX
        : scaleY;
    return {
      ...common,
      action: beat.action,
      params: {
        ...beat.params,
        ...(beat.params.distance === undefined
          ? {}
          : { distance: beat.params.distance * distanceScale }),
      },
    };
  }

  if (beat.action === "emphasize") {
    return { ...common, action: beat.action, params: beat.params };
  }

  if (beat.action === "transform") {
    return {
      ...common,
      action: beat.action,
      params: {
        ...beat.params,
        to: {
          ...beat.params.to,
          ...(beat.params.to.x !== undefined
            ? { x: beat.params.to.x * scaleX }
            : {}),
          ...(beat.params.to.y !== undefined
            ? { y: beat.params.to.y * scaleY }
            : {}),
        },
      },
    };
  }

  // Draw and follow fractions and counted values carry no geometry.
  if (beat.action === "draw") {
    return { ...common, action: beat.action, params: beat.params };
  }
  if (beat.action === "follow") {
    return { ...common, action: beat.action, params: beat.params };
  }
  if (beat.action === "count") {
    return { ...common, action: beat.action, params: beat.params };
  }

  return { ...common, action: beat.action, params: beat.params };
};

/** Duration-in-ms → duration-in-frames only; transitions have no x/y geometry. */
const compileTransition = (
  transition: Transition,
  fps: number,
): CompiledDraft["scenes"][number]["transitionOut"] => {
  if (transition.type === "cut") return { type: "cut" };
  const { durationMs, ...rest } = transition;
  return { ...rest, durationInFrames: msToDurationFrames(durationMs, fps) };
};

const scaleRenderTokens = (
  render: RenderTokens,
  scaleX: number,
  scaleY: number,
): RenderTokens => ({
  ...render,
  safeZone: {
    top: Math.round(render.safeZone.top * scaleY),
    right: Math.round(render.safeZone.right * scaleX),
    bottom: Math.round(render.safeZone.bottom * scaleY),
    left: Math.round(render.safeZone.left * scaleX),
  },
  spacingUnit: Math.max(1, Math.round(render.spacingUnit * scaleX)),
  typography: {
    ...render.typography,
    ...(render.typography.minimumFontSize !== undefined
      ? { minimumFontSize: render.typography.minimumFontSize * scaleY }
      : {}),
    ...(render.typography.roles
      ? {
          roles: Object.fromEntries(
            Object.entries(render.typography.roles).map(([role, token]) => [
              role,
              {
                ...token,
                fontSize: token.fontSize * scaleY,
                letterSpacing: token.letterSpacing * scaleX,
              },
            ]),
          ) as NonNullable<RenderTokens["typography"]["roles"]>,
        }
      : {}),
  },
  ...(render.appearance
    ? {
        appearance: {
          radius: {
            small: render.appearance.radius.small * Math.min(scaleX, scaleY),
            medium: render.appearance.radius.medium * Math.min(scaleX, scaleY),
            large: render.appearance.radius.large * Math.min(scaleX, scaleY),
          },
          stroke: {
            ...render.appearance.stroke,
            width: render.appearance.stroke.width * Math.min(scaleX, scaleY),
          },
          shadow: scaleShadow(render.appearance.shadow, scaleX, scaleY),
          media: {
            ...render.appearance.media,
            cornerRadius:
              render.appearance.media.cornerRadius * Math.min(scaleX, scaleY),
          },
        },
      }
    : {}),
});

const validateLayerFrames = (
  scene: Scene,
  sceneIndex: number,
  source: PlanSource,
): Issue[] => {
  if (scene.visual.type !== "composition") {
    return [];
  }

  const issues: Issue[] = [];
  const { width, height } = source.project.format.design;
  const safeZone = source.profile.render.safeZone;
  const worldMemberIds = new Set(
    scene.visual.layers.flatMap((layer) =>
      layer.type === "group" && layer.space === "world" ? layer.memberIds : [],
    ),
  );

  scene.visual.layers.forEach((layer, layerIndex) => {
    const framePath = `/scenes/${sceneIndex}/visual/layers/${layerIndex}/frame`;
    const frame = layer.frame;
    if (!frame) return;
    const right = frame.x + frame.width;
    const bottom = frame.y + frame.height;
    const inWorld = layer.space === "world" || worldMemberIds.has(layer.id);
    // World scenery may extend past the canvas. World text may too when a
    // camera frames the scene: its screen position is the camera's, and the
    // renderer's preflight checks required text on screen frame by frame.
    const cameraFramed = inWorld && scene.camera !== undefined;
    const isWorldScenery = inWorld && (layer.type !== "text" || cameraFramed);
    if (
      !isWorldScenery &&
      (frame.x < 0 || frame.y < 0 || right > width || bottom > height)
    ) {
      issues.push(
        compileIssue(
          "LAYER_OUTSIDE_CANVAS",
          framePath,
          `Layer ${layer.id} extends outside the ${width}x${height} design canvas.`,
          "error",
          "Move or resize the layer so its static frame stays inside the design canvas.",
        ),
      );
    }

    if (
      layer.type === "text" &&
      !cameraFramed &&
      (frame.x < safeZone.left ||
        frame.y < safeZone.top ||
        right > width - safeZone.right ||
        bottom > height - safeZone.bottom)
    ) {
      issues.push(
        compileIssue(
          "TEXT_OUTSIDE_SAFE_ZONE",
          framePath,
          `Text layer ${layer.id} extends outside the active profile safe zone.`,
          "warning",
          "Move or resize critical text inside the profile safe zone.",
        ),
      );
    }
  });

  return issues;
};

type MotionProperty =
  | "opacity"
  | "x"
  | "y"
  | "scale"
  | "rotationDeg"
  | "draw"
  | "text";

const beatProperties = (beat: Beat): MotionProperty[] => {
  if (beat.action === "draw") return ["draw"];
  if (beat.action === "count") return ["text"];
  if (beat.action === "follow") {
    return beat.params.orient ? ["x", "y", "rotationDeg"] : ["x", "y"];
  }
  if (beat.action === "reveal") {
    // Like an exit, a reveal writes an axis only when it travels.
    if (!beat.params.distance) return ["opacity"];
    return [
      "opacity",
      beat.params.direction === "left" || beat.params.direction === "right"
        ? "x"
        : "y",
    ];
  }
  if (beat.action === "exit") {
    // An exit always writes opacity, and writes an axis only when it drifts.
    const direction = beat.params.direction;
    if (!direction || !beat.params.distance) return ["opacity"];
    return [
      "opacity",
      direction === "left" || direction === "right" ? "x" : "y",
    ];
  }
  if (beat.action === "emphasize") return ["scale"];
  if (beat.action === "focus") {
    if (beat.params.camera === "pan") return ["x"];
    if (beat.params.camera === "push") return ["y", "scale"];
    return ["scale"];
  }
  return Object.keys(beat.params.to) as MotionProperty[];
};

/** Where each beat and camera move starts, after phrase anchors resolve. */
interface ResolvedStarts {
  beats: number[];
  moves: number[];
}

/**
 * Resolves phrase-anchored beats and camera moves against the scene's own
 * measured narration. Without audio for the scene's block (a silent draft, or
 * a block still planned) every motion keeps its authored `startMs`.
 */
const resolveAnchoredStarts = (
  source: PlanSource,
  scene: Scene,
  sceneIndex: number,
): ResolvedStarts & { issues: Issue[] } => {
  const issues: Issue[] = [];
  const authored: ResolvedStarts = {
    beats: scene.beats.map((beat) => beat.startMs),
    moves: scene.camera?.moves.map((move) => move.startMs) ?? [],
  };
  const anchored =
    scene.beats.some((beat) => beat.at) ||
    (scene.camera?.moves.some((move) => move.at) ?? false);
  if (!anchored || !source.narration || !scene.narration) {
    return { ...authored, issues };
  }
  const refs: SceneNarrationRef[] = source.scenes.scenes.flatMap((candidate) =>
    candidate.narration
      ? [
          {
            sceneId: candidate.id,
            blockId: candidate.narration.blockId,
            ...(candidate.narration.phraseId
              ? { phraseId: candidate.narration.phraseId }
              : {}),
          },
        ]
      : [],
  );
  const range = sceneLocalRange(source.narration, refs, scene.id);
  if (!range.ok) return { ...authored, issues };
  const block = source.narration.blocks.find(
    (candidate) => candidate.id === range.value.blockId,
  );
  const phrases = block && "phrases" in block ? block.phrases : [];
  const resolve = (
    at: { phraseId: string; offsetMs?: number | undefined } | undefined,
    startMs: number,
    path: string,
    label: string,
  ): number => {
    if (!at) return startMs;
    const phrase = phrases.find((candidate) => candidate.id === at.phraseId);
    if (!phrase) {
      issues.push(
        compileIssue(
          "BEAT_PHRASE_UNKNOWN",
          `${path}/at/phraseId`,
          `${label} is anchored to phrase ${at.phraseId}, which block ${range.value.blockId} does not have.`,
          "error",
          "Anchor it to a measured phrase of the scene's own block.",
        ),
      );
      return startMs;
    }
    const resolved =
      phrase.startMs + (at.offsetMs ?? 0) - range.value.localStartMs;
    if (
      phrase.startMs < range.value.localStartMs ||
      phrase.startMs >= range.value.localEndMs ||
      resolved < 0
    ) {
      issues.push(
        compileIssue(
          "BEAT_PHRASE_OUTSIDE_SCENE",
          `${path}/at`,
          `${label} is anchored to phrase ${at.phraseId}, which does not start a moment inside scene ${scene.id}.`,
          "error",
          "Anchor it to a phrase the scene covers, or change the offset.",
        ),
      );
      return startMs;
    }
    return resolved;
  };
  return {
    beats: scene.beats.map((beat, beatIndex) =>
      resolve(
        beat.at,
        beat.startMs,
        `/scenes/${sceneIndex}/beats/${beatIndex}`,
        `Beat ${beat.id}`,
      ),
    ),
    moves:
      scene.camera?.moves.map((move, moveIndex) =>
        resolve(
          move.at,
          move.startMs,
          `/scenes/${sceneIndex}/camera/moves/${moveIndex}`,
          `Camera move ${move.id}`,
        ),
      ) ?? [],
    issues,
  };
};

/**
 * Static checks a draw, follow or count beat needs beyond its schema: a path
 * laid onto its frame without distortion, a followed path that does not move
 * away from its follower, and a counted layer whose text is the settled value.
 * Settling is judged in the order the renderer plays the beats, after phrase
 * anchors resolve, so a retimed count cannot leave stale text behind.
 */
const validatePathsAndCounts = (
  scene: Scene,
  sceneIndex: number,
  fps: number,
  starts: ResolvedStarts,
): Issue[] => {
  if (scene.visual.type !== "composition") return [];
  const issues: Issue[] = [];
  const layers = scene.visual.layers;
  layers.forEach((layer, layerIndex) => {
    if (layer.type !== "path") return;
    const scaleX = layer.frame.width / layer.viewBox.width;
    const scaleY = layer.frame.height / layer.viewBox.height;
    if (Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY) > 0.01) {
      issues.push(
        compileIssue(
          "PATH_VIEWBOX_ASPECT",
          `/scenes/${sceneIndex}/visual/layers/${layerIndex}/frame`,
          `Path ${layer.id}'s frame and viewBox have different aspect ratios, so its stroke would be distorted.`,
          "error",
          "Give the frame the viewBox's aspect ratio.",
        ),
      );
    }
  });
  const counts = scene.beats
    .map((beat, beatIndex) => ({ beat, beatIndex }))
    .filter(
      (
        entry,
      ): entry is {
        beat: Extract<Beat, { action: "count" }>;
        beatIndex: number;
      } => entry.beat.action === "count",
    );
  // The renderer plays counts by start frame, a tie going to the later beat.
  const startFrameOf = (beatIndex: number): number =>
    msToFrameOffset(
      starts.beats[beatIndex] ?? scene.beats[beatIndex]?.startMs ?? 0,
      fps,
    );
  const lastCount = new Map<string, (typeof counts)[number]>();
  for (const entry of counts) {
    const previous = lastCount.get(entry.beat.targetId);
    if (
      !previous ||
      startFrameOf(previous.beatIndex) <= startFrameOf(entry.beatIndex)
    ) {
      lastCount.set(entry.beat.targetId, entry);
    }
  }
  for (const { beat, beatIndex } of lastCount.values()) {
    const layer = layers.find((candidate) => candidate.id === beat.targetId);
    if (layer?.type !== "text") continue;
    const settled = formatCount(beat.params.to, beat.params);
    if (layer.text !== settled) {
      issues.push(
        compileIssue(
          "COUNT_TEXT_MISMATCH",
          `/scenes/${sceneIndex}/beats/${beatIndex}/params/to`,
          `Text layer ${layer.id} reads "${layer.text}" but its count settles on "${settled}".`,
          "error",
          "Set the layer's text to the counted value exactly as formatted.",
        ),
      );
    }
  }

  // A follower rides the path's declared geometry. A path that is rotated,
  // or that its own beats move, scale or turn, would be drawn somewhere its
  // follower is not; that combination is refused rather than rendered wrong.
  scene.beats.forEach((beat, beatIndex) => {
    if (beat.action !== "follow") return;
    const path = layers.find((layer) => layer.id === beat.params.pathId);
    if (path?.type !== "path") return;
    const mover = scene.beats.find(
      (other) =>
        other.targetId === path.id &&
        beatProperties(other).some(
          (property) =>
            property === "x" ||
            property === "y" ||
            property === "scale" ||
            property === "rotationDeg",
        ),
    );
    if (path.rotationDeg === 0 && !mover) return;
    issues.push(
      compileIssue(
        "FOLLOW_PATH_TRANSFORMED",
        `/scenes/${sceneIndex}/beats/${beatIndex}/params/pathId`,
        mover
          ? `Beat ${beat.id} follows path ${path.id}, which beat ${mover.id} moves; followers do not yet ride a moving path.`
          : `Beat ${beat.id} follows path ${path.id}, which is rotated ${path.rotationDeg} degrees; followers do not yet ride a rotated path.`,
        "error",
        "Draw the route in its final position in the path data, keep the path's rotation at 0 and give it no beats that move, scale or turn it.",
      ),
    );
  });
  return issues;
};

/**
 * Timing diagnostics speak in the frames the compiler actually uses. A
 * start becomes round(ms * fps / 1000) and a duration max(1, round(...)); the
 * window runs from the start frame up to, not including, start + duration.
 * These helpers turn a frame target back into the millisecond value that
 * reaches it under that same rounding, so a suggestion can be copied as is.
 */
const frameSpan = (start: number, end: number): string =>
  end - start <= 1 ? `frame ${start}` : `frames ${start}-${end - 1}`;

/** Smallest whole millisecond whose start frame is at least `frame`. */
const earliestStartMsFor = (frame: number, fps: number): number =>
  Math.max(0, Math.ceil(((frame - 0.5) * 1000) / fps));

/** Largest whole millisecond whose start frame is at most `frame`. */
const latestStartMsFor = (frame: number, fps: number): number =>
  Math.max(0, Math.ceil(((frame + 0.5) * 1000) / fps) - 1);

/** Largest whole millisecond duration that rounds to at most `frames`. */
const longestDurationMsFor = (frames: number, fps: number): number =>
  Math.ceil(((frames + 0.5) * 1000) / fps) - 1;

const anchorNote = (beat: Beat): string =>
  beat.at ? ` (resolved from phrase ${beat.at.phraseId})` : "";

/** The same start expressed as the field the author edits. */
const startEdit = (beat: Beat, resolvedMs: number, targetMs: number): string =>
  beat.at
    ? `offsetMs ${(beat.at.offsetMs ?? 0) + (targetMs - resolvedMs)} on its phrase anchor`
    : `startMs ${targetMs}`;

const validateMotionWindows = (
  scene: Scene,
  sceneIndex: number,
  fps: number,
  sceneFrames: number,
  starts: ResolvedStarts,
): Issue[] => {
  const issues: Issue[] = [];
  const writes = new Map<
    string,
    Array<{
      start: number;
      end: number;
      modern: boolean;
      beatIndex: number;
      startMs: number;
    }>
  >();
  scene.beats.forEach((beat, beatIndex) => {
    const startMs = starts.beats[beatIndex] ?? beat.startMs;
    for (const property of beatProperties(beat)) {
      const key = `${beat.targetId}:${property}`;
      const current = {
        beatIndex,
        startMs,
        start: msToFrameOffset(startMs, fps),
        end:
          msToFrameOffset(startMs, fps) +
          msToDurationFrames(beat.durationMs, fps),
        // Actions introduced with explicit endpoint semantics are conflict
        // checked; overlaps among the original presets stay accepted so
        // existing projects keep compiling. `exit` belongs to the first group:
        // two writes to one opacity in the same window have no defined result.
        modern:
          beat.action === "transform" ||
          beat.action === "exit" ||
          beat.action === "draw" ||
          beat.action === "follow" ||
          beat.action === "count",
      };
      const conflict = writes
        .get(key)
        ?.find(
          (other) =>
            (current.modern || other.modern) &&
            current.start < other.end &&
            current.end > other.start,
        );
      if (conflict) {
        const other = scene.beats[conflict.beatIndex] as Beat;
        // Suggest moving whichever write starts later, or ending the earlier.
        const [first, second] =
          conflict.start <= current.start
            ? [
                { beat: other, window: conflict },
                { beat, window: current },
              ]
            : [
                { beat, window: current },
                { beat: other, window: conflict },
              ];
        const moveTo = earliestStartMsFor(first.window.end, fps);
        const room = second.window.start - first.window.start;
        const shorten =
          room >= 1
            ? ` or end ${first.beat.id} by frame ${second.window.start - 1} (durationMs ${longestDurationMsFor(room, fps)} or less)`
            : "";
        issues.push(
          compileIssue(
            "MOTION_PROPERTY_OVERLAP",
            `/scenes/${sceneIndex}/beats/${beatIndex}`,
            `Beat ${beat.id} writes ${property} on ${beat.targetId} over ${frameSpan(current.start, current.end)}${anchorNote(beat)}, overlapping beat ${other.id}, which writes it over ${frameSpan(conflict.start, conflict.end)}${anchorNote(other)} (${fps} fps; starts round to the nearest frame).`,
            "error",
            `Start ${second.beat.id} at frame ${first.window.end} or later (${startEdit(second.beat, second.window.startMs, moveTo)})${shorten}. Writes to one target property must be sequential after rounding; different properties may overlap.`,
          ),
        );
      }
      writes.set(key, [...(writes.get(key) ?? []), current]);
    }
  });

  const moveStart = (moveIndex: number): number =>
    msToFrameOffset(
      starts.moves[moveIndex] ?? scene.camera?.moves[moveIndex]?.startMs ?? 0,
      fps,
    );
  scene.camera?.moves.forEach((move, moveIndex) => {
    const start = moveStart(moveIndex);
    const end = start + msToDurationFrames(move.durationMs, fps);
    if (end > sceneFrames) {
      issues.push(
        compileIssue(
          "CAMERA_MOVE_OUTSIDE_SCENE",
          `/scenes/${sceneIndex}/camera/moves/${moveIndex}`,
          `Camera move ${move.id} ends after scene ${scene.id}.`,
        ),
      );
    }
    const conflict = scene.camera?.moves
      .slice(0, moveIndex)
      .find(
        (other, otherIndex) =>
          start <
            moveStart(otherIndex) + msToDurationFrames(other.durationMs, fps) &&
          end > moveStart(otherIndex),
      );
    if (conflict) {
      issues.push(
        compileIssue(
          "CAMERA_MOVE_OVERLAP",
          `/scenes/${sceneIndex}/camera/moves/${moveIndex}`,
          `Camera move ${move.id} overlaps camera move ${conflict.id}.`,
          "error",
          "Keep camera moves sequential so each move starts from the preceding resolved pose.",
        ),
      );
    }
  });
  return issues;
};

/**
 * In a preview of one scene the neighbours are not in the draft, so the
 * previous scene's entry handle and the fact that this scene has a successor
 * are carried on the scene itself.
 */
const scopedTransitionHandles = (
  source: PlanSource,
  sceneIndex: number,
  durationInFrames: number,
  fps: number,
): {
  transitionIn?: CompiledDraft["scenes"][number]["transitionOut"];
  hasNextScene?: boolean;
} => {
  const previous = source.scenes.scenes[sceneIndex - 1];
  const handle = previous ? compileTransition(previous.transition, fps) : null;
  const fits =
    handle !== null &&
    handle.type !== "cut" &&
    handle.durationInFrames < durationInFrames;
  return {
    ...(handle && fits ? { transitionIn: handle } : {}),
    ...(sceneIndex < source.scenes.scenes.length - 1
      ? { hasNextScene: true }
      : {}),
  };
};

export interface CompileOptions {
  /** "final" compiles at the design format with no draft label. */
  mode?: "draft" | "final";
  /**
   * Draft only: 1080 renders the draft natively at the design format, so crop
   * and type can be reviewed at final size. The default stays 540.
   */
  resolution?: DraftResolution;
}

export type DraftResolution = 540 | 1080;

export const compileDraft = (
  source: PlanSource,
  requestedScope: DraftScope = { type: "project" },
  options: CompileOptions = {},
): Result<CompiledDraft> => {
  const mode = options.mode ?? "draft";
  const format =
    mode === "final" || options.resolution === 1080
      ? source.project.format.design
      : source.project.format.draft;
  const fps = format.fps;
  const scaleX = format.width / source.project.format.design.width;
  const scaleY = format.height / source.project.format.design.height;
  const issues: Issue[] = [];

  if (mode === "final" && requestedScope.type !== "project") {
    return {
      ok: false,
      issues: [
        compileIssue(
          "FINAL_REQUIRES_PROJECT_SCOPE",
          "/",
          "A final export covers the whole project, not one scene.",
          "error",
          "Export without a scene scope.",
        ),
      ],
    };
  }

  const displayFontFamily = source.profile.render.typography.displayFontFamily;
  if (
    displayFontFamily &&
    !compiledFonts(source).some((font) => font.family === displayFontFamily)
  ) {
    issues.push({
      code: "DISPLAY_FONT_NOT_DECLARED",
      severity: "error",
      responsible: "agent",
      artifact: "profile.lock.json",
      path: "/render/typography/displayFontFamily",
      message: `render.typography.displayFontFamily "${displayFontFamily}" does not match any locked font asset's family.`,
      suggestion:
        'Declare a profile asset of kind "font" with a matching family, or remove displayFontFamily.',
    });
  }

  issues.push(...checkSourceProvenance(source));
  issues.push(...checkBrandBindings(source));
  const recipeVisuals = new Map<string, CompiledRecipeVisual>();
  source.scenes.scenes.forEach((scene, sceneIndex) => {
    const visual = compileRecipeVisual(source, scene, sceneIndex, issues);
    if (visual) recipeVisuals.set(scene.id, visual);
  });

  // Narration wiring: when narration.json exists, derive timeline, check
  // provenance, and partition scenes against the narration clock. Otherwise
  // fall back to draft durations.
  const hasNarration = source.narration !== undefined;
  let narrationTimeline:
    | ReturnType<typeof resolveNarrationTimeline>
    | undefined;
  let partitionedScenes: ReturnType<typeof partitionScenes> extends Result<
    infer T
  >
    ? T
    : never = [] as unknown as ReturnType<
    typeof partitionScenes
  > extends Result<infer T>
    ? T
    : never;
  let narrationClips: CompiledDraft["narration"];
  let compiledCaptions: CompiledDraft["captions"];
  let scopedNarration: ScopedNarration | undefined;
  if (hasNarration && source.narration && requestedScope.type === "scene") {
    narrationTimeline = resolveNarrationTimeline(source.narration);
    const ownBlock = source.scenes.scenes.find(
      (scene) => scene.id === requestedScope.sceneId,
    )?.narration?.blockId;
    // A voice problem in another block must not block previewing this scene.
    issues.push(
      ...checkVoiceBindings(source).map((issue) =>
        issue.entityId === ownBlock || issue.severity !== "error"
          ? issue
          : { ...issue, severity: "warning" as const },
      ),
    );
    const scoped = compileSceneNarration({
      source,
      sceneId: requestedScope.sceneId,
      timeline: narrationTimeline,
      fps,
      scaleX,
      scaleY,
    });
    if (!scoped.ok) {
      issues.push(...scoped.issues);
    } else {
      scopedNarration = scoped.value;
      partitionedScenes = [
        {
          sceneId: requestedScope.sceneId,
          startMs: 0,
          endMs: 0,
          startFrame: 0,
          endFrame: scoped.value.durationInFrames,
        },
      ] as unknown as typeof partitionedScenes;
      narrationClips = scoped.value.narration;
      compiledCaptions = scoped.value.captions;
    }
  } else if (hasNarration && source.narration) {
    narrationTimeline = resolveNarrationTimeline(source.narration);
    if (narrationTimeline.totalDurationMs === null) {
      issues.push(
        compileIssue(
          "TIMELINE_INCOMPLETE",
          "/narration",
          "Every block needs measured audio before scenes can be partitioned against the narration clock.",
        ),
      );
    }
    issues.push(...checkVoiceBindings(source));
    const refs: SceneNarrationRef[] = [];
    let missingNarration = false;
    source.scenes.scenes.forEach((scene, index) => {
      if (!scene.narration) {
        missingNarration = true;
        issues.push(
          compileIssue(
            "SCENE_NARRATION_MISSING",
            `/scenes/${index}/narration`,
            `Scene ${scene.id} has no narration reference but the project has narration.json.`,
          ),
        );
      } else {
        refs.push({
          sceneId: scene.id,
          blockId: scene.narration.blockId,
          ...(scene.narration.phraseId
            ? { phraseId: scene.narration.phraseId }
            : {}),
        });
      }
    });
    if (!missingNarration && narrationTimeline.totalDurationMs !== null) {
      const partitioned = partitionScenes(narrationTimeline, refs, fps);
      if (!partitioned.ok) {
        issues.push(...partitioned.issues);
      } else {
        partitionedScenes =
          partitioned.value as unknown as typeof partitionedScenes;
        const cues = deriveCaptionCues(narrationTimeline, source.captions);
        if (!cues.ok) {
          issues.push(...cues.issues);
        } else if (requestedScope.type === "project") {
          compiledCaptions = {
            style: captionStyleFor(source, scaleX, scaleY),
            cues: cues.value.map((cue) => {
              const startFrame = Math.round((cue.startMs * fps) / 1000);
              return {
                id: cue.id,
                text: cue.text,
                startFrame,
                endFrame: Math.max(
                  startFrame + 1,
                  Math.round((cue.endMs * fps) / 1000),
                ),
              };
            }),
          };
        }
        // Build audio clips for renderer: each ready block at its global start
        narrationClips = {
          totalDurationMs: narrationTimeline.totalDurationMs,
          clips: narrationTimeline.blocks
            .filter((block) => block.ready && block.startMs !== null)
            .map((block) => {
              const blockRecord = source.narration?.blocks.find(
                (candidate) => candidate.id === block.id,
              );
              const audioAssetId =
                blockRecord && "audioAssetId" in blockRecord
                  ? blockRecord.audioAssetId
                  : "";
              const durationMs =
                blockRecord && "audioDurationMs" in blockRecord
                  ? blockRecord.audioDurationMs
                  : 0;
              return {
                blockId: block.id,
                assetId: audioAssetId,
                startMs: block.startMs as number,
                durationMs,
                startFrame: Math.round(
                  ((block.startMs as number) * fps) / 1000,
                ),
                durationInFrames: msToDurationFrames(durationMs, fps),
              };
            }),
        };
      }
    }
  }

  // Build source scene frames: either from narration partition or draft durations
  let sourceCursor = 0;
  const sourceScenes = source.scenes.scenes.map((scene, sceneIndex) => {
    if (hasNarration && partitionedScenes.length > 0) {
      const part = partitionedScenes.find(
        (candidate) => candidate.sceneId === scene.id,
      );
      if (part) {
        const sourceStartFrame = part.startFrame;
        const sourceEndFrame = part.endFrame;
        return { scene, sceneIndex, sourceStartFrame, sourceEndFrame };
      }
    }
    const durationInFrames = msToDurationFrames(scene.durationMs, fps);
    const sourceStartFrame = sourceCursor;
    const sourceEndFrame = sourceStartFrame + durationInFrames;
    sourceCursor = sourceEndFrame;
    return { scene, sceneIndex, sourceStartFrame, sourceEndFrame };
  });
  // Frames a scene's own (playable) outgoing transition consumes from its
  // tail; null if it declares cut, is the last scene, or failed the
  // per-neighbour check below (so it does not also trigger an overlap error).
  const outgoingTransitionFrames: Array<number | null> = sourceScenes.map(
    () => null,
  );
  // A narrated scene's length is only known once its block has audio. In a
  // scoped preview the other scenes are not placed, so they are not checked.
  const durationKnown = (index: number): boolean =>
    !hasNarration ||
    partitionedScenes.some(
      (entry) => entry.sceneId === sourceScenes[index]?.scene.id,
    );
  sourceScenes.forEach(
    ({ scene, sceneIndex, sourceStartFrame, sourceEndFrame }) => {
      if (scene.transition.type === "cut") return;
      if (!durationKnown(sceneIndex)) return;
      const ownDurationInFrames = sourceEndFrame - sourceStartFrame;
      const transitionFrames = msToDurationFrames(
        scene.transition.durationMs,
        fps,
      );
      const next = sourceScenes[sceneIndex + 1];
      if (!next) {
        issues.push(
          compileIssue(
            "TRANSITION_ON_FINAL_SCENE_IGNORED",
            `/scenes/${sceneIndex}/transition`,
            `Scene ${scene.id} declares a "${scene.transition.type}" transition but is the last scene, so it never plays.`,
            "warning",
            'Set the final scene\'s transition to "cut" or move the content that should transition earlier.',
          ),
        );
        return;
      }
      if (!durationKnown(sceneIndex + 1)) return;
      const nextDurationInFrames = next.sourceEndFrame - next.sourceStartFrame;
      if (
        transitionFrames >= ownDurationInFrames ||
        transitionFrames >= nextDurationInFrames
      ) {
        issues.push(
          compileIssue(
            "TRANSITION_DURATION_EXCEEDS_SCENE",
            `/scenes/${sceneIndex}/transition/durationMs`,
            `Scene ${scene.id}'s "${scene.transition.type}" transition (${scene.transition.durationMs}ms) does not fit inside both its own duration and scene ${next.scene.id}'s duration.`,
            "error",
            "Shorten the transition or lengthen the shorter of the two neighbouring scenes.",
          ),
        );
        return;
      }
      outgoingTransitionFrames[sceneIndex] = transitionFrames;
    },
  );

  // A short scene can pass both per-neighbour checks above and still not
  // have room for both halves at once (its own incoming entry plus its own
  // outgoing exit).
  sourceScenes.forEach(
    ({ scene, sceneIndex, sourceStartFrame, sourceEndFrame }) => {
      if (!durationKnown(sceneIndex)) return;
      const ownDurationInFrames = sourceEndFrame - sourceStartFrame;
      const incoming =
        sceneIndex > 0 ? (outgoingTransitionFrames[sceneIndex - 1] ?? 0) : 0;
      const outgoing = outgoingTransitionFrames[sceneIndex] ?? 0;
      if (incoming + outgoing > ownDurationInFrames) {
        issues.push(
          compileIssue(
            "TRANSITION_OVERLAP_WITHIN_SCENE",
            `/scenes/${sceneIndex}`,
            `Scene ${scene.id}'s incoming and outgoing transitions together need ${incoming + outgoing} frames, more than its own ${ownDurationInFrames}-frame duration.`,
            "error",
            "Shorten one of the two transitions or lengthen this scene.",
          ),
        );
      }
    },
  );

  const selectedSources =
    requestedScope.type === "project"
      ? sourceScenes
      : sourceScenes.filter(({ scene }) => scene.id === requestedScope.sceneId);

  if (requestedScope.type === "scene" && selectedSources.length === 0) {
    return {
      ok: false,
      issues: [
        compileIssue(
          "SCENE_NOT_FOUND",
          "/scope/sceneId",
          `Scene ${requestedScope.sceneId} does not exist.`,
          "error",
          "Choose a scene ID declared in scenes.json.",
        ),
      ],
    };
  }

  let renderCursor = 0;
  const varietyEntries: VarietyScene[] = [];
  // For narrated project, renderCursor should start at partitioned start, but
  // for selected scene scope we start at 0. For project scope, use partitioned
  // frames directly; for draft fallback, accumulate.
  const scenes = selectedSources.map(({ scene, sceneIndex }) => {
    let startFrame: number;
    let endFrame: number;
    let durationInFrames: number;
    if (hasNarration && partitionedScenes.length > 0) {
      const part = partitionedScenes.find(
        (candidate) => candidate.sceneId === scene.id,
      );
      if (part) {
        if (requestedScope.type === "project") {
          startFrame = part.startFrame;
          endFrame = part.endFrame;
          durationInFrames = endFrame - startFrame;
          // renderCursor not needed for project scope; keep it for non-narrated math
          renderCursor = Math.max(renderCursor, endFrame);
        } else {
          durationInFrames = part.endFrame - part.startFrame;
          startFrame = renderCursor;
          endFrame = startFrame + durationInFrames;
          renderCursor = endFrame;
        }
      } else {
        durationInFrames = msToDurationFrames(scene.durationMs, fps);
        startFrame = renderCursor;
        endFrame = startFrame + durationInFrames;
        renderCursor = endFrame;
      }
    } else {
      durationInFrames = msToDurationFrames(scene.durationMs, fps);
      startFrame = renderCursor;
      endFrame = startFrame + durationInFrames;
      renderCursor = endFrame;
    }
    issues.push(...validateLayerFrames(scene, sceneIndex, source));
    const starts = resolveAnchoredStarts(source, scene, sceneIndex);
    issues.push(...starts.issues);
    issues.push(...validatePathsAndCounts(scene, sceneIndex, fps, starts));
    issues.push(
      ...validateMotionWindows(
        scene,
        sceneIndex,
        fps,
        durationInFrames,
        starts,
      ),
    );
    const layout =
      scene.visual.type === "composition"
        ? resolveGroupLayouts(
            scene.visual.layers.map((layer) =>
              resolveLayerAppearance(layer, source.profile.render),
            ),
            sceneIndex,
          )
        : { layers: [], issues: [] };
    issues.push(...layout.issues);
    // An image mask radius past half the shortest edge is pure geometry on
    // the resolved (profile-defaulted) radius, so it is reported here as well
    // as in the renderer's preflight: `validate` catches it right after a
    // profile change instead of the next preview. Measured in the compiled
    // units, exactly as preflight measures it.
    layout.layers.forEach((layer, layerIndex) => {
      if (layer.type !== "image") return;
      const scaled = scaleLayer(layer, scaleX, scaleY);
      if (scaled.type !== "image") return;
      const radius = scaled.cornerRadius ?? 0;
      if (radius <= Math.min(scaled.frame.width, scaled.frame.height) / 2) {
        return;
      }
      issues.push({
        code: "IMAGE_MASK_INVALID",
        severity: "error",
        responsible: "agent",
        artifact: "scenes.json",
        path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}`,
        entityId: layer.id,
        message: `Image ${layer.id} corner radius exceeds half of its shortest edge.`,
        suggestion:
          "Reduce cornerRadius so the rendered mask matches the declared geometry.",
      });
    });
    varietyEntries.push({
      scene,
      sceneIndex,
      resolvedLayers: layout.layers,
      beatStartsMs: starts.beats,
    });

    const beats = scene.beats.map((beat, beatIndex) => {
      const beatStartFrame = msToFrameOffset(
        starts.beats[beatIndex] ?? beat.startMs,
        fps,
      );
      const beatDurationInFrames = msToDurationFrames(beat.durationMs, fps);
      if (beatStartFrame + beatDurationInFrames > durationInFrames) {
        const resolvedMs = starts.beats[beatIndex] ?? beat.startMs;
        const room = durationInFrames - beatStartFrame;
        const latestStart = latestStartMsFor(
          durationInFrames - beatDurationInFrames,
          fps,
        );
        const fixes = [
          ...(room >= 1
            ? [`durationMs ${longestDurationMsFor(room, fps)} or less`]
            : []),
          ...(durationInFrames - beatDurationInFrames >= 0
            ? [`${startEdit(beat, resolvedMs, latestStart)} or earlier`]
            : []),
        ];
        issues.push(
          compileIssue(
            "BEAT_OUTSIDE_SCENE",
            `/scenes/${sceneIndex}/beats/${beatIndex}`,
            `Beat ${beat.id} on ${beat.targetId} runs over ${frameSpan(beatStartFrame, beatStartFrame + beatDurationInFrames)}${anchorNote(beat)}, but scene ${scene.id} has ${durationInFrames} frames (0-${durationInFrames - 1}) at ${fps} fps.`,
            "error",
            fixes.length > 0
              ? `End it by frame ${durationInFrames - 1}: ${fixes.join(", or ")}.`
              : `The beat is longer than the scene; shorten it to durationMs ${longestDurationMsFor(durationInFrames, fps)} or less and set ${startEdit(beat, resolvedMs, 0)}.`,
          ),
        );
      }

      return scaleBeat(
        beat,
        beatStartFrame,
        beatDurationInFrames,
        scaleX,
        scaleY,
      );
    });

    return {
      id: scene.id,
      startFrame,
      endFrame,
      visual:
        scene.visual.type === "composition"
          ? { type: "composition" as const }
          : scene.visual.type === "recipe"
            ? (recipeVisuals.get(scene.id) ?? scene.visual)
            : scene.visual,
      layers:
        scene.visual.type === "composition"
          ? layout.layers.map((layer) => scaleLayer(layer, scaleX, scaleY))
          : [],
      beats,
      ...(scene.camera
        ? {
            camera: {
              initial: {
                x: scene.camera.initial.x * scaleX,
                y: scene.camera.initial.y * scaleY,
                zoom: scene.camera.initial.zoom,
              },
              moves: scene.camera.moves.map((move, moveIndex) => ({
                id: move.id,
                startFrame: msToFrameOffset(
                  starts.moves[moveIndex] ?? move.startMs,
                  fps,
                ),
                durationInFrames: msToDurationFrames(move.durationMs, fps),
                to: {
                  x: move.to.x * scaleX,
                  y: move.to.y * scaleY,
                  zoom: move.to.zoom,
                },
                ...(move.easingPreset
                  ? { easingPreset: move.easingPreset }
                  : {}),
              })),
            },
          }
        : {}),
      transitionOut: compileTransition(scene.transition, fps),
      ...(requestedScope.type === "scene"
        ? scopedTransitionHandles(source, sceneIndex, durationInFrames, fps)
        : {}),
    };
  });

  if (requestedScope.type === "project") {
    issues.push(...checkVariety(varietyEntries, source.profile.render));
  }
  issues.push(
    ...checkContrast(
      varietyEntries,
      source.profile.render,
      source.project.format.design,
    ),
  );

  if (issues.some((issue) => issue.severity === "error")) {
    return { ok: false, issues: sortIssues(issues) };
  }

  const sourceRevision = hashValue(source);
  const compiledScope =
    requestedScope.type === "project"
      ? ({ type: "project" } as const)
      : {
          type: "scene" as const,
          sceneId: requestedScope.sceneId,
          sourceStartFrame: scopedNarration
            ? scopedNarration.sourceStartFrame
            : (selectedSources[0]?.sourceStartFrame ?? 0),
          sourceEndFrame: scopedNarration
            ? scopedNarration.sourceEndFrame
            : (selectedSources[0]?.sourceEndFrame ?? 0),
        };
  const totalFrames =
    requestedScope.type === "project" &&
    hasNarration &&
    narrationTimeline?.totalDurationMs !== null
      ? Math.ceil(((narrationTimeline?.totalDurationMs ?? 0) * fps) / 1000)
      : renderCursor;
  const soundtrack = compileSoundtrack({
    project: source.project,
    assets: source.assets,
    fps,
    totalFrames,
    sceneStarts: new Map(scenes.map((scene) => [scene.id, scene.startFrame])),
    narrationWindows: (narrationClips?.clips ?? []).map((clip) => ({
      startFrame: clip.startFrame,
      endFrame: clip.startFrame + clip.durationInFrames,
    })),
    includeMusic: requestedScope.type === "project",
  });
  issues.push(...soundtrack.issues);
  if (soundtrack.issues.some((entry) => entry.severity === "error")) {
    return { ok: false, issues: sortIssues(issues) };
  }
  const draftCandidate = {
    schemaVersion: 1 as const,
    mode,
    width: format.width,
    height: format.height,
    fps,
    totalFrames,
    scope: compiledScope,
    timelineScope:
      requestedScope.type === "project"
        ? ("project" as const)
        : ("local" as const),
    label:
      mode === "final"
        ? ("FINAL" as const)
        : narrationClips?.clips.length || soundtrack.value
          ? ("DRAFT • WITH AUDIO" as const)
          : ("DRAFT • NO AUDIO" as const),
    sourceRevision,
    profile: {
      id: source.profile.id,
      version: source.profile.version,
      render: scaleRenderTokens(source.profile.render, scaleX, scaleY),
    },
    assets: compiledAssets(source),
    fonts: compiledFonts(source),
    scenes,
    ...(narrationClips ? { narration: narrationClips } : {}),
    ...(compiledCaptions ? { captions: compiledCaptions } : {}),
    ...(soundtrack.value ? { soundtrack: soundtrack.value } : {}),
  };
  const draftWithKey = {
    ...draftCandidate,
    assemblyKey: computeAssemblyKey(
      draftCandidate as Parameters<typeof computeAssemblyKey>[0],
    ),
  };
  const parsed = CompiledDraftSchema.safeParse(draftWithKey);

  if (!parsed.success) {
    return {
      ok: false,
      issues: sortIssues([
        ...issues,
        ...parsed.error.issues.map((issue) =>
          compileIssue(
            "COMPILED_DRAFT_INVALID",
            `/${issue.path.join("/")}`,
            issue.message,
          ),
        ),
      ]),
    };
  }

  return { ok: true, value: parsed.data, issues: sortIssues(issues) };
};
