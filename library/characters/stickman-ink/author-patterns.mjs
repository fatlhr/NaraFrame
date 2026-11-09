// Writes the Stickman Ink 0.2.0 rig patterns into catalog.json, keeping every
// 0.1.0 pattern and asset unchanged. Run from this folder:
// `node author-patterns.mjs`.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { armsFor, FACES, INK, rigLayers, turnTo } from "./rig.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const VERSION = "0.2.0";
const SCALE = 1.55;
const GROUND = 1500;
const NEW_ASSETS = [
  ...FACES.map((face) => [`head-${face}`, `Ink head, ${face}`]),
  ["crate", "Ink crate"],
];

const presentation = { opacity: 1, rotationDeg: 0 };
const ground = {
  id: "ground",
  type: "path",
  d: "M40 20Q300 15 540 20T1040 20",
  viewBox: { minX: 0, minY: 0, width: 1080, height: 40 },
  frame: { x: 0, y: GROUND - 20, width: 1080, height: 40 },
  stroke: { color: INK, width: 5 },
  lineCap: "round",
  ...presentation,
  zIndex: 0,
};
const title = (text) => ({
  id: "title",
  type: "text",
  text,
  frame: { x: 102, y: 182, width: 876, height: 148 },
  ...presentation,
  zIndex: 20,
  role: "heading",
  color: "#262626",
  maxLines: 2,
});
const crate = (x) => ({
  id: "crate",
  type: "image",
  assetId: "crate",
  fit: "contain",
  cornerRadius: 0,
  frame: { x, y: GROUND - 260, width: 312, height: 260 },
  ...presentation,
  zIndex: 5,
});
/** Feet on the ground line: the rig adds its own drop for bent legs. */
const rigY = GROUND - 388 * SCALE;
const turn = (
  id,
  targetId,
  startMs,
  durationMs,
  rotationDeg,
  easingPreset,
) => ({
  id,
  targetId,
  action: "transform",
  startMs,
  durationMs,
  params: { to: { rotationDeg }, easingPreset },
});
const swapFace = (id, startMs, face) => ({
  id,
  targetId: "kid-face",
  action: "swap",
  startMs,
  durationMs: 100,
  params: { assetId: `head-${face}` },
});

/** Hands on a taut rope: the figure braces, leans back and drags a crate. */
const inkHeave = () => {
  const rope = [160, 206];
  const ropeFar = [150, 210];
  const lean = (degrees) => ({
    lean: degrees,
    ...armsFor(degrees, rope, true),
    ...armsFor(degrees, ropeFar, false),
  });
  const start = lean(4);
  const rig = rigLayers({
    id: "kid",
    x: 120,
    y: rigY,
    scale: SCALE,
    pose: "grip",
    face: "head-calm",
    upperOverride: start,
  });
  const hand = rig.place(rope);
  const ropeLength = 700;
  const crateFrom = 760;
  const crateTo = 560;
  const layers = [
    ground,
    {
      id: "rope",
      type: "path",
      d: `M0 20L${ropeLength} 20`,
      viewBox: { minX: 0, minY: 0, width: ropeLength, height: 40 },
      frame: { x: hand.x, y: hand.y - 20, width: ropeLength, height: 40 },
      stroke: { color: INK, width: 5 },
      lineCap: "round",
      ...presentation,
      zIndex: 4,
    },
    crate(crateFrom),
    ...rig.layers,
    title("One more pull"),
  ];
  // Each key pose keeps both hands on the rope.
  const keys = [
    { at: 300, ms: 200, pose: lean(9), ease: "smooth" },
    { at: 500, ms: 380, pose: lean(-16), ease: "snappy" },
    { at: 900, ms: 320, pose: lean(-11), ease: "smooth" },
  ];
  const beats = [swapFace("strain", 300, "effort")];
  const to = (id, angle) => turnTo(rig.layers, id, angle);
  keys.forEach(({ at, ms, pose, ease }, index) => {
    beats.push(
      turn(
        `lean-${index + 1}`,
        "kid-upper",
        at,
        ms,
        to("kid-upper", pose.lean),
        ease,
      ),
      turn(
        `arm-${index + 1}`,
        "kid-arm-n",
        at,
        ms,
        to("kid-arm-n", pose.armN),
        ease,
      ),
      turn(
        `fore-${index + 1}`,
        "kid-fore-n",
        at,
        ms,
        to("kid-fore-n", pose.foreN),
        ease,
      ),
      turn(
        `far-arm-${index + 1}`,
        "kid-arm-f",
        at,
        ms,
        to("kid-arm-f", pose.armF),
        ease,
      ),
      turn(
        `far-fore-${index + 1}`,
        "kid-fore-f",
        at,
        ms,
        to("kid-fore-f", pose.foreF),
        ease,
      ),
    );
  });
  beats.push(
    {
      id: "crate-slides",
      targetId: "crate",
      action: "transform",
      startMs: 560,
      durationMs: 1300,
      params: { to: { x: crateTo - crateFrom }, easingPreset: "smooth" },
    },
    {
      id: "rope-shortens",
      targetId: "rope",
      action: "draw",
      startMs: 560,
      durationMs: 1300,
      params: {
        from: (crateFrom - hand.x) / ropeLength,
        to: (crateTo - hand.x) / ropeLength,
        easingPreset: "smooth",
      },
    },
  );
  const template = {
    id: "ink-heave",
    narrativeRole: "context",
    durationMs: 3200,
    visual: { type: "composition", layers },
    beats,
    transition: { type: "cut" },
    note: "Brace, lean back past the mark and settle; the crate slides in. Cut on the strained face with the crate beside the figure.",
  };
  return {
    id: "ink-heave",
    version: VERSION,
    description:
      "A jointed ink figure braces on a rope, leans back past its mark and drags a crate closer. Both hands stay on the rope; the face swaps to effort.",
    parameters: {
      title: {
        type: "string",
        pointers: [
          `/visual/layers/${layers.findIndex((l) => l.id === "title")}/text`,
        ],
        description: "Short title shared across the story.",
      },
      note: {
        type: "string",
        pointers: ["/note"],
        description: "Action or prop carried into the next shot.",
      },
    },
    template,
  };
};

