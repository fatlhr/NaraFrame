import type { CompiledDraft, Layer } from "@naraframe/core";
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
