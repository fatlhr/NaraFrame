import type { CompiledDraft, Frame, Issue, Layer } from "@naraframe/core";
import {
  compositionCheckpoints,
  qualityIssue,
  qualitySeverity,
  sourceFrameFor,
} from "@naraframe/core/composition-quality";
import {
  countedTextFor,
  drawProgressFor,
  planeTransformFor,
} from "./motion.js";

type Scene = CompiledDraft["scenes"][number];
type Leaf = Exclude<Layer, { type: "group" }>;
export type PaintState = {
  box: Frame;
  opacity: number;
  pose: readonly number[];
};
type Measure = (
  layer: Leaf,
  localFrame: number,
) => PaintState | null | undefined;

export const intersect = (a: Frame, b: Frame): Frame | null => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  return width > 0 && height > 0 ? { x, y, width, height } : null;
};

export const rectangleUnionArea = (boxes: Frame[]): number => {
  const xs = [
    ...new Set(boxes.flatMap((box) => [box.x, box.x + box.width])),
  ].sort((a, b) => a - b);
  let area = 0;
  xs.slice(0, -1).forEach((x, index) => {
    const next = xs[index + 1] ?? x;
    const spans = boxes
      .filter((box) => box.x < next && box.x + box.width > x)
      .sort((a, b) => a.y - b.y);
    let end = -Infinity;
    for (const span of spans) {
      area +=
        Math.max(0, span.y + span.height - Math.max(span.y, end)) * (next - x);
      end = Math.max(end, span.y + span.height);
    }
  });
  return area;
};

const leaves = (scene: Scene, ids: readonly string[]): Leaf[] => {
  const members = new Set(ids);
  for (const layer of scene.layers) {
    if (layer.type === "group" && members.has(layer.id)) {
      for (const id of layer.memberIds) members.add(id);
    }
  }
  return scene.layers.filter(
    (layer): layer is Leaf => layer.type !== "group" && members.has(layer.id),
  );
};

const titlesFor = (scene: Scene) =>
  scene.compositionQuality?.titleId
    ? [scene.compositionQuality.titleId]
    : scene.layers.flatMap((layer) =>
        layer.type === "text" &&
        (layer.role === "display" || layer.role === "heading") &&
        layer.text.trim()
          ? [layer.id]
          : [],
      );

type Activity = {
  states: string[];
  holds: { startFrame: number; endFrame: number; reason: string }[];
};

