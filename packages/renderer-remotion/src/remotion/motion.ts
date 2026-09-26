import type {
  CompiledBeat,
  CompiledDraft,
  CompiledTransition,
  Layer,
} from "@naraframe/core";
import { formatCount } from "@naraframe/core/count-format";
import {
  cutPath,
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";
import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";

type PathLayer = Extract<Layer, { type: "path" }>;
type Scene = CompiledDraft["scenes"][number];

const lengths = new Map<string, number>();

/** Path length in viewBox units; parsing is the slow part, so it is cached. */
export const pathLengthOf = (d: string): number => {
  const known = lengths.get(d);
  if (known !== undefined) return known;
  const length = getLength(d);
  lengths.set(d, length);
  return length;
};

/**
 * A point a fraction of the way along a path, on the page in the path's own
 * plane (before the camera), with the direction of travel in degrees. The
 * compiler guarantees the viewBox sits on the frame without distortion.
 */
export const pointAlongPath = (
  layer: PathLayer,
  fraction: number,
): { x: number; y: number; angleDeg: number } => {
  const length = pathLengthOf(layer.d);
  const at = Math.max(0, Math.min(1, fraction)) * length;
  const point = getPointAtLength(layer.d, at) ?? { x: 0, y: 0 };
  const tangent = getTangentAtLength(layer.d, at) ?? { x: 1, y: 0 };
  const scaleX = layer.frame.width / layer.viewBox.width;
  const scaleY = layer.frame.height / layer.viewBox.height;
  return {
    x: layer.frame.x + (point.x - layer.viewBox.minX) * scaleX,
    y: layer.frame.y + (point.y - layer.viewBox.minY) * scaleY,
    angleDeg: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
  };
};

/** The part of a path to paint at this frame; null when nothing is drawn. */
export const drawnPathFor = (
  scene: Scene,
  layer: PathLayer,
  localFrame: number,
): string | null => {
  const progress = drawProgressFor(scene, layer.id, localFrame);
  if (progress >= 1) return layer.d;
  if (progress <= 0) return null;
  return cutPath(layer.d, pathLengthOf(layer.d) * progress);
};

const beatProgress = (beat: CompiledBeat, localFrame: number): number =>
  interpolate(
    localFrame,
    [beat.startFrame, beat.startFrame + beat.durationInFrames],
    [0, 1],
    { ...clamp, easing: easingFor(beat.params.easingPreset, beat.action) },
  );

/**
 * How much of a path is drawn. Sequential like every other written property:
 * each draw continues from where the previous one settled unless it names its
 * own start, and before the first draw the path stands at that draw's start.
 */
export const drawProgressFor = (
  scene: Scene,
  layerId: string,
  localFrame: number,
): number => {
  const draws = scene.beats
    .filter(
      (beat): beat is Extract<CompiledBeat, { action: "draw" }> =>
        beat.action === "draw" && beat.targetId === layerId,
    )
    .sort((left, right) => left.startFrame - right.startFrame);
  const first = draws[0];
  if (!first) return 1;
  let value = first.params.from ?? 0;
  for (const beat of draws) {
    if (localFrame < beat.startFrame) break;
    const from = beat.params.from ?? value;
    const to = beat.params.to ?? 1;
    value = from + (to - from) * beatProgress(beat, localFrame);
  }
  return value;
};

/**
 * The text a counted layer shows at this frame, or null when nothing counts
 * it. Before the first count it reads that count's start value.
 */
export const countedTextFor = (
  scene: Scene,
  layerId: string,
  localFrame: number,
): string | null => {
  const counts = scene.beats
    .filter(
      (beat): beat is Extract<CompiledBeat, { action: "count" }> =>
        beat.action === "count" && beat.targetId === layerId,
    )
    .sort((left, right) => left.startFrame - right.startFrame);
  const first = counts[0];
  if (!first) return null;
  let value = first.params.from;
  let format = first.params;
  for (const beat of counts) {
    if (localFrame < beat.startFrame) break;
    value =
      beat.params.from +
      (beat.params.to - beat.params.from) * beatProgress(beat, localFrame);
    format = beat.params;
  }
  return formatCount(value, format);
};

/** Every string a counted layer can show at its widest, for measurement. */
export const countedTextVariants = (scene: Scene, layerId: string): string[] =>
  scene.beats.flatMap((beat) =>
    beat.action === "count" && beat.targetId === layerId
      ? [
          formatCount(beat.params.from, beat.params),
          formatCount(beat.params.to, beat.params),
        ]
      : [],
  );

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easingFor = (
  preset: "linear" | "smooth" | "snappy" | undefined,
  action:
    | "reveal"
    | "exit"
    | "emphasize"
    | "focus"
    | "transform"
    | "draw"
    | "follow"
    | "count"
    | "camera",
) => {
  if (preset === "linear") return Easing.linear;
  if (preset === "smooth") return Easing.inOut(Easing.cubic);
  if (preset === "snappy") return Easing.out(Easing.cubic);
  return action === "focus"
    ? Easing.inOut(Easing.cubic)
    : Easing.out(Easing.cubic);
};

export interface MotionState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
  anchor: { x: number; y: number };
}

