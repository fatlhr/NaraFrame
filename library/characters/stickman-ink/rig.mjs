// Stickman Ink rig: an original ink stick figure in side view, drawn as
// stroke-only path layers in nested groups so each limb turns about its
// joint. The head is an image layer, so a `swap` beat changes the face.
// Run `node rig.mjs` to print the pose table.
//
// Rig space is 200 × 400 units, facing right, feet on y 390. Every limb uses
// the full rig frame, so every group's bounds are the rig frame and a joint's
// pivot is its rig coordinate divided by the rig size.

export const RIG = { width: 200, height: 400 };

export const JOINTS = {
  neck: [100, 104],
  shoulder: [100, 116],
  elbow: [100, 180],
  hip: [98, 220],
  knee: [98, 304],
  feet: [98, 390],
};

/** Joint angles in degrees for a figure facing right; forward is negative. */
export const LEGS = {
  stand: { legN: -3, shinN: 0, legF: 4, shinF: 0 },
  walk: { legN: -24, shinN: 14, legF: 22, shinF: 18 },
  brace: { legN: -30, shinN: 6, legF: 26, shinF: -4 },
  crouch: { legN: -74, shinN: 116, legF: -64, shinF: 110 },
};

export const UPPERS = {
  rest: { lean: 0, head: 0, armN: 6, foreN: -6, armF: -6, foreF: -8 },
  walk: { lean: 4, head: 0, armN: 22, foreN: -18, armF: -22, foreF: -16 },
  notice: { lean: 10, head: 8, armN: -20, foreN: -40, armF: -12, foreF: -30 },
  reach: { lean: 12, head: -4, armN: -78, foreN: -6, armF: -10, foreF: -20 },
  grip: { lean: 6, head: 4, armN: -64, foreN: -26, armF: -58, foreF: -30 },
  pull: { lean: -18, head: -6, armN: -88, foreN: -2, armF: -84, foreF: -4 },
  cheer: { lean: -4, head: -10, armN: -150, foreN: -12, armF: 150, foreF: 12 },
  crouch: { lean: 28, head: 10, armN: -40, foreN: -50, armF: -34, foreF: -44 },
};

/** The standard poses: legs plus upper body. */
export const POSES = {
  stand: { legs: "stand", upper: "rest" },
  walk: { legs: "walk", upper: "walk" },
  notice: { legs: "stand", upper: "notice" },
  reach: { legs: "stand", upper: "reach" },
  grip: { legs: "brace", upper: "grip" },
  pull: { legs: "brace", upper: "pull" },
  cheer: { legs: "stand", upper: "cheer" },
  crouch: { legs: "crouch", upper: "crouch" },
};

/** Faces the head image can show; each is `head-<name>.svg`. */
export const FACES = ["calm", "alarm", "effort", "glad"];

export const INK = "#272727";
const STROKE = 7;

const round = (value) => Math.round(value * 10) / 10;

const rotateAbout = ([x, y], deg, [cx, cy]) => {
  const t = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(t) - dy * Math.sin(t),
    cy + dx * Math.sin(t) + dy * Math.cos(t),
  ];
};

/** How far the rig moves down so the lower foot rests on the floor line. */
export const dropFor = (legs) => {
  const foot = (leg, shin) =>
    rotateAbout(rotateAbout([98, 388], shin, JOINTS.knee), leg, JOINTS.hip)[1];
  return round(
    388 - Math.max(foot(legs.legN, legs.shinN), foot(legs.legF, legs.shinF)),
  );
};

const resolve = (pose) => {
  const resolved = typeof pose === "string" ? POSES[pose] : pose;
  if (!resolved) throw new Error(`Unknown pose ${pose}`);
  return { legs: LEGS[resolved.legs], upper: UPPERS[resolved.upper] };
};

/**
 * The layers of one figure. `id` prefixes every layer id; `x`, `y` and
 * `scale` place the rig frame (top-left of the 200 × 400 rig space) in design
 * pixels; `facing` is "right" or "left"; `pose` names a standard pose or
 * gives `{legs, upper}`; `face` is the head image's asset id. `upperOverride`
 * replaces individual upper-body angles, such as arms solved to hold a rope.
 */
