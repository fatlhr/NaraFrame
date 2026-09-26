import type { CompiledDraft, Issue, Layer } from "@naraframe/core";
import { measureText } from "@remotion/layout-utils";
import { captionLayoutFor } from "./captions.js";
import {
  type GroupTransform,
  groupScreenTransformFor,
  motionStateFor,
  planeTransformFor,
  type SceneTransitionState,
  sceneTransitionStateFor,
} from "./motion.js";
import { fontFamilyForRole } from "./typography.js";

export const visualPreflightProperty = "__naraframeVisualPreflight";

export interface VisualPreflightFrame {
  frame: number;
  sceneId: string;
  reasons: string[];
}

export interface VisualPreflightReport {
  issues: Issue[];
  frames: VisualPreflightFrame[];
}

export type DraftWithVisualPreflight = CompiledDraft & {
  [visualPreflightProperty]?: VisualPreflightReport;
};

interface TextMetrics {
  fontSize: number;
  lines: string[];
  contentHeight: number;
  overflow: boolean;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const issueFor = (
  code: string,
  sceneIndex: number,
  layerIndex: number,
  layerId: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "scenes.json",
  path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}`,
  entityId: layerId,
  message,
  suggestion,
});

const textStyle = (layer: Extract<Layer, { type: "text" }>) => ({
  fontSize: layer.fontSize ?? 34,
  fontWeight: layer.fontWeight ?? 700,
  lineHeight: layer.lineHeight ?? 1.15,
  letterSpacing: layer.letterSpacing ?? 0,
  padding: layer.padding ?? { top: 0, right: 0, bottom: 0, left: 0 },
  maxLines: layer.maxLines ?? 20,
  overflowPolicy: layer.overflowPolicy ?? "error",
});

/**
 * The weight a character is actually painted in. An accented or strong run is
 * set heavier than the rest of the headline, so measuring the whole string at
 * one weight under-reports its width and lets a line overflow unnoticed.
 * Kept in step with `spanStyleFor` in the renderer.
 */
const spanWeights = (
  layer: Extract<Layer, { type: "text" }>,
  baseWeight: number,
): number[] => {
  const weights = new Array<number>(layer.text.length).fill(baseWeight);
  if (!layer.spans) return weights;
  let cursor = 0;
  for (const span of layer.spans) {
    const weight =
      span.emphasis === "accent"
        ? Math.min(900, baseWeight + 100)
        : span.emphasis === "strong"
          ? Math.min(900, baseWeight + 200)
          : baseWeight;
    for (let index = 0; index < span.text.length; index += 1) {
      weights[cursor + index] = weight;
    }
    cursor += span.text.length;
  }
  return weights;
};

const measureWidth = (
  text: string,
  draft: CompiledDraft,
  layer: Extract<Layer, { type: "text" }>,
  fontSize: number,
  weightsByCharacter?: number[],
): number => {
  const fontFamily = fontFamilyForRole(draft.profile.render, layer.role);
  const letterSpacing = `${layer.letterSpacing ?? 0}px`;
  const baseWeight = layer.fontWeight ?? 700;
  if (!weightsByCharacter) {
    return measureText({
      text,
      fontFamily,
      fontSize,
      fontWeight: baseWeight,
      letterSpacing,
    }).width;
  }
  // Measure each run at the weight it is painted in, then add the widths.
  let total = 0;
  let run = "";
  let runWeight = weightsByCharacter[0] ?? baseWeight;
  const flush = () => {
    if (!run) return;
    total += measureText({
      text: run,
      fontFamily,
      fontSize,
      fontWeight: runWeight,
      letterSpacing,
    }).width;
    run = "";
  };
  for (let index = 0; index < text.length; index += 1) {
    const weight = weightsByCharacter[index] ?? baseWeight;
    if (weight !== runWeight) {
      flush();
      runWeight = weight;
    }
    run += text[index];
  }
  flush();
  return total;
};

/** Splits a paragraph into words, carrying each word's per-character weights. */
const wordsWithWeights = (
  paragraph: string,
  weights: number[],
  offset: number,
): Array<{ text: string; weights: number[] }> => {
  const words: Array<{ text: string; weights: number[] }> = [];
  let index = 0;
  while (index < paragraph.length) {
    if (/\s/u.test(paragraph[index] ?? "")) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < paragraph.length && !/\s/u.test(paragraph[index] ?? "")) {
      index += 1;
    }
    words.push({
      text: paragraph.slice(start, index),
      weights: weights.slice(offset + start, offset + index),
    });
  }
  return words;
};

const wrapText = (
  text: string,
  withinWidth: number,
  draft: CompiledDraft,
  layer: Extract<Layer, { type: "text" }>,
  fontSize: number,
  weights?: number[],
): { lines: string[]; unbreakableOverflow: boolean } => {
  const lines: string[] = [];
  let unbreakableOverflow = false;
  const baseWeight = layer.fontWeight ?? 700;
  let paragraphOffset = 0;
  for (const paragraph of text.split("\n")) {
    const offset = paragraphOffset;
    paragraphOffset += paragraph.length + 1;
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }
    const words = weights
      ? wordsWithWeights(paragraph, weights, offset)
      : paragraph
          .trim()
          .split(/\s+/u)
          .map((word) => ({ text: word, weights: [] as number[] }));
    let line = "";
    let lineWeights: number[] = [];
    for (const word of words) {
      const candidate = line ? `${line} ${word.text}` : word.text;
      const candidateWeights = weights
        ? line
          ? [...lineWeights, baseWeight, ...word.weights]
          : [...word.weights]
        : undefined;
      if (
        measureWidth(candidate, draft, layer, fontSize, candidateWeights) <=
        withinWidth
      ) {
        line = candidate;
        lineWeights = candidateWeights ?? [];
        continue;
      }
      if (line) lines.push(line);
      if (
        measureWidth(
          word.text,
          draft,
          layer,
          fontSize,
          weights ? word.weights : undefined,
        ) > withinWidth
      ) {
        unbreakableOverflow = true;
      }
      line = word.text;
      lineWeights = [...word.weights];
    }
    if (line) lines.push(line);
  }
  return { lines, unbreakableOverflow };
};

const metricsAt = (
  draft: CompiledDraft,
  layer: Extract<Layer, { type: "text" }>,
  fontSize: number,
): TextMetrics => {
  const style = textStyle(layer);
  const width = layer.frame.width - style.padding.left - style.padding.right;
  const height = layer.frame.height - style.padding.top - style.padding.bottom;
  if (width <= 0 || height <= 0) {
    return { fontSize, lines: [], contentHeight: 0, overflow: true };
  }
  const wrapped = wrapText(
    layer.text,
    width,
    draft,
    layer,
    fontSize,
    layer.spans ? spanWeights(layer, layer.fontWeight ?? 700) : undefined,
  );
  const contentHeight = wrapped.lines.length * fontSize * style.lineHeight;
  return {
    fontSize,
    lines: wrapped.lines,
    contentHeight,
    overflow:
      wrapped.unbreakableOverflow ||
      wrapped.lines.length > style.maxLines ||
      contentHeight > height + 0.5,
  };
};

const fitText = (
  draft: CompiledDraft,
  layer: Extract<Layer, { type: "text" }>,
): TextMetrics => {
  const style = textStyle(layer);
  const minimum = draft.profile.render.typography.minimumFontSize ?? 14;
  const first = metricsAt(draft, layer, style.fontSize);
  if (!first.overflow || style.overflowPolicy === "error") return first;
  for (let size = Math.floor(style.fontSize - 1); size >= minimum; size -= 1) {
    const candidate = metricsAt(draft, layer, size);
    if (!candidate.overflow) return candidate;
  }
  return metricsAt(draft, layer, minimum);
};

const textRectangle = (
  layer: Extract<Layer, { type: "text" }>,
  metrics: TextMetrics,
): Rectangle => {
  const padding = textStyle(layer).padding;
  const availableHeight = layer.frame.height - padding.top - padding.bottom;
  const verticalOffset = {
    top: 0,
    center: Math.max(0, (availableHeight - metrics.contentHeight) / 2),
    bottom: Math.max(0, availableHeight - metrics.contentHeight),
  }[layer.verticalAlign ?? "center"];
  return {
    x: layer.frame.x + padding.left,
    y: layer.frame.y + padding.top + verticalOffset,
    width: layer.frame.width - padding.left - padding.right,
    height: Math.min(availableHeight, metrics.contentHeight),
  };
};

const transformedRectangle = (
  rectangle: Rectangle,
  state: ReturnType<typeof motionStateFor>,
  bounds: Rectangle = rectangle,
  rotationDeg = 0,
): Rectangle =>
  applyGroupTransform(
    rectangle,
    {
      ...state,
      rotationDeg: rotationDeg + state.rotationDeg,
      anchorX: state.anchor.x,
      anchorY: state.anchor.y,
    },
    bounds,
  );

const intersects = (left: Rectangle, right: Rectangle): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

/**
 * Mirrors `GroupView`'s member-bounding-box math (draft-video.tsx) so the
 * transform-origin used here matches what the renderer actually applies.
 */
const groupBoundsFor = (
  scene: CompiledDraft["scenes"][number],
  group: Extract<Layer, { type: "group" }>,
): Rectangle => {
  const layersById = new Map(scene.layers.map((layer) => [layer.id, layer]));
  const members = group.memberIds.flatMap((memberId) => {
    const member = layersById.get(memberId);
    return member && member.type !== "group" ? [member] : [];
  });
  if (members.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const left = Math.min(...members.map((member) => member.frame.x));
  const top = Math.min(...members.map((member) => member.frame.y));
  const right = Math.max(
    ...members.map((member) => member.frame.x + member.frame.width),
  );
  const bottom = Math.max(
    ...members.map((member) => member.frame.y + member.frame.height),
  );
  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * Folds a parent group's static transform + beat motion into a member's
 * already-transformed rectangle, so collision checks happen at the position
 * the layer actually renders at (see VF/M0.9.7 group-transform fix). Rotation
 * is handled by taking the axis-aligned bounding box of the rotated corners,
 * which never under-reports a real collision.
 */
const applyGroupTransform = (
  rectangle: Rectangle,
  transform: GroupTransform,
  bounds: Rectangle,
): Rectangle => {
  const originX = bounds.x + transform.anchorX * bounds.width;
  const originY = bounds.y + transform.anchorY * bounds.height;
  const radians = (transform.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners: Array<[number, number]> = [
    [rectangle.x, rectangle.y],
    [rectangle.x + rectangle.width, rectangle.y],
    [rectangle.x, rectangle.y + rectangle.height],
    [rectangle.x + rectangle.width, rectangle.y + rectangle.height],
  ];
  const points = corners.map(([pointX, pointY]) => {
    const localX = (pointX - originX) * transform.scale;
    const localY = (pointY - originY) * transform.scale;
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;
    return [
      originX + rotatedX + transform.translateX,
      originY + rotatedY + transform.translateY,
    ] as const;
  });
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
};

/**
 * Folds a scene-boundary transition (M0.10.2) into a rectangle the same way
 * `applyGroupTransform` folds a group's transform: the transition scales the
 * whole scene around an anchor fraction of the full canvas, so any layer's
 * rectangle checked during an active transition window must move with it.
 * `clipPath` (mask-reveal) is deliberately not folded — it clips paint, not
 * layout, so it cannot hide a real collision from this geometry check.
 */
const applySceneTransition = (
  rectangle: Rectangle,
  state: SceneTransitionState,
  width: number,
  height: number,
): Rectangle => {
  if (state.scale === 1 && state.translateX === 0 && state.translateY === 0) {
    return rectangle;
  }
  const originX = state.anchor.x * width;
  const originY = state.anchor.y * height;
  const x = originX + (rectangle.x - originX) * state.scale + state.translateX;
  const y = originY + (rectangle.y - originY) * state.scale + state.translateY;
  return {
    x,
    y,
    width: rectangle.width * state.scale,
    height: rectangle.height * state.scale,
  };
};

const captionIssue = (
  code: string,
  path: string,
  message: string,
  suggestion: string,
  entityId?: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "narration.json",
  path,
  ...(entityId ? { entityId } : {}),
  message,
  suggestion,
});

const framesForScene = (
  scene: CompiledDraft["scenes"][number],
): VisualPreflightFrame[] => {
  const local = new Map<number, string[]>();
  const add = (frame: number, reason: string) => {
    const bounded = Math.max(
      0,
      Math.min(scene.endFrame - scene.startFrame - 1, frame),
    );
    const reasons = local.get(bounded) ?? [];
    if (!reasons.includes(reason)) reasons.push(reason);
    local.set(bounded, reasons);
  };
  const duration = scene.endFrame - scene.startFrame;
  add(0, "scene-entry");
  add(Math.floor(duration * 0.25), "scene-settled");
  add(duration - 1, "scene-final");
  scene.beats.forEach((beat) => {
    add(beat.startFrame, `beat-start:${beat.id}`);
    add(
      beat.startFrame + Math.floor(beat.durationInFrames / 2),
      `beat-peak:${beat.id}`,
    );
    add(beat.startFrame + beat.durationInFrames, `beat-settled:${beat.id}`);
  });
  scene.camera?.moves.forEach((move) => {
    add(move.startFrame, `camera-start:${move.id}`);
    add(
      move.startFrame + Math.floor(move.durationInFrames / 2),
      `camera-mid:${move.id}`,
    );
    add(move.startFrame + move.durationInFrames, `camera-settled:${move.id}`);
  });
  return [...local.entries()].map(([frame, reasons]) => ({
    frame: scene.startFrame + frame,
    sceneId: scene.id,
    reasons: reasons.sort(),
  }));
};

/**
 * A panel is a filled shape used as a backdrop. Dead space is a band of it
 * that no content sits on: the eye reads it as an unfinished layout, and it
 * is the flaw the owner hit on the Krakatau map scene, where the panel ran
 * a third of its height below the map it was holding.
 */
const DEAD_SPACE_FRACTION = 0.2;

const panelMargins = (
  panel: Rectangle,
  content: Rectangle,
): Array<{ side: string; gap: number; fraction: number }> => [
  {
    side: "top",
    gap: content.y - panel.y,
    fraction: (content.y - panel.y) / panel.height,
  },
  {
    side: "bottom",
    gap: panel.y + panel.height - (content.y + content.height),
    fraction:
      (panel.y + panel.height - (content.y + content.height)) / panel.height,
  },
  {
    side: "left",
    gap: content.x - panel.x,
    fraction: (content.x - panel.x) / panel.width,
  },
  {
    side: "right",
    gap: panel.x + panel.width - (content.x + content.width),
    fraction:
      (panel.x + panel.width - (content.x + content.width)) / panel.width,
  },
];

const overlaps = (a: Rectangle, b: Rectangle): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const unionOf = (rectangles: Rectangle[]): Rectangle | null => {
  if (rectangles.length === 0) return null;
  const left = Math.min(...rectangles.map((r) => r.x));
  const top = Math.min(...rectangles.map((r) => r.y));
  const right = Math.max(...rectangles.map((r) => r.x + r.width));
  const bottom = Math.max(...rectangles.map((r) => r.y + r.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * Reports a filled panel whose content leaves one side far emptier than a
 * padding would explain. Painted-under layers do not count: an opaque panel
 * hides them.
 */
const panelDeadSpace = (
  scene: CompiledDraft["scenes"][number],
  sceneIndex: number,
): Issue[] => {
  const issues: Issue[] = [];
  const frameOf = (layer: Layer): Rectangle | null => {
    if (layer.type === "group") {
      return unionOf(
        layer.memberIds.flatMap((memberId) => {
          const member = scene.layers.find(
            (candidate) => candidate.id === memberId,
          );
          const rectangle =
            member && member.type !== "group" ? member.frame : null;
          return rectangle ? [rectangle] : [];
        }),
      );
    }
    return layer.frame;
  };

  scene.layers.forEach((panel, panelIndex) => {
    if (
      panel.type !== "shape" ||
      panel.shape !== "rectangle" ||
      (panel.opacity ?? 1) < 0.9
    ) {
      return;
    }
    const above = scene.layers.flatMap((layer, index) => {
      if (index === panelIndex) return [];
      const higher =
        (layer.zIndex ?? 0) > (panel.zIndex ?? 0) ||
        ((layer.zIndex ?? 0) === (panel.zIndex ?? 0) && index > panelIndex);
      if (!higher) return [];
      const rectangle = frameOf(layer);
      return rectangle && overlaps(rectangle, panel.frame) ? [rectangle] : [];
    });
    const content = unionOf(above);
    if (!content) return;
    const worst = panelMargins(panel.frame, content)
      .filter((margin) => margin.fraction > DEAD_SPACE_FRACTION)
      .sort((a, b) => b.fraction - a.fraction)[0];
    if (!worst) return;
    issues.push({
      ...issueFor(
        "PANEL_DEAD_SPACE",
        sceneIndex,
        panelIndex,
        panel.id,
        `Panel ${panel.id} leaves ${Math.round(worst.fraction * 100)}% of itself empty along its ${worst.side} edge (${Math.round(worst.gap)} px with nothing on it).`,
        "Size the panel to the content it holds, or put something in that band.",
      ),
      severity: "warning",
    });
  });
  return issues;
};

export const resolveVisualPreflight = (
  input: CompiledDraft,
  loadedFontFamilies: ReadonlySet<string> = new Set(),
): { draft: CompiledDraft; report: VisualPreflightReport } => {
  const draft = structuredClone(input);
  const issues: Issue[] = [];
  const frames = draft.scenes.flatMap(framesForScene);
  const captions = draft.captions;

  captions?.cues.forEach((cue) => {
    const midpoint = Math.floor((cue.startFrame + cue.endFrame) / 2);
    const scene = draft.scenes.find(
      (candidate) =>
        midpoint >= candidate.startFrame && midpoint < candidate.endFrame,
    );
    if (!scene) return;
    const reason = `caption:${cue.id}`;
    const existing = frames.find(
      (item) => item.frame === midpoint && item.sceneId === scene.id,
    );
    if (existing) existing.reasons = [...existing.reasons, reason].sort();
    else frames.push({ frame: midpoint, sceneId: scene.id, reasons: [reason] });
  });

  if (captions) {
    const fontLoaded = document.fonts.check(
      `${captions.style.fontSize}px ${draft.profile.render.typography.fontFamily}`,
    );
    if (!fontLoaded) {
      issues.push(
        captionIssue(
          "FONT_NOT_LOADED",
          "/captions",
          "The caption font was not loaded before measurement.",
          "Provision the profile font locally and wait for it before previewing.",
        ),
      );
    } else {
      captions.cues.forEach((cue, cueIndex) => {
        const layout = captionLayoutFor(draft, captions.style, cue.text);
        if (
          layout.unbreakableOverflow ||
          layout.lines.length > captions.style.maxLines
        ) {
          issues.push(
            captionIssue(
              "CAPTION_OVERFLOW",
              `/captions/cues/${cueIndex}`,
              `Caption ${cue.id} needs ${layout.lines.length} lines but the profile allows ${captions.style.maxLines}.`,
              "Split the spoken phrase into shorter sentences, or lower render.captions.fontSize / raise render.captions.maxLines in the profile.",
              cue.id,
            ),
          );
        }
      });
    }
  }

  draft.scenes.forEach((scene, sceneIndex) => {
    issues.push(...panelDeadSpace(scene, sceneIndex));
    const textMetrics = new Map<string, TextMetrics>();
    scene.layers.forEach((layer, layerIndex) => {
      if (layer.type === "image") {
        const radius = layer.cornerRadius ?? 0;
        if (radius > Math.min(layer.frame.width, layer.frame.height) / 2) {
          issues.push(
            issueFor(
              "IMAGE_MASK_INVALID",
              sceneIndex,
              layerIndex,
              layer.id,
              `Image ${layer.id} corner radius exceeds half of its shortest edge.`,
              "Reduce cornerRadius so the rendered mask matches the declared geometry.",
            ),
          );
        }
        return;
      }
      if (layer.type !== "text") return;

      const fontSize = layer.fontSize ?? 34;
      const fontFamily = fontFamilyForRole(draft.profile.render, layer.role);
      const isBundledFamily = draft.fonts.some(
        (font) => font.family === fontFamily,
      );
      const bundledFontLoaded =
        !isBundledFamily || loadedFontFamilies.has(fontFamily);
      const fontLoaded =
        bundledFontLoaded &&
        document.fonts.check(`${fontSize}px ${fontFamily}`);
      if (!fontLoaded) {
        issues.push(
          issueFor(
            "FONT_NOT_LOADED",
            sceneIndex,
            layerIndex,
            layer.id,
            `The font for text layer ${layer.id} was not loaded before measurement.`,
            "Provision the profile font locally and wait for it before previewing.",
          ),
        );
        return;
      }

      const metrics = fitText(draft, layer);
      textMetrics.set(layer.id, metrics);
      if (!metrics.overflow && metrics.fontSize !== fontSize) {
        layer.fontSize = metrics.fontSize;
      }
      if (!metrics.overflow) return;

      const minimum = draft.profile.render.typography.minimumFontSize ?? 14;
      const code =
        layer.overflowPolicy === "shrink" && metrics.fontSize <= minimum
          ? "MIN_FONT_SIZE_VIOLATION"
          : "TEXT_OVERFLOW";
      issues.push(
        issueFor(
          code,
          sceneIndex,
          layerIndex,
          layer.id,
          `Text layer ${layer.id} does not fit its ${layer.frame.width}x${layer.frame.height} box within ${layer.maxLines ?? 20} lines.`,
          code === "TEXT_OVERFLOW"
            ? "Shorten the copy, enlarge its box, increase maxLines, or explicitly use bounded shrink."
            : `Shorten the copy or enlarge its box; the profile minimum is ${minimum}px.`,
        ),
      );
    });

    const textLayers = scene.layers.filter(
      (layer): layer is Extract<Layer, { type: "text" }> =>
        layer.type === "text" && textMetrics.has(layer.id),
    );
    const groups = scene.layers.filter(
      (layer): layer is Extract<Layer, { type: "group" }> =>
        layer.type === "group",
    );
    const parentGroupOf = new Map<string, Extract<Layer, { type: "group" }>>();
    groups.forEach((group) => {
      group.memberIds.forEach((memberId) => {
        parentGroupOf.set(memberId, group);
      });
    });
    const groupBoundsById = new Map(
      groups.map((group) => [group.id, groupBoundsFor(scene, group)]),
    );
    const rectangleOnScreen = (
      layerId: string,
      rectangle: Rectangle,
      localFrame: number,
    ): Rectangle => {
      const group = parentGroupOf.get(layerId);
      const withGroup = (() => {
        if (!group) return rectangle;
        const transform = groupScreenTransformFor(
          draft,
          scene,
          group,
          localFrame,
        );
        const bounds = groupBoundsById.get(group.id);
        if (!bounds) return rectangle;
        return applyGroupTransform(rectangle, transform, bounds);
      })();
      const planeOwner =
        group ?? scene.layers.find((layer) => layer.id === layerId);
      const plane = planeTransformFor(
        draft,
        scene,
        planeOwner?.space,
        planeOwner?.parallax,
        localFrame,
      );
      const withPlane = {
        x:
          plane.originX +
          (withGroup.x - plane.originX) * plane.scale +
          plane.translateX,
        y:
          plane.originY +
          (withGroup.y - plane.originY) * plane.scale +
          plane.translateY,
        width: withGroup.width * plane.scale,
        height: withGroup.height * plane.scale,
      };
      const sceneState = sceneTransitionStateFor(draft, sceneIndex, localFrame);
      return applySceneTransition(
        withPlane,
        sceneState,
        draft.width,
        draft.height,
      );
    };
    const opacityOnScreen = (
      layerId: string,
      ownOpacity: number,
      localFrame: number,
    ): number => {
      const group = parentGroupOf.get(layerId);
      const withGroup = group
        ? ownOpacity *
          groupScreenTransformFor(draft, scene, group, localFrame).opacity
        : ownOpacity;
      const sceneState = sceneTransitionStateFor(draft, sceneIndex, localFrame);
      return withGroup * sceneState.opacity;
    };
    const checkedCaptionPairs = new Set<string>();
    if (captions) {
      for (const frame of frames.filter((item) => item.sceneId === scene.id)) {
        const localFrame = frame.frame - scene.startFrame;
        for (const cue of captions.cues) {
          if (frame.frame < cue.startFrame || frame.frame >= cue.endFrame)
            continue;
          const captionBox = captionLayoutFor(
            draft,
            captions.style,
            cue.text,
          ).box;
          for (const layer of textLayers) {
            const metrics = textMetrics.get(layer.id);
            if (!metrics || metrics.overflow) continue;
            const state = motionStateFor(draft, scene, layer.id, localFrame);
            if (
              opacityOnScreen(
                layer.id,
                layer.opacity * state.opacity,
                localFrame,
              ) < 0.9
            )
              continue;
            const layerRectangle = rectangleOnScreen(
              layer.id,
              transformedRectangle(
                textRectangle(layer, metrics),
                state,
                layer.frame,
                layer.rotationDeg,
              ),
              localFrame,
            );
            const pair = `${cue.id}:${layer.id}`;
            if (
              checkedCaptionPairs.has(pair) ||
              !intersects(captionBox, layerRectangle)
            )
              continue;
            checkedCaptionPairs.add(pair);
            issues.push(
              captionIssue(
                "CAPTION_COLLISION",
                `/captions/cues/${captions.cues.indexOf(cue)}`,
                `Caption ${cue.id} covers text layer ${layer.id} in scene ${scene.id} at frame ${frame.frame}.`,
                "Move the scene text above the caption zone, shorten it, or lower render.captions.bottomOffset in the profile.",
                cue.id,
              ),
            );
          }
        }
      }
    }
    const checkedPairs = new Set<string>();
    const checkedClipping = new Set<string>();
    for (const frame of frames.filter((item) => item.sceneId === scene.id)) {
      const localFrame = frame.frame - scene.startFrame;
      textLayers.forEach((left, leftIndex) => {
        const leftMetrics = textMetrics.get(left.id);
        if (!leftMetrics || leftMetrics.overflow) return;
        const leftState = motionStateFor(draft, scene, left.id, localFrame);
        if (
          opacityOnScreen(
            left.id,
            left.opacity * leftState.opacity,
            localFrame,
          ) < 0.9
        )
          return;
        const leftRectangle = rectangleOnScreen(
          left.id,
          transformedRectangle(
            textRectangle(left, leftMetrics),
            leftState,
            left.frame,
            left.rotationDeg,
          ),
          localFrame,
        );
        if (
          (scene.camera ||
            scene.beats.some((beat) => beat.action === "transform")) &&
          !checkedClipping.has(left.id) &&
          (leftRectangle.x < -0.5 ||
            leftRectangle.y < -0.5 ||
            leftRectangle.x + leftRectangle.width > draft.width + 0.5 ||
            leftRectangle.y + leftRectangle.height > draft.height + 0.5)
        ) {
          checkedClipping.add(left.id);
          issues.push(
            issueFor(
              "TEXT_OUTSIDE_CANVAS",
              sceneIndex,
              scene.layers.indexOf(left),
              left.id,
              `Text layer ${left.id} is outside the canvas at frame ${frame.frame}.`,
              "Adjust camera framing or object travel so required text remains visible.",
            ),
          );
        }

        const targets = new Set([
          ...textLayers.slice(leftIndex + 1).map((layer) => layer.id),
          ...(left.avoidLayerIds ?? []),
        ]);
        targets.forEach((targetId) => {
          const target = scene.layers.find((layer) => layer.id === targetId);
          if (!target || target.type === "group") return;
          const pair = [left.id, target.id].sort().join(":");
          if (checkedPairs.has(pair)) return;
          const targetState = motionStateFor(
            draft,
            scene,
            target.id,
            localFrame,
          );
          if (
            opacityOnScreen(
              target.id,
              target.opacity * targetState.opacity,
              localFrame,
            ) < 0.9
          )
            return;
          const targetMetrics =
            target.type === "text" ? textMetrics.get(target.id) : undefined;
          const targetRectangle = rectangleOnScreen(
            target.id,
            transformedRectangle(
              target.type === "text" && targetMetrics
                ? textRectangle(target, targetMetrics)
                : target.frame,
              targetState,
              target.frame,
              target.rotationDeg,
            ),
            localFrame,
          );
          if (!intersects(leftRectangle, targetRectangle)) return;
          checkedPairs.add(pair);
          issues.push(
            issueFor(
              "TEXT_COLLISION",
              sceneIndex,
              scene.layers.findIndex((layer) => layer.id === left.id),
              left.id,
              `Text layer ${left.id} collides with ${target.id} at frame ${frame.frame}.`,
              "Adjust the declared layout, copy length, padding, or avoid targets and preview again.",
            ),
          );
        });
      });
    }
  });

  return {
    draft,
    report: {
      issues: issues.sort(
        (left, right) =>
          left.path.localeCompare(right.path) ||
          left.code.localeCompare(right.code),
      ),
      frames: frames.sort((left, right) => left.frame - right.frame),
    },
  };
};