export const motionStateFor = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  targetId: string,
  localFrame: number,
): MotionState => {
  const state: MotionState = {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotationDeg: 0,
    anchor: { x: 0.5, y: 0.5 },
  };

  // Transform and follow beats write one sequential pose: each continues
  // from where the previous settled. A follower placed by its first beat
  // waits at the start of its path, so it never jumps onto the route.
  const target = scene.layers.find((layer) => layer.id === targetId);
  const pathOf = (pathId: string): PathLayer | undefined => {
    const layer = scene.layers.find((candidate) => candidate.id === pathId);
    return layer?.type === "path" ? layer : undefined;
  };
  const followPose = (
    beat: Extract<CompiledBeat, { action: "follow" }>,
    progress: number,
  ): { x: number; y: number; rotationDeg: number } | null => {
    const path = pathOf(beat.params.pathId);
    if (!path || !target || target.type === "group") return null;
    const from = beat.params.from ?? 0;
    const to = beat.params.to ?? 1;
    const point = pointAlongPath(path, from + (to - from) * progress);
    return {
      x: point.x - (target.frame.x + target.frame.width / 2),
      y: point.y - (target.frame.y + target.frame.height / 2),
      // Faces the way it travels, so a follower going back down its path
      // turns around rather than reversing.
      rotationDeg: point.angleDeg + (to < from ? 180 : 0),
    };
  };
  const positionBeats = scene.beats
    .filter(
      (item) =>
        (item.action === "transform" || item.action === "follow") &&
        item.targetId === targetId,
    )
    .sort((left, right) => left.startFrame - right.startFrame);
  const initialPose = { x: 0, y: 0, scale: 1, rotationDeg: 0 };
  const firstFollow = positionBeats[0];
  if (firstFollow?.action === "follow") {
    const held = followPose(firstFollow, 0);
    if (held) {
      initialPose.x = held.x;
      initialPose.y = held.y;
      if (firstFollow.params.orient) initialPose.rotationDeg = held.rotationDeg;
    }
  }
  const transformPose = positionBeats.reduce((pose, beat) => {
    if (localFrame < beat.startFrame) return pose;
    if (beat.action === "follow") {
      const next = followPose(beat, beatProgress(beat, localFrame));
      if (!next) return pose;
      return {
        scale: pose.scale,
        x: next.x,
        y: next.y,
        rotationDeg: beat.params.orient ? next.rotationDeg : pose.rotationDeg,
      };
    }
    if (beat.action !== "transform") return pose;
    const progress = interpolate(
      localFrame,
      [beat.startFrame, beat.startFrame + beat.durationInFrames],
      [0, 1],
      {
        ...clamp,
        easing: easingFor(beat.params.easingPreset, beat.action),
      },
    );
    return {
      x:
        beat.params.to.x === undefined
          ? pose.x
          : pose.x + (beat.params.to.x - pose.x) * progress,
      y:
        beat.params.to.y === undefined
          ? pose.y
          : pose.y + (beat.params.to.y - pose.y) * progress,
      scale:
        beat.params.to.scale === undefined
          ? pose.scale
          : pose.scale + (beat.params.to.scale - pose.scale) * progress,
      rotationDeg:
        beat.params.to.rotationDeg === undefined
          ? pose.rotationDeg
          : pose.rotationDeg +
            (beat.params.to.rotationDeg - pose.rotationDeg) * progress,
    };
  }, initialPose);
  state.translateX = transformPose.x;
  state.translateY = transformPose.y;
  state.scale = transformPose.scale;
  state.rotationDeg = transformPose.rotationDeg;

  for (const beat of scene.beats.filter((item) => item.targetId === targetId)) {
    if (
      beat.action === "transform" ||
      beat.action === "follow" ||
      beat.action === "draw" ||
      beat.action === "count"
    )
      continue;
    const progress = interpolate(
      localFrame,
      [beat.startFrame, beat.startFrame + beat.durationInFrames],
      [0, 1],
      { ...clamp, easing: easingFor(beat.params.easingPreset, beat.action) },
    );

    if (beat.action === "reveal") {
      state.opacity *= progress;
      const offset = (1 - progress) * beat.params.distance;
      if (beat.params.direction === "up") state.translateY += offset;
      if (beat.params.direction === "down") state.translateY -= offset;
      if (beat.params.direction === "left") state.translateX += offset;
      if (beat.params.direction === "right") state.translateX -= offset;
    }

    if (beat.action === "exit") {
      // The mirror of reveal. `interpolate` clamps, so every frame after the
      // window reads progress 1 and the element stays hidden however the
      // renderer arrives at that frame.
      state.opacity *= 1 - progress;
      const offset = progress * (beat.params.distance ?? 0);
      if (beat.params.direction === "up") state.translateY -= offset;
      if (beat.params.direction === "down") state.translateY += offset;
      if (beat.params.direction === "left") state.translateX -= offset;
      if (beat.params.direction === "right") state.translateX += offset;
    }

    if (beat.action === "emphasize") {
      state.scale *= 1 + Math.sin(progress * Math.PI) * (beat.params.scale - 1);
    }

    if (beat.action === "focus") {
      const strength = progress * beat.params.intensity;
      const distance = draft.profile.render.spacingUnit * 12 * strength;
      const scale = 1 + strength * (draft.profile.render.motion.focusScale - 1);
      state.anchor = beat.params.anchor ?? state.anchor;
      if (beat.params.camera === "pan") state.translateX -= distance;
      if (beat.params.camera === "push") {
        state.translateY -= distance / 2;
        state.scale *= scale;
      }
      if (beat.params.camera === "zoom") state.scale *= scale;
    }
  }

  return state;
};

