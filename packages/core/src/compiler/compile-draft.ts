import { createHash } from "node:crypto";
import { type Issue, type Result, sortIssues } from "../model/issue.js";
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
import { checkVariety, type VarietyScene } from "./variety.js";

export type DraftScope =
  | { type: "project" }
  | { type: "scene"; sceneId: string };

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
};

const hashValue = (value: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");

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
        ? {
            kind: "png" as const,
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

export const compileDraft = (
  source: PlanSource,
  requestedScope: DraftScope = { type: "project" },
): Result<CompiledDraft> => {
  const fps = source.project.format.draft.fps;
  const scaleX =
    source.project.format.draft.width / source.project.format.design.width;
  const scaleY =
    source.project.format.draft.height / source.project.format.design.height;
  let sourceCursor = 0;
  const issues: Issue[] = [];
  const sourceScenes = source.scenes.scenes.map((scene, sceneIndex) => {
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
  sourceScenes.forEach(
    ({ scene, sceneIndex, sourceStartFrame, sourceEndFrame }) => {
      if (scene.transition.type === "cut") return;
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
  const scenes = selectedSources.map(({ scene, sceneIndex }) => {
    const durationInFrames = msToDurationFrames(scene.durationMs, fps);
    const startFrame = renderCursor;
    const endFrame = startFrame + durationInFrames;
    renderCursor = endFrame;
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
    };
  });

  if (requestedScope.type === "project") {
    issues.push(...checkVariety(varietyEntries, source.profile.render));
  }

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
          sourceStartFrame: selectedSources[0]?.sourceStartFrame ?? 0,
          sourceEndFrame: selectedSources[0]?.sourceEndFrame ?? 0,
        };
  const draftCandidate = {
    schemaVersion: 1 as const,
    mode: "draft" as const,
    width: source.project.format.draft.width,
    height: source.project.format.draft.height,
    fps,
    totalFrames: renderCursor,
    scope: compiledScope,
    timelineScope:
      requestedScope.type === "project"
        ? ("project" as const)
        : ("local" as const),
    label: "DRAFT • NO AUDIO" as const,
    sourceRevision,
    assemblyKey: hashValue({
      sourceRevision,
      renderer: "m0.9",
      scope: compiledScope,
    }),
    profile: {
      id: source.profile.id,
      version: source.profile.version,
      render: scaleRenderTokens(source.profile.render, scaleX, scaleY),
    },
    assets: compiledAssets(source),
    scenes,
  };
  const parsed = CompiledDraftSchema.safeParse(draftCandidate);

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
