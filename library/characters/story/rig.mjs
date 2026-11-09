// Story rig: an original faceless figure in side view, drawn as path layers
// in nested groups so each limb turns about its joint. Colours are plain
// layer fills, so a pattern parameter can recolour the figure without new
// artwork. Run `node rig.mjs` to print the pose table.
//
// Rig space is 400 × 800 units, facing right, feet on y 790. Every part
// uses the full rig frame, so every group's bounds are the rig frame and a
// joint's pivot is simply its rig coordinate divided by the rig size.

export const RIG = { width: 400, height: 800 };

const JOINTS = {
  neck: [200, 200],
  shoulder: [200, 238],
  elbow: [200, 362],
  hip: [200, 470],
  knee: [200, 620],
  feet: [200, 790],
};

/** Joint angles in degrees for a figure facing right; forward is negative. */
export const LEGS = {
  stand: { legN: 0, shinN: 0, legF: 0, shinF: 0, dy: 0 },
  walk: { legN: -22, shinN: 12, legF: 20, shinF: 16, dy: 8 },
  sit: { legN: -88, shinN: 88, legF: -82, shinF: 82, dy: 148 },
};

export const UPPERS = {
  rest: { lean: 0, head: 0, armN: 4, foreN: -4, armF: -4, foreF: -6 },
  walk: { lean: 3, head: 0, armN: 18, foreN: -12, armF: -18, foreF: -14 },
  knees: { lean: -2, head: 4, armN: 2, foreN: -52, armF: -2, foreF: -50 },
  phone: { lean: 6, head: 20, armN: -32, foreN: -108, armF: -26, foreF: -112 },
  "head-down": { lean: 10, head: 34, armN: 2, foreN: -8, armF: -2, foreF: -10 },
  point: { lean: -2, head: -6, armN: -84, foreN: -6, armF: 6, foreF: -6 },
  "hand-on-head": {
    lean: 4,
    head: 10,
    armN: -116,
    foreN: -100,
    armF: 4,
    foreF: -6,
  },
  hug: { lean: 8, head: 18, armN: -62, foreN: -72, armF: -58, foreF: -70 },
};

/** The standard poses: legs plus upper body. */
export const POSES = {
  stand: { legs: "stand", upper: "rest" },
  walk: { legs: "walk", upper: "walk" },
  sit: { legs: "sit", upper: "knees" },
  "hold-phone": { legs: "sit", upper: "phone" },
  "head-down": { legs: "sit", upper: "head-down" },
  point: { legs: "stand", upper: "point" },
  "hand-on-head": { legs: "stand", upper: "hand-on-head" },
  hug: { legs: "stand", upper: "hug" },
};

export const DEFAULT_COLORS = {
  skin: "#C98B62",
  hair: "#5A3A2A",
  shirt: "#BC6049",
  pants: "#3F5A73",
  shoes: "#292D41",
  ink: "#292D41",
};

const round = (value) => Math.round(value * 10) / 10;

/** A path builder whose x coordinates mirror for a figure facing left. */
const pathFor = (facing) => {
  const fx = (x) => round(facing === "left" ? RIG.width - x : x);
  const fy = round;
  const flip = facing === "left";
  return {
    capsule(x, y1, y2, width) {
      const r = width / 2;
      return `M${fx(x - r)} ${fy(y1)}A${r} ${r} 0 0 1 ${fx(x + r)} ${fy(y1)}L${fx(x + r)} ${fy(y2)}A${r} ${r} 0 0 1 ${fx(x - r)} ${fy(y2)}Z`.replace(
        /0 0 1/g,
        flip ? "0 0 0" : "0 0 1",
      );
    },
    circle(x, y, r) {
      return `M${fx(x - r)} ${fy(y)}A${r} ${r} 0 1 0 ${fx(x + r)} ${fy(y)}A${r} ${r} 0 1 0 ${fx(x - r)} ${fy(y)}Z`;
    },
    poly(points, close = true) {
      return (
        points
          .map((point, index) => {
            if (point[0] === "Q") {
              return `Q${fx(point[1])} ${fy(point[2])} ${fx(point[3])} ${fy(point[4])}`;
            }
            return `${index === 0 ? "M" : "L"}${fx(point[0])} ${fy(point[1])}`;
          })
          .join("") + (close ? "Z" : "")
      );
    },
  };
};

/**
 * The layers of one figure. `id` prefixes every layer id; `x`, `y` and
 * `scale` place the rig frame in design pixels (top-left of the 400 × 800
 * rig space); `facing` is "right" or "left"; `pose` names a standard pose
 * or gives `{legs, upper}`. Returns layers and the ids worth animating.
 */