export const inspectCompositionScene = (
  draft: CompiledDraft,
  sceneIndex: number,
  measure: Measure,
): { issues: Issue[]; activity?: Activity } => {
  const scene = draft.scenes[sceneIndex];
  const stage = draft.compositionQualityStage;
  if (!scene || !stage) return { issues: [] };
  const policy = draft.profile.render.compositionQuality;
  const active = (rule: Parameters<typeof qualitySeverity>[2]) =>
    qualitySeverity(draft.profile.render, stage, rule) !== "off";
  const issues: Issue[] = [];
  const annotation = scene.compositionQuality;
  const titles = titlesFor(scene);
  const hero = annotation?.heroIds ?? [];
  const frames = scene.endFrame - scene.startFrame;
  const detail = (localFrame: number) => {
    const frame = scene.startFrame + localFrame;
    const sourceFrame = sourceFrameFor(draft, frame);
    return {
      sceneId: scene.id,
      frame,
      sourceFrame,
      localMs: (localFrame * 1000) / draft.fps,
      globalMs: sourceFrame === null ? null : (sourceFrame * 1000) / draft.fps,
    };
  };

  if (active("opening") && sceneIndex === 0) {
    if (sourceFrameFor(draft, 0) !== 0) {
      issues.push(
        ...qualityIssue(
          draft,
          "opening",
          "pending",
          "This scope does not establish the global opening frame.",
          "Review the full opening.",
          detail(0),
        ),
      );
    } else {
      const titleStates = leaves(scene, titles).map((layer) =>
        measure(layer, 0),
      );
      const heroStates = leaves(scene, hero)
        .filter((layer) => !titles.includes(layer.id))
        .map((layer) => measure(layer, 0));
      const visible = titleStates.some(Boolean) && heroStates.some(Boolean);
      const unknown =
        scene.visual.type !== "composition" ||
        (!titleStates.some(Boolean) && titleStates.includes(undefined)) ||
        (!heroStates.some(Boolean) && heroStates.includes(undefined));
      issues.push(
        ...qualityIssue(
          draft,
          "opening",
          unknown ? "unverified" : "checked",
          visible
            ? "Title and hero are visible at global frame 0."
            : "The title and a separate hero could not both be verified at global frame 0.",
          "Give the title and designated hero a visible pose before any reveal.",
          { ...detail(0), titleIds: titles, heroIds: hero, visible },
          !visible,
        ),
      );
    }
  }

  if (policy?.hero && active("hero")) {
    const { safeZone } = draft.profile.render;
    const safe = {
      x: safeZone.left,
      y: safeZone.top,
      width: draft.width - safeZone.left - safeZone.right,
      height: draft.height - safeZone.top - safeZone.bottom,
    };
    for (const checkpoint of compositionCheckpoints(draft, sceneIndex)) {
      if (checkpoint.reason === "composition-arriving") continue;
      const ids =
        (checkpoint.beatId
          ? annotation?.heroByBeat?.[checkpoint.beatId]
          : undefined) ?? hero;
      const localFrame =
        checkpoint.frame === null ? null : checkpoint.frame - scene.startFrame;
      const details = {
        sceneId: scene.id,
        beatId: checkpoint.beatId,
        heroIds: ids,
        threshold: policy.hero.minRatio,
        reason: checkpoint.reason,
      };
      const targets = leaves(scene, ids);
      const states =
        localFrame === null
          ? []
          : targets.map((layer) => measure(layer, localFrame));
      if (
        localFrame === null ||
        states.includes(undefined) ||
        !targets.length ||
        safe.width <= 0 ||
        safe.height <= 0
      ) {
        issues.push(
          ...qualityIssue(
            draft,
            "hero",
            "unverified",
            localFrame === null
              ? `Scene ${scene.id} has no eligible settled frame for this checkpoint.`
              : `Scene ${scene.id} has no verifiable hero footprint at frame ${checkpoint.frame}.`,
            "Designate supported hero parts and leave a stable frame before the next motion or seam.",
            { ...details, ...(localFrame === null ? {} : detail(localFrame)) },
          ),
        );
        continue;
      }
      const boxes = states.flatMap((state) => {
        const box = state && intersect(state.box, safe);
        return box ? [box] : [];
      });
      const ratio = rectangleUnionArea(boxes) / (safe.width * safe.height);
      issues.push(
        ...qualityIssue(
          draft,
          "hero",
          "checked",
          `Scene ${scene.id} hero footprint is ${(ratio * 100).toFixed(1)}% at frame ${checkpoint.frame}.`,
          "Reframe the designated hero within the safe area.",
          { ...details, ...detail(localFrame), ratio },
          ratio < policy.hero.minRatio,
        ),
      );
    }
  }

  const activityIds = [
    ...new Set([
      ...titles,
      ...hero,
      ...(annotation?.activityIds ?? []),
      ...Object.values(annotation?.heroByBeat ?? {}).flat(),
    ]),
  ];
  const targets = leaves(scene, activityIds);
  if (policy?.camera && active("camera")) {
    const allowed = policy.camera.allowStatic && annotation?.staticReason;
    let displacement = 0;
    let unknown = scene.visual.type !== "composition";
    const groups = scene.layers.filter((layer) => layer.type === "group");
    for (const target of targets) {
      const group = groups.find((layer) => layer.memberIds.includes(target.id));
      const owner = group ?? target;
      if (owner.space !== "world" || owner.parallax === 0) continue;
      for (const move of scene.camera?.moves ?? []) {
        const from = move.startFrame;
        const to = Math.min(frames - 1, from + move.durationInFrames);
        let reference: ReturnType<typeof planeTransformFor> | undefined;
        for (let frame = from; frame <= to; frame++) {
          const state = measure(target, frame);
          if (!state) {
            if (state === undefined) unknown = true;
            reference = undefined;
            continue;
          }
          const plane = planeTransformFor(
            draft,
            scene,
            owner.space,
            owner.parallax,
            frame,
            group?.billboard,
          );
          if (!reference) {
            reference = plane;
            continue;
          }
          const x =
            (state.box.x +
              state.box.width / 2 -
              plane.originX -
              plane.translateX) /
            plane.scale;
          const y =
            (state.box.y +
              state.box.height / 2 -
              plane.originY -
              plane.translateY) /
            plane.scale;
          const zoom = plane.scale - reference.scale;
          displacement = Math.max(
            displacement,
            Math.hypot(
              plane.translateX - reference.translateX + x * zoom,
              plane.translateY - reference.translateY + y * zoom,
            ),
            (Math.abs(zoom) * Math.max(state.box.width, state.box.height)) /
              (2 * plane.scale),
          );
        }
      }
    }
    const observed = (displacement * 1080) / draft.width;
    const failed = observed < policy.camera.minDisplacementPx;
    issues.push(
      ...qualityIssue(
        draft,
        "camera",
        !failed
          ? "checked"
          : allowed
            ? "exempt"
            : unknown
              ? "unverified"
              : "checked",
        `Scene ${scene.id} has ${observed.toFixed(2)} design px of measured camera displacement.`,
        "Move the camera relative to visible story content or declare a permitted static reason.",
        {
          sceneId: scene.id,
          layerIds: activityIds,
          observed,
          threshold: policy.camera.minDisplacementPx,
          staticReason: allowed || undefined,
        },
        failed && !allowed,
      ),
    );
  }

  if (!active("inactivity") || draft.scope.type !== "project")
    return { issues };
  if (scene.visual.type !== "composition") return { issues };
  const states: string[] = [];
  const assetKey = (id: string) => {
    const asset = draft.assets[id];
    return asset && "sha256" in asset ? asset.sha256 : id;
  };
  const key = (target: Leaf, localFrame: number, state: PaintState) => {
    const designScale = 1080 / draft.width;
    const quantize = (value: number) =>
      Math.round(value * designScale * 10) / 10;
    const geometry = [
      state.box.x,
      state.box.y,
      state.box.width,
      state.box.height,
    ].map(quantize);
    const content =
      target.type === "text"
        ? [
            countedTextFor(scene, target.id, localFrame) ?? target.text,
            target.color,
            target.spans,
          ]
        : target.type === "image"
          ? [
              assetKey(target.assetId),
              target.crop,
              target.fit,
              target.focalPoint,
            ]
          : target.type === "path"
            ? [
                target.d,
                target.stroke,
                target.fill,
                drawProgressFor(scene, target.id, localFrame),
              ]
            : [target.shape, target.fill, target.stroke];
    return [geometry, Math.round(state.opacity * 1000), state.pose, content];
  };
  for (let frame = 0; frame < frames; frame++) {
    const parts = targets.map((target) => {
      const state = measure(target, frame);
      return state ? key(target, frame, state) : state;
    });
    if (parts.includes(undefined)) return { issues };
    states.push(JSON.stringify(parts.filter(Boolean)));
  }
  return {
    issues,
    activity: {
      states,
      holds: policy?.inactivity?.allowReadingHolds
        ? (annotation?.readingHolds ?? [])
        : [],
    },
  };
};