export interface GroupTransform {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
  anchorX: number;
  anchorY: number;
}

/**
 * Composes a group's static `transform` with its own beat-driven motion into
 * the single screen transform `GroupView` applies to its wrapper element.
 * `visual-preflight` folds the same values into member collision rectangles
 * so a text layer inside a moved/animated group is checked at the position
 * it actually renders at, not its untransformed local frame.
 */
export const groupScreenTransformFor = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  group: Extract<Layer, { type: "group" }>,
  localFrame: number,
): GroupTransform => {
  const motion = motionStateFor(draft, scene, group.id, localFrame);
  return {
    opacity: group.transform.opacity * motion.opacity,
    translateX: group.transform.x + motion.translateX,
    translateY: group.transform.y + motion.translateY,
    scale: group.transform.scale * motion.scale,
    rotationDeg: group.transform.rotationDeg + motion.rotationDeg,
    anchorX: motion.anchor.x,
    anchorY: motion.anchor.y,
  };
};

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export const cameraStateFor = (
  scene: CompiledDraft["scenes"][number],
  localFrame: number,
): CameraState => {
  if (!scene.camera) return { x: 0, y: 0, zoom: 1 };
  let pose: CameraState = scene.camera.initial;
  for (const move of [...scene.camera.moves].sort(
    (left, right) => left.startFrame - right.startFrame,
  )) {
    if (localFrame < move.startFrame) break;
    const progress = interpolate(
      localFrame,
      [move.startFrame, move.startFrame + move.durationInFrames],
      [0, 1],
      {
        ...clamp,
        easing: easingFor(move.easingPreset, "camera"),
      },
    );
    pose = {
      x: pose.x + (move.to.x - pose.x) * progress,
      y: pose.y + (move.to.y - pose.y) * progress,
      zoom: pose.zoom + (move.to.zoom - pose.zoom) * progress,
    };
    if (progress < 1) break;
  }
  return pose;
};

export interface PlaneTransform {
  translateX: number;
  translateY: number;
  scale: number;
  originX: number;
  originY: number;
}

export const planeTransformFor = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  space: "world" | "overlay" | undefined,
  parallax: number | undefined,
  localFrame: number,
  billboard?: { x: number; y: number },
): PlaneTransform => {
  if (space !== "world") {
    return {
      translateX: 0,
      translateY: 0,
      scale: 1,
      originX: draft.width / 2,
      originY: draft.height / 2,
    };
  }
  const depth = parallax ?? 1;
  const camera = cameraStateFor(scene, localFrame);
  const plane = {
    translateX: -camera.x * depth,
    translateY: -camera.y * depth,
    scale: camera.zoom ** depth,
    originX: draft.width / 2,
    originY: draft.height / 2,
  };
  if (!billboard) return plane;
  // Carry the pinned point to where the camera puts it, at design size.
  const screenX =
    plane.originX +
    (billboard.x - plane.originX) * plane.scale +
    plane.translateX;
  const screenY =
    plane.originY +
    (billboard.y - plane.originY) * plane.scale +
    plane.translateY;
  return {
    ...plane,
    translateX: screenX - billboard.x,
    translateY: screenY - billboard.y,
    scale: 1,
  };
};

type BoundedTransition = Exclude<CompiledTransition, { type: "cut" }>;

const transitionEasing = Easing.inOut(Easing.cubic);

export interface SceneTransitionState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  anchor: { x: number; y: number };
  /** Only mask-reveal sets this; it clips paint, not layout, so preflight
   * geometry ignores it deliberately. */
  clipPath?: string;
}

