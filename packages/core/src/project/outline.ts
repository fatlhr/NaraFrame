import { resolveCaptionMode } from "../compiler/captions.js";
import type { CaptionMode } from "../schema/captions.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { Frame, Layer, Scene } from "../schema/scene.js";
import { hashValue } from "./hash.js";

interface OutlineAnchor {
  phraseId: string;
  offsetMs?: number | undefined;
}

export interface OutlineLayer {
  id: string;
  type: Layer["type"];
  /** Text layers only: the string the viewer reads. */
  text?: string;
  /** Absent only on a group without bounds of its own. */
  frame?: Frame;
  /** Image layers only. */
  assetId?: string;
  /** Group layers only. */
  memberIds?: string[];
  space?: "world" | "overlay";
  slot?: string;
}

export interface OutlineBeat {
  id: string;
  action: string;
  targetId: string;
  startMs: number;
  durationMs: number;
  at?: OutlineAnchor;
  params: Record<string, unknown>;
}

export interface OutlineScene {
  id: string;
  role: string;
  /** Where the scene starts on the scene clock (the sum of earlier scenes). */
  startMs: number;
  durationMs: number;
  transition: Scene["transition"];
  visual:
    | { type: "composition" }
    | { type: "text"; text: string }
    | { type: "media"; assetId: string }
    | { type: "recipe"; recipe: string };
  camera?: {
    initial: { x: number; y: number; zoom: number };
    moves: Array<{
      id: string;
      startMs: number;
      durationMs: number;
      to: { x: number; y: number; zoom: number };
      at?: OutlineAnchor;
    }>;
  };
  narration?: { blockId: string; phraseId?: string | undefined };
  carriesFactualClaim?: boolean;
  sourceIds?: string[];
  note?: string;
  /** Composition scenes only. */
  layers?: OutlineLayer[];
  beats: OutlineBeat[];
}

export interface OutlineNarrationBlock {
  id: string;
  text: string;
  /** `ready` blocks carry measured audio and phrases; `planned` ones do not. */
  status: "planned" | "ready";
  audioAssetId?: string;
  audioDurationMs?: number;
  pauseAfterMs?: number;
  carriesFactualClaim?: boolean;
  sourceIds?: string[];
  /** Phrase timing only; per-word lists are left out. */
  phrases?: Array<{ id: string; text: string; startMs: number; endMs: number }>;
}

export interface Outline {
  project: {
    id: string;
    title: string;
    profile: { id: string; version: string };
    /** The current source revision: what `edit --expect` takes. */
    currentRevision: string;
    sceneCount: number;
    /** The sum of the scenes' own durations. */
    totalDurationMs: number;
  };
  scenes: OutlineScene[];
  /** Blocks in narration order; empty when the project has no narration. */
  narration: OutlineNarrationBlock[];
  captions: { mode: CaptionMode };
  assets: Array<{ id: string; kind: string; status: "planned" | "ready" }>;
  sources: Array<{ id: string; title: string }>;
}

const outlineLayer = (layer: Layer): OutlineLayer => ({
  id: layer.id,
  type: layer.type,
  ...(layer.type === "text" ? { text: layer.text } : {}),
  ...(layer.frame ? { frame: layer.frame } : {}),
  ...(layer.type === "image" ? { assetId: layer.assetId } : {}),
  ...(layer.type === "group" ? { memberIds: layer.memberIds } : {}),
  ...(layer.space ? { space: layer.space } : {}),
  ...(layer.slot ? { slot: layer.slot } : {}),
});

const outlineVisual = (visual: Scene["visual"]): OutlineScene["visual"] => {
  switch (visual.type) {
    case "text":
      return { type: "text", text: visual.text };
    case "media":
      return { type: "media", assetId: visual.assetId };
    case "recipe":
      return { type: "recipe", recipe: visual.recipe };
    case "composition":
      return { type: "composition" };
  }
};