export const rigLayers = ({
  id,
  x,
  y,
  scale = 1,
  facing = "right",
  pose = "stand",
  colors = {},
  zIndex = 10,
  extraForeN = [],
  extraForeF = [],
  stepFps,
}) => {
  const paint = { ...DEFAULT_COLORS, ...colors };
  const resolved = typeof pose === "string" ? POSES[pose] : pose;
  if (!resolved) throw new Error(`Unknown pose ${pose}`);
  const legs = LEGS[resolved.legs];
  const upper = UPPERS[resolved.upper];
  const sign = facing === "left" ? -1 : 1;
  const p = pathFor(facing);
  const frame = {
    x: round(x),
    y: round(y + legs.dy * scale),
    width: round(RIG.width * scale),
    height: round(RIG.height * scale),
  };
  const stroke = { color: paint.ink, width: 5 };
  const part = (suffix, d, fill, z) => ({
    id: `${id}-${suffix}`,
    type: "path",
    d,
    viewBox: { minX: 0, minY: 0, width: RIG.width, height: RIG.height },
    frame,
    stroke,
    fill,
    lineCap: "round",
    opacity: 1,
    rotationDeg: 0,
    zIndex: z,
  });
  const pivot = (joint) => ({
    x:
      Math.round(
        ((facing === "left" ? RIG.width - JOINTS[joint][0] : JOINTS[joint][0]) /
          RIG.width) *
          10000,
      ) / 10000,
    y: Math.round((JOINTS[joint][1] / RIG.height) * 10000) / 10000,
  });
  const group = (suffix, memberIds, joint, rotationDeg, z) => ({
    id: `${id}-${suffix}`,
    type: "group",
    memberIds,
    transform: {
      x: 0,
      y: 0,
      scale: 1,
      rotationDeg: round(sign * rotationDeg),
      opacity: 1,
    },
    zIndex: z,
    pivot: pivot(joint),
  });
  const [, sy] = JOINTS.shoulder;
  const [, ey] = JOINTS.elbow;
  const [, hy] = JOINTS.hip;
  const [, ky] = JOINTS.knee;
  const ax = 200;
  const layers = [
    // Far leg and near leg.
    part("thigh-f", p.capsule(ax, hy, ky, 54), paint.pants, 1),
    part("shin-f", p.capsule(ax, ky, 752, 46), paint.pants, 1),
    part(
      "shoe-f",
      p.poly([
        [176, 742],
        [222, 742],
        ["Q", 262, 752, 264, 776],
        [264, 790],
        [176, 790],
      ]),
      paint.shoes,
      2,
    ),
    group("lower-f", [`${id}-shin-f`, `${id}-shoe-f`], "knee", legs.shinF, 2),
    group("leg-f", [`${id}-thigh-f`, `${id}-lower-f`], "hip", legs.legF, 1),
    part("thigh-n", p.capsule(ax, hy, ky, 58), paint.pants, 1),
    part("shin-n", p.capsule(ax, ky, 752, 50), paint.pants, 1),
    part(
      "shoe-n",
      p.poly([
        [174, 742],
        [222, 742],
        ["Q", 264, 752, 266, 776],
        [266, 792],
        [174, 792],
      ]),
      paint.shoes,
      2,
    ),
    group("lower-n", [`${id}-shin-n`, `${id}-shoe-n`], "knee", legs.shinN, 2),
    group("leg-n", [`${id}-thigh-n`, `${id}-lower-n`], "hip", legs.legN, 2),
    // Far arm.
    part("upperarm-f", p.capsule(ax, sy, ey, 40), paint.shirt, 1),
    part("forearm-f", p.capsule(ax, ey, 468, 32), paint.skin, 1),
    part("hand-f", p.circle(ax, 484, 21), paint.skin, 2),
    group(
      "fore-f",
      [`${id}-forearm-f`, `${id}-hand-f`, ...extraForeF],
      "elbow",
      upper.foreF,
      2,
    ),
    group(
      "arm-f",
      [`${id}-upperarm-f`, `${id}-fore-f`],
      "shoulder",
      upper.armF,
      1,
    ),
    // Torso.
    part(
      "torso",
      p.poly([
        [158, 236],
        ["Q", 160, 206, 200, 204],
        ["Q", 246, 206, 250, 250],
        ["Q", 258, 330, 248, 420],
        ["Q", 244, 486, 200, 492],
        ["Q", 150, 488, 148, 430],
        ["Q", 146, 320, 158, 236],
      ]),
      paint.shirt,
      2,
    ),
    // Head: neck, skull and hair. No face.
    part("neck", p.capsule(204, 172, 214, 34), paint.skin, 1),
    part("skull", p.circle(208, 128, 62), paint.skin, 2),
    part(
      "hair",
      p.poly([
        [150, 150],
        ["Q", 136, 84, 190, 66],
        ["Q", 250, 54, 270, 108],
        ["Q", 236, 92, 214, 100],
        ["Q", 186, 112, 182, 150],
        ["Q", 170, 176, 150, 150],
      ]),
      paint.hair,
      3,
    ),
    group(
      "head",
      [`${id}-neck`, `${id}-skull`, `${id}-hair`],
      "neck",
      upper.head,
      3,
    ),
    // Near arm, in front of the torso.
    part("upperarm-n", p.capsule(ax, sy, ey, 44), paint.shirt, 1),
    part("forearm-n", p.capsule(ax, ey, 468, 36), paint.skin, 1),
    part("hand-n", p.circle(ax, 486, 23), paint.skin, 2),
    group(
      "fore-n",
      [`${id}-forearm-n`, `${id}-hand-n`, ...extraForeN],
      "elbow",
      upper.foreN,
      2,
    ),
    group(
      "arm-n",
      [`${id}-upperarm-n`, `${id}-fore-n`],
      "shoulder",
      upper.armN,
      4,
    ),
    group(
      "upper",
      [`${id}-arm-f`, `${id}-torso`, `${id}-head`, `${id}-arm-n`],
      "hip",
      upper.lean,
      3,
    ),
    {
      ...group(
        "",
        [`${id}-leg-f`, `${id}-leg-n`, `${id}-upper`],
        "feet",
        0,
        zIndex,
      ),
      id,
      ...(stepFps ? { stepFps } : {}),
    },
  ];
  /** A rig-space point (unposed) in design pixels. */
  const place = ([px, py]) => ({
    x: frame.x + (facing === "left" ? RIG.width - px : px) * scale,
    y: frame.y + py * scale,
  });
  return { layers, frame, place };
};