const IDENTITY_SCENE_TRANSITION: SceneTransitionState = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  anchor: { x: 0.5, y: 0.5 },
};

/**
 * One primitive's contribution to a scene's own boundary frames — the exit
 * half lives in the outgoing scene's tail, the entry half in the incoming
 * scene's head. There is no cross-scene compositing: each half only ever
 * touches the frames of the scene that owns it, so the compiled contract's
 * non-overlapping scene ranges stay intact. `eased` is already the
 * interpolated 0→1 progress through that half's window.
 */
const boundedTransitionState = (
  transition: BoundedTransition,
  eased: number,
  mode: "exit" | "entry",
  width: number,
  height: number,
): SceneTransitionState => {
  if (transition.type === "push-through") {
    const horizontal =
      transition.direction === "left" || transition.direction === "right";
    const distance = (horizontal ? width : height) * 0.35;
    const exitSign =
      transition.direction === "left" || transition.direction === "up" ? -1 : 1;
    const sign = mode === "exit" ? exitSign : -exitSign;
    const magnitude = mode === "exit" ? eased : 1 - eased;
    const offset = sign * distance * magnitude;
    return {
      ...IDENTITY_SCENE_TRANSITION,
      opacity: mode === "exit" ? 1 - eased : eased,
      translateX: horizontal ? offset : 0,
      translateY: horizontal ? 0 : offset,
      scale: mode === "exit" ? 1 - 0.12 * eased : 0.88 + 0.12 * eased,
    };
  }

  if (transition.type === "mask-reveal") {
    if (mode === "exit") {
      return { ...IDENTITY_SCENE_TRANSITION, opacity: 1 - eased };
    }
    const clipPath =
      transition.shape === "circle"
        ? `circle(${eased * 150}% at 50% 50%)`
        : `inset(${(1 - eased) * 50}%)`;
    return { ...IDENTITY_SCENE_TRANSITION, clipPath };
  }

  const anchor = transition.anchor ?? { x: 0.5, y: 0.5 };
  return {
    ...IDENTITY_SCENE_TRANSITION,
    scale: mode === "exit" ? 1 + 0.3 * eased : 1.3 - 0.3 * eased,
    anchor,
  };
};

/**
 * Whichever of this scene's own boundary transitions is active at
 * `localFrame`: its own `transitionOut` near its tail (skipped on the last
 * scene, which never plays into anything), or the previous scene's
 * `transitionOut` near its head (skipped on the first scene). At most one
 * applies in a validated project — TRANSITION_DURATION_EXCEEDS_SCENE and
 * TRANSITION_OVERLAP_WITHIN_SCENE keep both windows from fitting at once.
 * `visual-preflight` folds the same numeric state into checked-frame text
 * rectangles for the same reason `groupScreenTransformFor` does: a text
 * layer checked during an active transition window renders at a different
 * screen position/scale than its untransformed layer frame.
 */
export const sceneTransitionStateFor = (
  draft: CompiledDraft,
  sceneIndex: number,
  localFrame: number,
): SceneTransitionState => {
  const scene = draft.scenes[sceneIndex];
  if (!scene) return IDENTITY_SCENE_TRANSITION;
  const sceneDurationInFrames = scene.endFrame - scene.startFrame;

  if (
    scene.transitionOut.type !== "cut" &&
    (sceneIndex < draft.scenes.length - 1 || scene.hasNextScene === true)
  ) {
    const windowStart =
      sceneDurationInFrames - scene.transitionOut.durationInFrames;
    if (localFrame >= windowStart) {
      const eased = interpolate(
        localFrame,
        [windowStart, sceneDurationInFrames],
        [0, 1],
        { ...clamp, easing: transitionEasing },
      );
      return boundedTransitionState(
        scene.transitionOut,
        eased,
        "exit",
        draft.width,
        draft.height,
      );
    }
  }

  const incoming =
    scene.transitionIn ?? draft.scenes[sceneIndex - 1]?.transitionOut;
  if (incoming && incoming.type !== "cut") {
    const durationInFrames = incoming.durationInFrames;
    if (localFrame < durationInFrames) {
      const eased = interpolate(localFrame, [0, durationInFrames], [0, 1], {
        ...clamp,
        easing: transitionEasing,
      });
      return boundedTransitionState(
        incoming,
        eased,
        "entry",
        draft.width,
        draft.height,
      );
    }
  }

  return IDENTITY_SCENE_TRANSITION;
};

export const motionStyleFor = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  targetId: string,
  localFrame: number,
): CSSProperties => {
  const state = motionStateFor(draft, scene, targetId, localFrame);
  return {
    opacity: state.opacity,
    translate: `${state.translateX}px ${state.translateY}px`,
    scale: state.scale,
    rotate: `${state.rotationDeg}deg`,
    transformOrigin: `${state.anchor.x * 100}% ${state.anchor.y * 100}%`,
  };
};
