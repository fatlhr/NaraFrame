import { createHash } from "node:crypto";
import { type Issue, type Result, sortIssues } from "../model/issue.js";
import type { CompiledAsset, CompiledDraft } from "../schema/compiled.js";
import { CompiledDraftSchema } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { RenderTokens } from "../schema/profile.js";
import type { Beat, Frame, Layer, Scene } from "../schema/scene.js";

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

const scaleLayer = (layer: Layer, scaleX: number, scaleY: number): Layer => {
  if (layer.type === "group") {
    return {
      ...layer,
      transform: {
        ...layer.transform,
        x: layer.transform.x * scaleX,
        y: layer.transform.y * scaleY,
      },
    };
  }

  return { ...layer, frame: scaleFrame(layer.frame, scaleX, scaleY) };
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
    if (layer.type === "group") {
      return;
    }

    const framePath = `/scenes/${sceneIndex}/visual/layers/${layerIndex}/frame`;
    const right = layer.frame.x + layer.frame.width;
    const bottom = layer.frame.y + layer.frame.height;
    if (
      layer.frame.x < 0 ||
      layer.frame.y < 0 ||
      right > width ||
      bottom > height
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
      (layer.frame.x < safeZone.left ||
        layer.frame.y < safeZone.top ||
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
  const scenes = selectedSources.map(({ scene, sceneIndex }) => {
    const durationInFrames = msToDurationFrames(scene.durationMs, fps);
    const startFrame = renderCursor;
    const endFrame = startFrame + durationInFrames;
    renderCursor = endFrame;
    issues.push(...validateLayerFrames(scene, sceneIndex, source));

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
          ? scene.visual.layers.map((layer) =>
              scaleLayer(layer, scaleX, scaleY),
            )
          : [],
      beats,
    };
  });

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
      renderer: "m0.4",
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