export const rigLayers = ({
  id,
  x,
  y,
  scale = 1,
  facing = "right",
  pose = "stand",
  face = "head-calm",
  zIndex = 10,
  upperOverride = {},
  extraForeN = [],
  stepFps,
}) => {
  const { legs, upper: base } = resolve(pose);
  const upper = { ...base, ...upperOverride };
  const sign = facing === "left" ? -1 : 1;
  const fx = (px) => round(facing === "left" ? RIG.width - px : px);
  const frame = {
    x: round(x),
    y: round(y + dropFor(legs) * scale),
    width: round(RIG.width * scale),
    height: round(RIG.height * scale),
  };
  const line = (points) =>
    points
      .map((segment) =>
        segment
          .map(([px, py], i) => `${i === 0 ? "M" : "L"}${fx(px)} ${round(py)}`)
          .join(""),
      )
      .join("");
  const ink = (suffix, segments, z) => ({
    id: `${id}-${suffix}`,
    type: "path",
    d: line(segments),
    viewBox: { minX: 0, minY: 0, width: RIG.width, height: RIG.height },
    frame,
    stroke: { color: INK, width: STROKE },
    lineCap: "round",
    opacity: 1,
    rotationDeg: 0,
    zIndex: z,
  });
  const pivot = (joint) => ({
    x: Math.round((fx(JOINTS[joint][0]) / RIG.width) * 10000) / 10000,
    y: Math.round((JOINTS[joint][1] / RIG.height) * 10000) / 10000,
  });
  const group = (suffix, memberIds, joint, rotationDeg, z) => ({
    id: suffix ? `${id}-${suffix}` : id,
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
  const [sx, sy] = JOINTS.shoulder;
  const [, ey] = JOINTS.elbow;
  const [hx, hy] = JOINTS.hip;
  const [, ky] = JOINTS.knee;
  const headSize = 70 * scale;
  const headCenter = [104, 66];
  const layers = [
    // Legs: thigh, then shin with the foot as one stroke.
    ink(
      "thigh-f",
      [
        [
          [hx, hy],
          [hx, ky],
        ],
      ],
      1,
    ),
    ink(
      "shin-f",
      [
        [
          [hx, ky],
          [hx, 386],
        ],
        [
          [hx - 6, 388],
          [hx + 14, 388],
        ],
      ],
      1,
    ),
    group("lower-f", [`${id}-shin-f`], "knee", legs.shinF, 2),
    group("leg-f", [`${id}-thigh-f`, `${id}-lower-f`], "hip", legs.legF, 1),
    ink(
      "thigh-n",
      [
        [
          [hx, hy],
          [hx, ky],
        ],
      ],
      1,
    ),
    ink(
      "shin-n",
      [
        [
          [hx, ky],
          [hx, 386],
        ],
        [
          [hx - 6, 388],
          [hx + 14, 388],
        ],
      ],
      1,
    ),
    group("lower-n", [`${id}-shin-n`], "knee", legs.shinN, 2),
    group("leg-n", [`${id}-thigh-n`, `${id}-lower-n`], "hip", legs.legN, 2),
    // Arms: upper arm, then forearm ending in the hand.
    ink(
      "upperarm-f",
      [
        [
          [sx, sy],
          [sx, ey],
        ],
      ],
      1,
    ),
    ink(
      "forearm-f",
      [
        [
          [sx, ey],
          [sx, 240],
        ],
      ],
      1,
    ),
    group("fore-f", [`${id}-forearm-f`], "elbow", upper.foreF, 2),
    group(
      "arm-f",
      [`${id}-upperarm-f`, `${id}-fore-f`],
      "shoulder",
      upper.armF,
      1,
    ),
    ink(
      "torso",
      [
        [
          [100, 104],
          [100, 150],
          [99, 190],
          [hx, hy],
        ],
      ],
      2,
    ),
    ink(
      "neck",
      [
        [
          [100, 96],
          [100, 112],
        ],
      ],
      1,
    ),
    {
      id: `${id}-face`,
      type: "image",
      assetId: face,
      fit: "contain",
      cornerRadius: 0,
      frame: {
        x: round(frame.x + fx(headCenter[0]) * scale - headSize / 2),
        y: round(frame.y + headCenter[1] * scale - headSize / 2),
        width: round(headSize),
        height: round(headSize),
      },
      opacity: 1,
      rotationDeg: 0,
      zIndex: 2,
    },
    group("head", [`${id}-neck`, `${id}-face`], "neck", upper.head, 3),
    ink(
      "upperarm-n",
      [
        [
          [sx, sy],
          [sx, ey],
        ],
      ],
      1,
    ),
    ink(
      "forearm-n",
      [
        [
          [sx, ey],
          [sx, 240],
        ],
      ],
      1,
    ),
    group(
      "fore-n",
      [`${id}-forearm-n`, ...extraForeN],
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
      ...(stepFps ? { stepFps } : {}),
    },
  ];
  /** A rig-space point (unposed) in design pixels. */
  const place = ([px, py]) => ({
    x: frame.x + fx(px) * scale,
    y: frame.y + py * scale,
  });
  return { layers, frame, place, upper };
};

/** Where a hand ends up, in rig space facing right, for upper-body angles. */
export const handPoint = (upper, near = true) => {
  let at = [JOINTS.shoulder[0], 240];
  at = rotateAbout(at, near ? upper.foreN : upper.foreF, JOINTS.elbow);
  at = rotateAbout(at, near ? upper.armN : upper.armF, JOINTS.shoulder);
  return rotateAbout(at, upper.lean, JOINTS.hip);
};

/**
 * Arm angles that put a hand on `target` (rig space, facing right) for a
 * given lean, with the elbow bent downward: two-bone inverse kinematics.
 */
export const armsFor = (lean, target, near = true) => {
  const back = rotateAbout(target, -lean, JOINTS.hip);
  const [sx, sy] = JOINTS.shoulder;
  const upperLen = JOINTS.elbow[1] - sy;
  const foreLen = 240 - JOINTS.elbow[1];
  const dx = back[0] - sx;
  const dy = back[1] - sy;
  const dist = Math.min(Math.hypot(dx, dy), upperLen + foreLen - 0.01);
  const toTarget = Math.atan2(dy, dx);
  const cosShoulder =
    (upperLen ** 2 + dist ** 2 - foreLen ** 2) / (2 * upperLen * dist);
  const elbowAngle =
    toTarget + Math.acos(Math.max(-1, Math.min(1, cosShoulder)));
  const elbow = [
    sx + upperLen * Math.cos(elbowAngle),
    sy + upperLen * Math.sin(elbowAngle),
  ];
  // Rest direction is straight down (+y); convert directions to rotations.
  const deg = (rad) => (rad * 180) / Math.PI;
  const arm = deg(elbowAngle) - 90;
  const foreDir = Math.atan2(back[1] - elbow[1], back[0] - elbow[0]);
  const fore = deg(foreDir) - 90 - arm;
  const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  return near
    ? { armN: round(norm(arm)), foreN: round(norm(fore)) }
    : { armF: round(norm(arm)), foreF: round(norm(fore)) };
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
  const { legs, upper } = resolve(pose);
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
    console.log(
      name,
      JSON.stringify(poseAngles(name)),
      dropFor(LEGS[POSES[name].legs]),
    );
  }
}