const outlineScene = (scene: Scene, startMs: number): OutlineScene => ({
  id: scene.id,
  role: scene.narrativeRole,
  startMs,
  durationMs: scene.durationMs,
  transition: scene.transition,
  visual: outlineVisual(scene.visual),
  ...(scene.camera
    ? {
        camera: {
          initial: scene.camera.initial,
          moves: scene.camera.moves.map((move) => ({
            id: move.id,
            startMs: move.startMs,
            durationMs: move.durationMs,
            to: move.to,
            ...(move.at ? { at: move.at } : {}),
          })),
        },
      }
    : {}),
  ...(scene.narration ? { narration: scene.narration } : {}),
  ...(scene.carriesFactualClaim !== undefined
    ? { carriesFactualClaim: scene.carriesFactualClaim }
    : {}),
  ...(scene.sourceIds ? { sourceIds: scene.sourceIds } : {}),
  ...(scene.note ? { note: scene.note } : {}),
  ...(scene.visual.type === "composition"
    ? { layers: scene.visual.layers.map(outlineLayer) }
    : {}),
  beats: scene.beats.map((beat) => ({
    id: beat.id,
    action: beat.action,
    targetId: beat.targetId,
    startMs: beat.startMs,
    durationMs: beat.durationMs,
    ...(beat.at ? { at: beat.at } : {}),
    params: beat.params,
  })),
});

const outlineNarration = (
  narration: NonNullable<PlanSource["narration"]>,
): OutlineNarrationBlock[] => {
  const byId = new Map(narration.blocks.map((block) => [block.id, block]));
  const blocks: OutlineNarrationBlock[] = [];
  for (const id of narration.order) {
    const block = byId.get(id);
    if (!block) continue;
    const common = {
      id: block.id,
      text: block.text,
      ...(block.carriesFactualClaim !== undefined
        ? { carriesFactualClaim: block.carriesFactualClaim }
        : {}),
      ...(block.sourceIds ? { sourceIds: block.sourceIds } : {}),
    };
    blocks.push(
      "phrases" in block
        ? {
            ...common,
            status: "ready",
            audioAssetId: block.audioAssetId,
            audioDurationMs: block.audioDurationMs,
            pauseAfterMs: block.pauseAfterMs,
            phrases: block.phrases.map((phrase) => ({
              id: phrase.id,
              text: phrase.text,
              startMs: phrase.startMs,
              endMs: phrase.endMs,
            })),
          }
        : { ...common, status: "planned" },
    );
  }
  return blocks;
};

/**
 * A compact map of a loaded project: the ids and timings an agent needs to
 * aim a revision, without the whole source. It reads only what the plan
 * loader already validated and never compiles or renders.
 */
export const buildOutline = (source: PlanSource): Outline => {
  let cursor = 0;
  const scenes = source.scenes.scenes.map((scene) => {
    const outlined = outlineScene(scene, cursor);
    cursor += scene.durationMs;
    return outlined;
  });
  const declared = new Map<string, string>();
  for (const declaredSource of [
    ...(source.scenes.sources ?? []),
    ...(source.narration?.sources ?? []),
  ])
    if (!declared.has(declaredSource.id))
      declared.set(declaredSource.id, declaredSource.title);

  return {
    project: {
      id: source.project.id,
      title: source.project.title,
      profile: source.project.profile,
      // The same hash `validate` and `status` report as `sourceRevision`.
      currentRevision: hashValue(source),
      sceneCount: scenes.length,
      totalDurationMs: cursor,
    },
    scenes,
    narration: source.narration ? outlineNarration(source.narration) : [],
    captions: { mode: resolveCaptionMode(source.profile, source.captions) },
    assets: source.assets.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      status: asset.status,
    })),
    sources: [...declared].map(([id, title]) => ({ id, title })),
  };
};

/**
 * The outline narrowed to one scene: that scene in full, plus only the
 * narration blocks it names and the assets its visual and layers use. The
 * project, captions and sources stay whole. Null when the scene is unknown.
 */
export const narrowOutlineToScene = (
  outline: Outline,
  sceneId: string,
): Outline | null => {
  const scene = outline.scenes.find((entry) => entry.id === sceneId);
  if (!scene) return null;
  const assetIds = new Set<string>();
  if (scene.visual.type === "media") assetIds.add(scene.visual.assetId);
  for (const layer of scene.layers ?? [])
    if (layer.assetId) assetIds.add(layer.assetId);
  const blockId = scene.narration?.blockId;
  return {
    ...outline,
    scenes: [scene],
    narration: outline.narration.filter((block) => block.id === blockId),
    assets: outline.assets.filter((asset) => assetIds.has(asset.id)),
  };
};
