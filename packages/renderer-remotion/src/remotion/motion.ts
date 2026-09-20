import type { CompiledDraft, CompiledTransition, Layer } from "@naraframe/core";
import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easingFor = (
  preset: "linear" | "smooth" | "snappy" | undefined,
  action: "reveal" | "emphasize" | "focus",
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
    anchor: { x: 0.5, y: 0.5 },
  };

  for (const beat of scene.beats.filter((item) => item.targetId === targetId)) {
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
    rotationDeg: group.transform.rotationDeg,
    anchorX: motion.anchor.x,
    anchorY: motion.anchor.y,
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
    sceneIndex < draft.scenes.length - 1
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

  const previous = draft.scenes[sceneIndex - 1];
  if (previous && previous.transitionOut.type !== "cut") {
    const durationInFrames = previous.transitionOut.durationInFrames;
    if (localFrame < durationInFrames) {
      const eased = interpolate(localFrame, [0, durationInFrames], [0, 1], {
        ...clamp,
        easing: transitionEasing,
      });
      return boundedTransitionState(
        previous.transitionOut,
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
    transformOrigin: `${state.anchor.x * 100}% ${state.anchor.y * 100}%`,
  };
};