export const inspectInactivity = (
  draft: CompiledDraft,
  scenes: (Activity | undefined)[],
): Issue[] => {
  const config = draft.profile.render.compositionQuality?.inactivity;
  if (
    !config ||
    !draft.compositionQualityStage ||
    qualitySeverity(
      draft.profile.render,
      draft.compositionQualityStage,
      "inactivity",
    ) === "off"
  )
    return [];
  if (draft.scope.type !== "project") {
    return qualityIssue(
      draft,
      "inactivity",
      "pending",
      "Inactivity requires the full timeline.",
      "Review a full preview.",
      {},
    );
  }
  if (scenes.some((scene) => scene === undefined)) {
    return qualityIssue(
      draft,
      "inactivity",
      "unverified",
      "Some scenes have unverified story activity.",
      "Use visible declarative story layers with measurable paint.",
      {
        sceneIds: draft.scenes
          .filter((_, index) => !scenes[index])
          .map((scene) => scene.id),
      },
    );
  }
  const changes = new Set<number>();
  const exemptions: Activity["holds"] = [];
  let previous = scenes[0]?.states[0];
  scenes.forEach((activity, index) => {
    const scene = draft.scenes[index];
    if (!scene || !activity) return;
    for (const [offset, state] of activity.states.entries()) {
      if (state !== previous) changes.add(scene.startFrame + offset);
      previous = state;
    }
    for (const hold of activity.holds)
      exemptions.push({
        ...hold,
        startFrame: hold.startFrame + scene.startFrame,
        endFrame: hold.endFrame + scene.startFrame,
      });
  });
  const gaps = (subtractHolds: boolean) => {
    const results: { startFrame: number; endFrame: number }[] = [];
    let start = 0;
    for (let frame = 0; frame <= draft.totalFrames; frame++) {
      const excluded =
        changes.has(frame) ||
        (subtractHolds &&
          exemptions.some(
            (hold) => frame >= hold.startFrame && frame < hold.endFrame,
          ));
      if (!excluded && frame !== draft.totalFrames) continue;
      if (frame > start) results.push({ startFrame: start, endFrame: frame });
      start = frame + 1;
    }
    return results;
  };
  const rawGaps = gaps(false);
  const remaining = gaps(true).sort(
    (a, b) => b.endFrame - b.startFrame - (a.endFrame - a.startFrame),
  );
  const longest = remaining[0];
  const longestMs = longest
    ? ((longest.endFrame - longest.startFrame) * 1000) / draft.fps
    : 0;
  return qualityIssue(
    draft,
    "inactivity",
    "checked",
    `The longest unexempted inactivity interval is ${longestMs.toFixed(1)} ms.`,
    "Check the reported interval for purposeful visual change or a justified reading hold.",
    { rawGaps, exemptions, longest, longestMs, threshold: config.maxMs },
    longestMs > config.maxMs,
  );
};