const rotateAbout = ([x, y], deg, [cx, cy]) => {
  const t = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(t) - dy * Math.sin(t),
    cy + dx * Math.sin(t) + dy * Math.cos(t),
  ];
};

/**
 * Where a rig-space point carried by `chain` ("hand-n", "hand-f", "head" or
 * "torso") ends up once the figure takes `pose`, in rig space facing right.
 */
export const posedPoint = (pose, chain, point) => {
  const resolved = typeof pose === "string" ? POSES[pose] : pose;
  const upper = UPPERS[resolved.upper];
  let at = point;
  if (chain === "hand-n" || chain === "hand-f") {
    const near = chain === "hand-n";
    at = rotateAbout(at, near ? upper.foreN : upper.foreF, JOINTS.elbow);
    at = rotateAbout(at, near ? upper.armN : upper.armF, JOINTS.shoulder);
  }
  if (chain === "head") at = rotateAbout(at, upper.head, JOINTS.neck);
  return rotateAbout(at, upper.lean, JOINTS.hip);
};

/**
 * The `transform` beat value that turns a group to an absolute angle. A beat's
 * rotation is added to the group's static `transform.rotationDeg`, so a beat
 * writes the difference between the pose angle and that static angle.
 */
export const turnTo = (layers, id, absolute) => {
  const layer = layers.find((item) => item.id === id);
  if (!layer) throw new Error(`No layer ${id}`);
  const base =
    layer.type === "group" ? layer.transform.rotationDeg : layer.rotationDeg;
  return Math.round((absolute - base) * 10) / 10;
};

/** Group rotations that put a figure into a pose, for `transform` beats. */
export const poseAngles = (pose, facing = "right") => {
  const resolved = typeof pose === "string" ? POSES[pose] : pose;
  const legs = LEGS[resolved.legs];
  const upper = UPPERS[resolved.upper];
  const sign = facing === "left" ? -1 : 1;
  const angles = {
    "leg-f": legs.legF,
    "lower-f": legs.shinF,
    "leg-n": legs.legN,
    "lower-n": legs.shinN,
    upper: upper.lean,
    head: upper.head,
    "arm-f": upper.armF,
    "fore-f": upper.foreF,
    "arm-n": upper.armN,
    "fore-n": upper.foreN,
  };
  return Object.fromEntries(
    Object.entries(angles).map(([key, value]) => [key, round(sign * value)]),
  );
};

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const name of Object.keys(POSES)) {
    console.log(name, JSON.stringify(poseAngles(name)));
  }
}