/** The crate arrives; the figure lets go, throws its arms up and hops. */
const inkCheer = () => {
  const rig = rigLayers({
    id: "kid",
    x: 120,
    y: rigY,
    scale: SCALE,
    pose: "stand",
    face: "head-effort",
  });
  const layers = [ground, crate(560), ...rig.layers, title("One more pull")];
  const to = (id, angle) => turnTo(rig.layers, id, angle);
  const beats = [
    swapFace("relief", 200, "glad"),
    turn("arms-up", "kid-arm-n", 300, 360, to("kid-arm-n", -162), "snappy"),
    turn("arms-settle", "kid-arm-n", 660, 300, to("kid-arm-n", -150), "smooth"),
    turn("far-arm-up", "kid-arm-f", 340, 360, to("kid-arm-f", 162), "snappy"),
    turn(
      "far-arm-settle",
      "kid-arm-f",
      700,
      300,
      to("kid-arm-f", 150),
      "smooth",
    ),
    turn("look-up", "kid-head", 300, 400, to("kid-head", -12), "smooth"),
    {
      id: "hop",
      targetId: "kid",
      action: "transform",
      startMs: 700,
      durationMs: 220,
      params: { to: { y: -60 }, easingPreset: "snappy" },
    },
    {
      id: "land",
      targetId: "kid",
      action: "transform",
      startMs: 920,
      durationMs: 260,
      params: { to: { y: 0 }, easingPreset: "smooth" },
    },
    {
      id: "breath",
      targetId: "kid-upper",
      action: "emphasize",
      startMs: 1200,
      durationMs: 1100,
      repeat: { intervalMs: 1200, untilMs: 3600 },
      params: { scale: 1.03, easingPreset: "smooth" },
    },
  ];
  const template = {
    id: "ink-cheer",
    narrativeRole: "explanation",
    durationMs: 3600,
    visual: { type: "composition", layers },
    beats,
    transition: { type: "cut" },
    note: "Open on the strained face from the last shot, then relief: arms up, a small hop, and a held breath beside the crate.",
  };
  return {
    id: "ink-cheer",
    version: VERSION,
    description:
      "The crate has arrived. The ink figure's face swaps to relief, its arms go up past their mark and settle, and it hops once.",
    parameters: {
      title: {
        type: "string",
        pointers: [
          `/visual/layers/${layers.findIndex((l) => l.id === "title")}/text`,
        ],
        description: "Short title shared across the story.",
      },
      note: {
        type: "string",
        pointers: ["/note"],
        description: "Action or prop carried into the next shot.",
      },
    },
    template,
  };
};

const catalogPath = join(here, "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const sha = (file) =>
  createHash("sha256")
    .update(readFileSync(join(here, file)))
    .digest("hex");
catalog.version = VERSION;
catalog.assets = [
  ...catalog.assets.filter(
    (asset) => !NEW_ASSETS.some(([id]) => id === asset.id),
  ),
  ...NEW_ASSETS.map(([id, source]) => ({
    id,
    status: "ready",
    kind: "svg",
    path: `${id}.svg`,
    binding: "neutral",
    sha256: sha(`${id}.svg`),
    origin: {
      type: "generated",
      source: `Original NaraFrame Stickman Ink rig art: ${source}`,
      license: "MIT",
    },
  })),
];
catalog.patterns = [
  ...catalog.patterns.filter((pattern) => pattern.version !== VERSION),
  inkHeave(),
  inkCheer(),
];
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `catalog ${catalog.version}: ${catalog.patterns.map((p) => `${p.id}@${p.version}`).join(", ")}`,
);
