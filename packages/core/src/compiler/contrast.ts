import type { Issue } from "../model/issue.js";
import type { RenderTokens } from "../schema/profile.js";
import type { Beat, Layer, Scene } from "../schema/scene.js";
import type { VarietyScene } from "./variety.js";

/**
 * WCAG 2.x relative-luminance contrast math. Pure color arithmetic — no
 * DOM, no canvas, no render — so it runs during `validate`, not only after
 * a full browser render.
 *
 * Text is judged against what can be painted under it while it is fully
 * shown, when source data alone decides that: the page background, and
 * opaque flat-fill rectangles and circles (and their strokes) whose fill
 * outline — rounded corners included — contains the text box, or never
 * touches it. Anything else leaves the contrast unverified and is reported
 * as such (`CONTRAST_UNVERIFIED`, info) instead of a ratio against a backdrop
 * the text may not be on: an image or SVG, a path, a translucent shape or
 * group, a shadow, a shape that fades while the text is fully shown, a text
 * box reaching past a curved edge, group motion, or a layer at another
 * camera depth that the camera brings under the text.
 *
 * Geometry is bounding boxes in design pixels, never glyphs. Moving layers
 * are bounded by the boxes they can reach: transform poses (cubic easing
 * never overshoots; a turning step is bounded by the disk it sweeps), follow
 * paths, and camera moves with the renderer's plane rule
 * screen = C + zoom^depth · (P − C) − depth · (x, y). The text's own fades,
 * reveal and exit drift and emphasize scale are transitions and not judged.
 */

