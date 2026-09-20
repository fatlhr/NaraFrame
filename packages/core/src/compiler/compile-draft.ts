import { type Issue, type Result, sortIssues } from "../model/issue.js";
import { hashValue } from "../project/hash.js";
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
import { partitionScenes, type SceneNarrationRef } from "./scene-partition.js";
import {
  captionStyleFor,
  compileSceneNarration,
  type ScopedNarration,
} from "./scoped-narration.js";
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

const compiledAssets = (source: PlanSource): Record<string, CompiledAsset> =>
  Object.fromEntries(
    source.assets.assets.map((asset) => [
      asset.id,
      asset.status === "ready"
        ? asset.kind === "png"
          ? {
              kind: "png" as const,
              publicPath: asset.path,
              sha256: asset.sha256,
            }
          : {
              kind: asset.kind,
              publicPath: asset.path,
              sha256: asset.sha256,
            }
        : {
            kind: "placeholder" as const,
            assetId: asset.id,
            label: asset.purpose,
          },
    ]),
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
      color: layer.color ?? render.palette.text,
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
      cornerRadius:
        layer.shape === "circle"
          ? Math.min(layer.frame.width, layer.frame.height) / 2
          : (layer.cornerRadius ?? render.appearance?.radius.medium ?? 44),
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

  if (beat.action === "emphasize") {
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

  scene.visual.layers.forEach((layer, layerIndex) => {
    const framePath = `/scenes/${sceneIndex}/visual/layers/${layerIndex}/frame`;
    const frame = layer.frame;
    if (!frame) return;
    const right = frame.x + frame.width;
    const bottom = frame.y + frame.height;
    if (frame.x < 0 || frame.y < 0 || right > width || bottom > height) {
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
}

export const compileDraft = (
  source: PlanSource,
  requestedScope: DraftScope = { type: "project" },
  options: CompileOptions = {},
): Result<CompiledDraft> => {
  const mode = options.mode ?? "draft";
  const format =
    mode === "final"
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
    varietyEntries.push({ scene, sceneIndex, resolvedLayers: layout.layers });

    const beats = scene.beats.map((beat, beatIndex) => {
      const beatStartFrame = msToFrameOffset(beat.startMs, fps);
      const beatDurationInFrames = msToDurationFrames(beat.durationMs, fps);
      if (beatStartFrame + beatDurationInFrames > durationInFrames) {
        issues.push(
          compileIssue(
            "BEAT_OUTSIDE_SCENE",
            `/scenes/${sceneIndex}/beats/${beatIndex}`,
            `Beat ${beat.id} ends after scene ${scene.id}.`,
            "error",
            "Keep the beat inside its owning scene and compile again.",
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
          : scene.visual,
      layers:
        scene.visual.type === "composition"
          ? layout.layers.map((layer) => scaleLayer(layer, scaleX, scaleY))
          : [],
      beats,
      transitionOut: compileTransition(scene.transition, fps),
      ...(requestedScope.type === "scene"
        ? scopedTransitionHandles(source, sceneIndex, durationInFrames, fps)
        : {}),
    };
  });

  if (requestedScope.type === "project") {
    issues.push(...checkVariety(varietyEntries, source.profile.render));
  }
  issues.push(...checkContrast(varietyEntries, source.profile.render));

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
        : narrationClips?.clips.length
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