const srgbChannelToLinear = (channel8Bit: number): number => {
  const channel = channel8Bit / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

const channels = (hexColor: string): [number, number, number] => [
  Number.parseInt(hexColor.slice(1, 3), 16),
  Number.parseInt(hexColor.slice(3, 5), 16),
  Number.parseInt(hexColor.slice(5, 7), 16),
];

const relativeLuminance = (hexColor: string): number => {
  const [r, g, b] = channels(hexColor);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
};

export const contrastRatio = (hexA: string, hexB: string): number => {
  const lighter = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const darker = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
};

/** Source-over compositing of `top` at `alpha` onto `bottom`, in sRGB as the browser does. */
const blend = (top: string, bottom: string, alpha: number): string => {
  const a = channels(top);
  const b = channels(bottom);
  return `#${a
    .map((value, index) =>
      Math.round(value * alpha + (b[index] ?? 0) * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

/** WCAG 2.x: 18pt/24px regular (or 14pt/~19px bold) counts as "large text". */
const LARGE_TEXT_PX = 24;
const CONTRAST_MINIMUM_LARGE_TEXT = 3;
const CONTRAST_MINIMUM_NORMAL_TEXT = 4.5;
/** Matches `spanStyleFor` in the renderer: a quiet run is painted at this opacity. */
const QUIET_SPAN_OPACITY = 0.62;

export const contrastThresholdFor = (fontSizePx: number): number =>
  fontSizePx >= LARGE_TEXT_PX
    ? CONTRAST_MINIMUM_LARGE_TEXT
    : CONTRAST_MINIMUM_NORMAL_TEXT;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Pose {
  x: number;
  y: number;
  zoom: number;
}

type TextLayer = Extract<Layer, { type: "text" }>;
type GroupLayer = Extract<Layer, { type: "group" }>;
type PaintedLayer = Exclude<Layer, { type: "group" | "text" }>;

const intersects = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const anyIntersect = (a: readonly Box[], b: readonly Box[]): boolean =>
  a.some((left) => b.some((right) => intersects(left, right)));

const contains = (outer: Box, inner: Box): boolean =>
  outer.x <= inner.x &&
  outer.y <= inner.y &&
  outer.x + outer.width >= inner.x + inner.width &&
  outer.y + outer.height >= inner.y + inner.height;

const union = (boxes: readonly Box[]): Box => {
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const grow = (box: Box, by: number): Box => ({
  x: box.x - by,
  y: box.y - by,
  width: box.width + 2 * by,
  height: box.height + 2 * by,
});

const inset = (box: Box, by: number): Box => ({
  x: box.x + by,
  y: box.y + by,
  width: Math.max(0, box.width - 2 * by),
  height: Math.max(0, box.height - 2 * by),
});

/** Axis-aligned box of a frame offset, turned and scaled about its centre. */
const posedBox = (
  frame: Box,
  pose: { x: number; y: number; scale: number; rotationDeg: number },
): Box => {
  const cx = frame.x + frame.width / 2 + pose.x;
  const cy = frame.y + frame.height / 2 + pose.y;
  const radians = (pose.rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const width = (frame.width * cos + frame.height * sin) * pose.scale;
  const height = (frame.width * sin + frame.height * cos) * pose.scale;
  return { x: cx - width / 2, y: cy - height / 2, width, height };
};

const pointBox = (x: number, y: number): Box => ({ x, y, width: 0, height: 0 });

const centreOf = (box: Box): { x: number; y: number } => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/** `box` scaled by `factor` about `anchor`. */
const scaleAbout = (
  box: Box,
  factor: number,
  anchor: { x: number; y: number },
): Box => ({
  x: anchor.x + (box.x - anchor.x) * factor,
  y: anchor.y + (box.y - anchor.y) * factor,
  width: box.width * factor,
  height: box.height * factor,
});

/**
 * Painting order, as the renderer composes a scene: each top-level layer and
 * each group is its own stacking context ordered by `zIndex`, ties by DOM
 * order (top-level layers first, then groups); inside a group, members order
 * by their own `zIndex`, ties by `memberIds` order.
 */
const paintKeys = (layers: readonly Layer[]): Map<string, number[]> => {
  const groups = layers.filter(
    (layer): layer is GroupLayer => layer.type === "group",
  );
  const grouped = new Set(groups.flatMap((group) => group.memberIds));
  const topLevel = layers.filter(
    (layer) => layer.type !== "group" && !grouped.has(layer.id),
  );
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  const keys = new Map<string, number[]>();
  topLevel.forEach((layer, index) => {
    keys.set(layer.id, [layer.zIndex ?? 0, index, 0, 0]);
  });
  groups.forEach((group, groupIndex) => {
    group.memberIds.forEach((memberId, memberIndex) => {
      const member = byId.get(memberId);
      if (!member || member.type === "group") return;
      keys.set(memberId, [
        group.zIndex ?? 0,
        topLevel.length + groupIndex,
        member.zIndex ?? 0,
        memberIndex,
      ]);
    });
  });
  return keys;
};

const paintedBelow = (a: readonly number[], b: readonly number[]): boolean => {
  for (let index = 0; index < a.length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference < 0;
  }
  return false;
};

type Plane =
  | { kind: "overlay" }
  | { kind: "world"; depth: number }
  | { kind: "billboard"; depth: number; point: { x: number; y: number } };

const planeKey = (plane: Plane, groupId: string | null): string =>
  plane.kind === "overlay"
    ? "overlay"
    : plane.kind === "world"
      ? `world:${plane.depth}`
      : `billboard:${groupId}`;

/**
 * When a layer shows, from its own and its group's `reveal` and `exit` beats,
 * in scene milliseconds: it is hidden before `appears`, fading until `full`,
 * fully shown until `fades`, fading until `gone`, then hidden.
 */
interface Visibility {
  animated: boolean;
  /** False when a reveal or exit is anchored to a phrase whose time is not known here. */
  timed: boolean;
  appears: number;
  full: number;
  fades: number;
  gone: number;
}

/** Boxes a layer can occupy, or why its motion is not bounded here. */
type Reach = { boxes: Box[] } | { unbounded: string };

interface Placement {
  groupId: string | null;
  plane: Plane;
  /** Where the layer can be as text, in its plane. The text's own emphasize is a transition and not included. */
  reach: Reach;
  /** The same, in its group's frame: the group's own motion is shared by its members. */
  local: Reach;
  /** Where the layer can be as a backdrop, including its emphasize scale. */
  backReach: Reach;
  backLocal: Reach;
  /** Whether an emphasize beat scales the layer, so its outline is not its frame's. */
  emphasized: boolean;
  /**
   * Whether its group's emphasize scales it about the group's centre, which
   * also moves it: its reach is a sweep, never a place it always covers.
   */
  groupScaled: boolean;
  /** Its opacity times its group's transform opacity. */
  opacity: number;
  visibility: Visibility;
}

const visibilityOf = (
  ids: readonly string[],
  beats: readonly Beat[],
  startsMs: readonly number[] | undefined,
): Visibility => {
  const visibility: Visibility = {
    animated: false,
    timed: true,
    appears: 0,
    full: 0,
    fades: Number.POSITIVE_INFINITY,
    gone: Number.POSITIVE_INFINITY,
  };
  beats.forEach((beat, index) => {
    if (!ids.includes(beat.targetId)) return;
    if (beat.action !== "reveal" && beat.action !== "exit") return;
    visibility.animated = true;
    const start = startsMs?.[index] ?? (beat.at ? undefined : beat.startMs);
    if (start === undefined) {
      visibility.timed = false;
      return;
    }
    const end = start + beat.durationMs;
    if (beat.action === "reveal") {
      visibility.appears = Math.max(visibility.appears, start);
      visibility.full = Math.max(visibility.full, end);
    } else {
      visibility.fades = Math.min(visibility.fades, start);
      visibility.gone = Math.min(visibility.gone, end);
    }
  });
  return visibility;
};

const groupIsDisplaced = (group: GroupLayer): boolean => {
  const transform = group.transform;
  return Boolean(
    transform &&
      (transform.x !== 0 ||
        transform.y !== 0 ||
        transform.scale !== 1 ||
        transform.rotationDeg !== 0),
  );
};

/**
 * The boxes a layer's pose can reach, one per step, in its group's frame when
 * `withinGroup` (the group's own motion is shared and cancels out) or in its
 * plane otherwise. The renderer adds the pose rotation to the layer's own
 * rotation and eases every property with a cubic curve, which never
 * overshoots. The centre is tracked as a region: a point while the pose is
 * known, the path's frame after a follow, and a band after a transform that
 * sets only one axis of a pose that was on a path.
 * - a transform that keeps the rotation from a known pose moves each edge
 *   monotonically, so the union of the two posed boxes bounds it;
 * - any other transform (it turns the layer, or starts from a centre region)
 *   is bounded by the disk the frame sweeps around the centre (half its
 *   diagonal, at the larger scale), over both centre regions;
 * - a follow keeps the centre on the path, inside the path's frame.
 * A layer whose first move is a follow already waits on that path. `focus`
 * moves its target in a way not modelled here, so a focused layer is
 * unbounded; so are members of a moving, displaced or focused group unless
 * `withinGroup`. As a backdrop, an emphasize beat scales the layer up about
 * its centre, which grows its boxes by the largest scale; as text, the
 * layer's own emphasize is a transition and is left out.
 */
const reachFor = (
  layer: PaintedLayer | TextLayer,
  group: GroupLayer | undefined,
  beats: readonly Beat[],
  byId: Map<string, Layer>,
  startsMs: readonly number[] | undefined,
  options: { withinGroup: boolean; asBackdrop: boolean },
): Reach => {
  const startOf = (beat: Beat) =>
    startsMs?.[beats.indexOf(beat)] ?? beat.startMs;
  const of = (targetId: string, actions: readonly Beat["action"][]) =>
    beats
      .filter(
        (beat) => beat.targetId === targetId && actions.includes(beat.action),
      )
      .sort((a, b) => startOf(a) - startOf(b));
  if (of(layer.id, ["focus"]).length > 0) {
    return {
      unbounded: `a focus beat moves ${layer.id}, which this check does not model`,
    };
  }
  if (group && !options.withinGroup) {
    const groupMoves = of(group.id, ["transform", "follow", "focus"]);
    if (groupIsDisplaced(group) || groupMoves.length > 0) {
      return {
        unbounded: `${layer.id} moves with its group ${group.id}, and group movement is not tracked here`,
      };
    }
  }
  const own = of(layer.id, ["transform", "follow"]);
  const frame = layer.frame;
  const base = layer.rotationDeg ?? 0;
  const halfDiagonal = Math.hypot(frame.width, frame.height) / 2;
  const centreX = frame.x + frame.width / 2;
  const centreY = frame.y + frame.height / 2;
  let pose = { x: 0, y: 0, scale: 1, rotationDeg: 0 };
  // Where the centre can be; a zero-size box while the pose is known.
  let centre: Box = pointBox(centreX, centreY);
  let rotationKnown = true;
  const boxes: Box[] =
    own[0]?.action === "follow"
      ? []
      : [posedBox(frame, { ...pose, rotationDeg: base })];
  for (const beat of own) {
    if (beat.action === "transform") {
      const to = beat.params.to;
      const next = {
        x: to.x ?? pose.x,
        y: to.y ?? pose.y,
        scale: to.scale ?? pose.scale,
        rotationDeg: to.rotationDeg ?? pose.rotationDeg,
      };
      // The axes the transform names move to their new place; the others
      // stay wherever the centre was.
      const target: Box = {
        x: to.x === undefined ? centre.x : centreX + to.x,
        width: to.x === undefined ? centre.width : 0,
        y: to.y === undefined ? centre.y : centreY + to.y,
        height: to.y === undefined ? centre.height : 0,
      };
      const known = centre.width === 0 && centre.height === 0;
      const turns =
        !rotationKnown ||
        (to.rotationDeg !== undefined && to.rotationDeg !== pose.rotationDeg);
      if (!known || turns) {
        const radius = halfDiagonal * Math.max(pose.scale, next.scale);
        boxes.push(union([grow(centre, radius), grow(target, radius)]));
      } else {
        boxes.push(
          union([
            posedBox(frame, { ...pose, rotationDeg: base + pose.rotationDeg }),
            posedBox(frame, { ...next, rotationDeg: base + next.rotationDeg }),
          ]),
        );
      }
      if (to.rotationDeg !== undefined) rotationKnown = true;
      pose = next;
      centre = target;
    } else if (beat.action === "follow") {
      const path = byId.get(beat.params.pathId);
      if (!path || path.type === "group") {
        return {
          unbounded: `${layer.id} follows a path this check cannot find`,
        };
      }
      boxes.push(grow(path.frame, halfDiagonal * pose.scale));
      centre = path.frame;
      if (beat.params.orient) rotationKnown = false;
    }
  }
  if (!options.asBackdrop) return { boxes };
  const largest = (targetId: string) =>
    Math.max(
      1,
      ...of(targetId, ["emphasize"]).map((beat) =>
        beat.action === "emphasize" ? beat.params.scale : 1,
      ),
    );
  // Scaling a box about its own centre bounds the layer scaled about its own
  // centre anywhere inside that box.
  const ownScale = largest(layer.id);
  let grown =
    ownScale === 1
      ? boxes
      : boxes.map((box) => scaleAbout(box, ownScale, centreOf(box)));
  if (group && !options.withinGroup) {
    // A group's emphasize scales its members about the centre of their
    // frames, as `GroupView` draws them; the members keep that relation.
    // The scale passes continuously through every value from 1 to its
    // largest, and each edge moves linearly with it, so the union of the
    // resting and largest boxes bounds the whole sweep, including the span
    // between two boxes that do not overlap.
    const factor = largest(group.id);
    if (factor > 1) {
      const members = group.memberIds.flatMap((id) => {
        const member = byId.get(id);
        return member && member.type !== "group" ? [member.frame] : [];
      });
      const anchor = centreOf(union(members));
      grown = grown.map((box) => union([box, scaleAbout(box, factor, anchor)]));
    }
  }
  return { boxes: grown };
};

const placementsFor = (
  layers: readonly Layer[],
  beats: readonly Beat[],
  startsMs: readonly number[] | undefined,
): Map<string, Placement> => {
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  const groupOf = new Map<string, GroupLayer>();
  for (const layer of layers) {
    if (layer.type !== "group") continue;
    for (const memberId of layer.memberIds) groupOf.set(memberId, layer);
  }
  const planeOf = (layer: Layer, group: GroupLayer | undefined): Plane => {
    const owner = group ?? layer;
    if (owner.space !== "world") return { kind: "overlay" };
    const depth = owner.parallax ?? 1;
    if (owner.type === "group" && owner.billboard) {
      return { kind: "billboard", depth, point: owner.billboard };
    }
    // Depth 0 never moves with the camera: it stays put like an overlay.
    return depth === 0 ? { kind: "overlay" } : { kind: "world", depth };
  };
  const placements = new Map<string, Placement>();
  for (const layer of layers) {
    if (layer.type === "group") continue;
    const group = groupOf.get(layer.id);
    placements.set(layer.id, {
      groupId: group?.id ?? null,
      plane: planeOf(layer, group),
      reach: reachFor(layer, group, beats, byId, startsMs, {
        withinGroup: false,
        asBackdrop: false,
      }),
      local: reachFor(layer, group, beats, byId, startsMs, {
        withinGroup: true,
        asBackdrop: false,
      }),
      backReach: reachFor(layer, group, beats, byId, startsMs, {
        withinGroup: false,
        asBackdrop: true,
      }),
      backLocal: reachFor(layer, group, beats, byId, startsMs, {
        withinGroup: true,
        asBackdrop: true,
      }),
      emphasized: beats.some(
        (beat) =>
          beat.action === "emphasize" &&
          beat.targetId === layer.id &&
          beat.params.scale > 1,
      ),
      groupScaled: Boolean(
        group &&
          beats.some(
            (beat) =>
              beat.action === "emphasize" &&
              beat.targetId === group.id &&
              beat.params.scale > 1,
          ),
      ),
      opacity: (layer.opacity ?? 1) * (group?.transform?.opacity ?? 1),
      visibility: visibilityOf(
        group ? [layer.id, group.id] : [layer.id],
        beats,
        startsMs,
      ),
    });
  }
  return placements;
};

/** The camera's poses in order: the initial pose, then where each move ends. */
const cameraPoses = (scene: Scene): Pose[] => {
  const camera = scene.camera;
  if (!camera) return [{ x: 0, y: 0, zoom: 1 }];
  return [camera.initial, ...camera.moves.map((move) => move.to)];
};

const cameraMovesIn = (scene: Scene): boolean => {
  const poses = cameraPoses(scene);
  return poses.some((pose) => pose.x !== 0 || pose.y !== 0 || pose.zoom !== 1);
};

/**
 * Range over one camera move of g(t) = zoom(t)^depth · a − depth · shift(t),
 * with zoom and shift interpolated linearly (as the renderer does). Its
 * extremes are at the ends or where g'(t) = 0.
 */
const rangeOver = (
  from: { zoom: number; shift: number },
  to: { zoom: number; shift: number },
  depth: number,
  a: number,
): [number, number] => {
  const g = (zoom: number, shift: number) => zoom ** depth * a - depth * shift;
  const values = [g(from.zoom, from.shift), g(to.zoom, to.shift)];
  const dz = to.zoom - from.zoom;
  const ds = to.shift - from.shift;
  if (depth !== 0 && depth !== 1 && dz !== 0 && a !== 0) {
    const ratio = ds / (dz * a);
    if (ratio > 0) {
      const zoom = ratio ** (1 / (depth - 1));
      const t = (zoom - from.zoom) / dz;
      if (t > 0 && t < 1) values.push(g(zoom, from.shift + ds * t));
    }
  }
  return [Math.min(...values), Math.max(...values)];
};

/**
 * Screen boxes a plane box can occupy while the camera goes through its poses,
 * one per camera move. A billboard keeps its size and rides its pin point.
 */
const onScreen = (
  box: Box,
  plane: Plane,
  poses: readonly Pose[],
  canvas: { width: number; height: number },
): Box[] => {
  if (plane.kind === "overlay") return [box];
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const first = poses[0] ?? { x: 0, y: 0, zoom: 1 };
  const steps: [Pose, Pose][] =
    poses.length < 2
      ? [[first, first]]
      : poses.slice(1).map((to, index) => [poses[index] ?? first, to]);
  return steps.map(([from, to]) => {
    const axis = (
      low: number,
      high: number,
      centre: number,
      key: "x" | "y",
    ): [number, number] => {
      const ends = {
        from: { zoom: from.zoom, shift: from[key] },
        to: { zoom: to.zoom, shift: to[key] },
      };
      if (plane.kind === "billboard") {
        const pin = plane.point[key];
        const [min, max] = rangeOver(
          ends.from,
          ends.to,
          plane.depth,
          pin - centre,
        );
        // Screen = box edge + (centre + g − pin).
        return [low + centre + min - pin, high + centre + max - pin];
      }
      const [lowMin] = rangeOver(ends.from, ends.to, plane.depth, low - centre);
      const [, highMax] = rangeOver(
        ends.from,
        ends.to,
        plane.depth,
        high - centre,
      );
      return [centre + lowMin, centre + highMax];
    };
    const [left, right] = axis(box.x, box.x + box.width, cx, "x");
    const [top, bottom] = axis(box.y, box.y + box.height, cy, "y");
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
};

type Backdrop =
  | {
      kind: "known";
      /** Every flat colour the text can be read against, with what painted it. */
      colors: { color: string; source: string }[];
    }
  | { kind: "unknown"; reason: string };

/** Whether `box` lies inside a rectangle whose corners are rounded by `radius`. */
const roundedRectCovers = (frame: Box, radius: number, box: Box): boolean => {
  if (!contains(frame, box)) return false;
  // CSS scales a uniform radius down to fit the shorter side.
  const r = Math.min(radius, frame.width / 2, frame.height / 2);
  if (r <= 0) return true;
  const clamp = (value: number, low: number, high: number) =>
    Math.min(Math.max(value, low), high);
  // The shape is convex, so its four corners decide.
  return [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].every(([px = 0, py = 0]) => {
    const nearestX = clamp(px, frame.x + r, frame.x + frame.width - r);
    const nearestY = clamp(py, frame.y + r, frame.y + frame.height - r);
    return (px - nearestX) ** 2 + (py - nearestY) ** 2 <= r * r;
  });
};

/**
 * Whether any of `box` overlaps a shape's fill: a rectangle rounded by
 * `radius` (the inner rectangle grown by a disk of that radius) or the
 * ellipse inscribed in `frame`.
 */
const fillTouches = (
  shape: "rectangle" | "circle",
  frame: Box,
  radius: number,
  box: Box,
): boolean => {
  if (!intersects(frame, box)) return false;
  if (shape === "circle") {
    const cx = frame.x + frame.width / 2;
    const cy = frame.y + frame.height / 2;
    // In units of the radii the ellipse is a unit circle and the box stays a box.
    const nx =
      (Math.min(Math.max(cx, box.x), box.x + box.width) - cx) /
      (frame.width / 2);
    const ny =
      (Math.min(Math.max(cy, box.y), box.y + box.height) - cy) /
      (frame.height / 2);
    return nx * nx + ny * ny < 1;
  }
  const r = Math.min(radius, frame.width / 2, frame.height / 2);
  if (r <= 0) return true;
  const inner = inset(frame, r);
  const dx = Math.max(
    0,
    inner.x - (box.x + box.width),
    box.x - (inner.x + inner.width),
  );
  const dy = Math.max(
    0,
    inner.y - (box.y + box.height),
    box.y - (inner.y + inner.height),
  );
  return dx * dx + dy * dy < r * r;
};

const ellipseCovers = (frame: Box, box: Box): boolean => {
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const rx = frame.width / 2;
  const ry = frame.height / 2;
  return [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].every(
    ([px = 0, py = 0]) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1,
  );
};

interface SceneGeometry {
  keys: Map<string, number[]>;
  placements: Map<string, Placement>;
  poses: Pose[];
  cameraMoves: boolean;
  canvas: { width: number; height: number } | undefined;
}

/**
 * What the text is read against, walking down from the nearest layer painted
 * under it. An opaque flat shape that covers the text ends the walk; one that
 * only partly covers it adds its colour and lets the layers below show too.
 */
const backdropFor = (
  text: TextLayer,
  layers: readonly Layer[],
  geometry: SceneGeometry,
  render: RenderTokens,
): Backdrop => {
  const { keys, placements, poses, cameraMoves, canvas } = geometry;
  const textKey = keys.get(text.id);
  const textPlace = placements.get(text.id);
  if (!textKey || !textPlace) {
    return { kind: "unknown", reason: "its layer order could not be read" };
  }

  const under = layers
    .filter(
      (layer): layer is PaintedLayer =>
        layer.type !== "group" &&
        layer.type !== "text" &&
        paintedBelow(keys.get(layer.id) ?? [], textKey),
    )
    .sort((a, b) =>
      paintedBelow(keys.get(a.id) ?? [], keys.get(b.id) ?? []) ? 1 : -1,
    );

  const colors: { color: string; source: string }[] = [];
  for (const layer of under) {
    const place = placements.get(layer.id);
    if (!place) continue;
    const shadow = "shadow" in layer ? layer.shadow : undefined;
    const shadowOf = (box: Box): Box | null =>
      shadow && shadow.opacity > 0
        ? grow(
            {
              ...box,
              x: box.x + shadow.offsetX,
              y: box.y + shadow.offsetY,
            },
            shadow.blur,
          )
        : null;

    let textBoxes: Box[];
    let layerBoxes: Box[];
    let layerStill: boolean;
    if (textPlace.groupId !== null && textPlace.groupId === place.groupId) {
      // The group's own motion moves both alike; each member's own beats
      // still move it within the group.
      if ("unbounded" in textPlace.local) {
        return { kind: "unknown", reason: textPlace.local.unbounded };
      }
      if ("unbounded" in place.backLocal) {
        return { kind: "unknown", reason: place.backLocal.unbounded };
      }
      textBoxes = textPlace.local.boxes;
      layerBoxes = place.backLocal.boxes;
      layerStill = place.backLocal.boxes.length === 1;
    } else {
      if ("unbounded" in textPlace.reach) {
        return { kind: "unknown", reason: textPlace.reach.unbounded };
      }
      if ("unbounded" in place.backReach) {
        return { kind: "unknown", reason: place.backReach.unbounded };
      }
      const textReach = textPlace.reach.boxes;
      const layerReach = place.backReach.boxes;
      const samePlane =
        planeKey(textPlace.plane, textPlace.groupId) ===
        planeKey(place.plane, place.groupId);
      if (cameraMoves && !samePlane) {
        // Different depths slide past each other: the text can only be
        // judged when the layer never reaches it on screen.
        const reachOf = (boxes: readonly Box[]) =>
          boxes.flatMap((box) => [
            box,
            ...(shadowOf(box) ? [shadowOf(box) as Box] : []),
          ]);
        if (!canvas) {
          return {
            kind: "unknown",
            reason: `layer ${layer.id} is at another camera depth and the design canvas is not known`,
          };
        }
        const textScreen = textReach.flatMap((box) =>
          onScreen(box, textPlace.plane, poses, canvas),
        );
        const layerScreen = reachOf(layerReach).flatMap((box) =>
          onScreen(box, place.plane, poses, canvas),
        );
        if (!anyIntersect(textScreen, layerScreen)) continue;
        return {
          kind: "unknown",
          reason: `the camera moves ${layer.type} ${layer.id} under it from another depth`,
        };
      }
      textBoxes = textReach;
      layerBoxes = layerReach;
      // A swept reach is where the layer can be, not where it always is.
      layerStill = layerReach.length === 1 && !place.groupScaled;
    }

    const shadows = layerBoxes.flatMap((box) => {
      const cast = shadowOf(box);
      return cast ? [cast] : [];
    });
    if (!anyIntersect(textBoxes, [...layerBoxes, ...shadows])) continue;

    // A layer that is never visible, or never visible while the text is fully
    // shown, is not its backdrop; one that fades while the text is fully
    // shown leaves a blend. The text's own fades are transitions, not the
    // state it is read in, and are not judged.
    if (place.opacity === 0) continue;
    const shows = place.visibility;
    if (shows.animated) {
      const seen = textPlace.visibility;
      if (!shows.timed || !seen.timed) {
        return {
          kind: "unknown",
          reason: `${layer.type} ${layer.id} fades in or out at a time that is not known here`,
        };
      }
      if (seen.fades <= shows.appears || seen.full >= shows.gone) continue;
      if (seen.full < shows.full || seen.fades > shows.fades) {
        return {
          kind: "unknown",
          reason: `${layer.type} ${layer.id} fades in or out while the text is visible`,
        };
      }
    }

    if (layer.type === "image") {
      return {
        kind: "unknown",
        reason: `image ${layer.id} lies under it, and image pixels are not analysed`,
      };
    }
    if (layer.type === "path") {
      return {
        kind: "unknown",
        reason: `path ${layer.id} crosses under it, and path coverage is not analysed`,
      };
    }
    if (place.opacity < 1) {
      return {
        kind: "unknown",
        reason: `translucent shape ${layer.id} lies under it`,
      };
    }
    const unrotated = (layer.rotationDeg ?? 0) % 360 === 0;
    const radius = layer.cornerRadius ?? 0;
    const covers = (frame: Box, box: Box, inner = 0) =>
      layer.shape === "rectangle"
        ? roundedRectCovers(frame, Math.max(0, radius - inner), box)
        : ellipseCovers(frame, box);
    const covered =
      layerStill &&
      unrotated &&
      textBoxes.every((box) => covers(layer.frame, box));
    // For a still shape the fill's own outline decides: rounded corners and
    // the area of a circle's frame outside the circle are not fill.
    // An emphasize scales the fill up about its centre: coverage of the
    // frame still holds, but where its outline reaches is only its boxes.
    const exact = layerStill && unrotated && !place.emphasized;
    const touching =
      !exact ||
      textBoxes.some((box) =>
        fillTouches(layer.shape, layer.frame, radius, box),
      );
    if (
      exact &&
      !covered &&
      touching &&
      textBoxes.every((box) => contains(layer.frame, box))
    ) {
      // Inside the shape's frame but reaching past its curved edge: the
      // glyphs may sit on the fill or on what shows through, which boxes
      // cannot tell apart.
      return {
        kind: "unknown",
        reason: `its box reaches past the curved edge of ${layer.shape === "circle" ? "circle" : "panel"} ${layer.id}`,
      };
    }
    if (!covered && anyIntersect(textBoxes, shadows)) {
      return {
        kind: "unknown",
        reason: `the shadow of ${layer.id} falls under it`,
      };
    }
    if (!touching || !anyIntersect(textBoxes, layerBoxes)) continue;
    colors.push({
      color: layer.fill,
      source: `${layer.shape === "circle" ? "circle" : "panel"} ${layer.id}`,
    });
    const stroke = layer.stroke;
    if (stroke && stroke.width > 0) {
      const inner = inset(layer.frame, stroke.width);
      const clear =
        covered && textBoxes.every((box) => covers(inner, box, stroke.width));
      if (!clear) {
        colors.push({
          color: stroke.color,
          source: `the stroke of ${layer.id}`,
        });
      }
    }
    if (covered) return { kind: "known", colors };
  }
  colors.push({ color: render.palette.background, source: "the background" });
  return { kind: "known", colors };
};

/** Every colour the layer's glyphs are painted in, as seen over `backdrop`. */
const inkColorsOver = (
  text: TextLayer,
  opacity: number,
  backdrop: string,
  render: RenderTokens,
): { color: string; run: string }[] => {
  const base = text.color ?? render.palette.text;
  const seen = (color: string, alpha = 1) =>
    blend(color, backdrop, alpha * opacity);
  const inks = [{ color: seen(base), run: "" }];
  for (const span of text.spans ?? []) {
    if (span.emphasis === "accent") {
      inks.push({
        color: seen(render.palette.accent),
        run: ` (accent run "${span.text.trim()}")`,
      });
    } else if (span.emphasis === "quiet") {
      inks.push({
        color: seen(base, QUIET_SPAN_OPACITY),
        run: ` (quiet run "${span.text.trim()}")`,
      });
    }
  }
  return inks;
};

/** Runs unconditionally (not gated by scope): a contrast defect on a single
 * scene is real whether or not the rest of the project is compiled with it.
 * `canvas` is the design canvas; without it, text over a layer at another
 * camera depth is left unverified. */
export const checkContrast = (
  entries: VarietyScene[],
  render: RenderTokens,
  canvas?: { width: number; height: number },
): Issue[] => {
  const issues: Issue[] = [];
  entries.forEach(({ scene, sceneIndex, resolvedLayers, beatStartsMs }) => {
    const geometry: SceneGeometry = {
      keys: paintKeys(resolvedLayers),
      placements: placementsFor(resolvedLayers, scene.beats, beatStartsMs),
      poses: cameraPoses(scene),
      cameraMoves: cameraMovesIn(scene),
      canvas,
    };
    resolvedLayers.forEach((layer, layerIndex) => {
      if (layer.type !== "text") return;
      const path = `/scenes/${sceneIndex}/visual/layers/${layerIndex}`;
      const opacity = geometry.placements.get(layer.id)?.opacity ?? 1;
      if (opacity === 0) return;
      const backdrop = backdropFor(layer, resolvedLayers, geometry, render);
      if (backdrop.kind === "unknown") {
        issues.push({
          code: "CONTRAST_UNVERIFIED",
          severity: "info",
          responsible: "agent",
          artifact: "scenes.json",
          path,
          entityId: layer.id,
          message: `Contrast of text layer ${layer.id} in scene ${scene.id} is not checked: ${backdrop.reason}.`,
          suggestion:
            "Confirm it is legible in the preview frames, or put an opaque flat-colour panel under the text, with the text box inside the panel's straight edges and the panel shown for as long as the text, so its contrast can be checked.",
        });
        return;
      }
      const fontSize = layer.fontSize ?? 34;
      const threshold = contrastThresholdFor(fontSize);
      let worst: { ratio: number; source: string; run: string } | null = null;
      for (const { color, source } of backdrop.colors) {
        for (const ink of inkColorsOver(layer, opacity, color, render)) {
          const ratio = contrastRatio(ink.color, color);
          if (!worst || ratio < worst.ratio) {
            worst = { ratio, source, run: ink.run };
          }
        }
      }
      if (worst && worst.ratio < threshold) {
        issues.push({
          code: "CONTRAST_INSUFFICIENT",
          severity: "warning",
          responsible: "agent",
          artifact: "scenes.json",
          path,
          entityId: layer.id,
          message: `Text layer ${layer.id}${worst.run} in scene ${scene.id} has a ${worst.ratio.toFixed(2)}:1 contrast ratio against ${worst.source}, below the ${threshold}:1 WCAG minimum for its size.`,
          suggestion:
            fontSize >= LARGE_TEXT_PX
              ? "Choose a text or backdrop color with more contrast."
              : "Choose a text or backdrop color with more contrast, or size the text at or above 24px to use the large-text threshold.",
        });
      }
    });
  });
  return issues;
};
