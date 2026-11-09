// Writes the Story 0.2.0 rig patterns into catalog.json, keeping every
// 0.1.0 pattern byte-for-byte. Run from this folder: `node author-patterns.mjs`.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_COLORS, posedPoint, rigLayers } from "./rig.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const VERSION = "0.2.0";

const NEW_ASSETS = [
  ["phone", "Phone body"],
  ["screen-dark", "Phone screen at rest"],
  ["screen-lit", "Phone screen with a new message"],
  ["glow-cool", "Cool screen light"],
  ["glow-warm", "Warm lamp light"],
  ["porch-lamp", "Wall lamp, off"],
  ["lamp-on", "Wall lamp, lit"],
  ["door", "Front door"],
  ["window", "Night window"],
];

const presentation = { opacity: 1, rotationDeg: 0 };
const rect = (id, frame, fill, zIndex, extra = {}) => ({
  id,
  type: "shape",
  shape: "rectangle",
  fill,
  frame,
  ...presentation,
  zIndex,
  ...extra,
});
const image = (id, assetId, frame, zIndex, extra = {}) => ({
  id,
  type: "image",
  assetId,
  fit: "contain",
  cornerRadius: 0,
  frame,
  ...presentation,
  zIndex,
  ...extra,
});

/** Phone and screen carried by a hand, in unposed rig space. */
const handPhone = (id, place, scale, screen) => {
  const body = place([176, 440]);
  const glass = place([180.5, 444]);
  return [
    image(
      `${id}-phone`,
      "phone",
      { x: body.x, y: body.y, width: 48 * scale, height: 88 * scale },
      3,
    ),
    image(
      `${id}-screen`,
      screen,
      { x: glass.x, y: glass.y, width: 39 * scale, height: 73 * scale },
      4,
    ),
  ];
};

const colorParameters = (layers, id) => {
  const pointers = (suffixes) =>
    suffixes.map(
      (suffix) =>
        `/visual/layers/${layers.findIndex((layer) => layer.id === `${id}-${suffix}`)}/fill`,
    );
  return {
    skin: {
      type: "string",
      pointers: pointers([
        "skull",
        "neck",
        "forearm-n",
        "hand-n",
        "forearm-f",
        "hand-f",
      ]),
      description: `Skin colour, required; the rig uses ${DEFAULT_COLORS.skin}.`,
    },
    hair: {
      type: "string",
      pointers: pointers(["hair"]),
      description: `Hair colour, required; the rig uses ${DEFAULT_COLORS.hair}.`,
    },
    shirt: {
      type: "string",
      pointers: pointers(["torso", "upperarm-n", "upperarm-f"]),
      description: `Shirt colour, required; the rig uses ${DEFAULT_COLORS.shirt}.`,
    },
    pants: {
      type: "string",
      pointers: pointers(["thigh-n", "shin-n", "thigh-f", "shin-f"]),
      description: `Trouser colour, required; the rig uses ${DEFAULT_COLORS.pants}.`,
    },
  };
};

const pointerTo = (layers, id, field) =>
  `/visual/layers/${layers.findIndex((layer) => layer.id === id)}/${field}`;

/** A seated figure lit by a phone that receives a message. */
const phoneGlow = () => {
  const scale = 1;
  const rig = rigLayers({
    id: "kid",
    x: 250,
    y: 470,
    scale,
    pose: "hold-phone",
    extraForeN: ["kid-phone", "kid-screen"],
  });
  const hand = rig.place(posedPoint("hold-phone", "hand-n", [200, 470]));
  const layers = [
    rect("night", { x: 0, y: 0, width: 1080, height: 1920 }, "#1C2133", 0),
    rect("floor", { x: 0, y: 1400, width: 1080, height: 520 }, "#252A3D", 1),
    image("window", "window", { x: 650, y: 420, width: 300, height: 367 }, 1),
    rect("bed", { x: 170, y: 1180, width: 600, height: 240 }, "#3A3F5C", 2, {
      cornerRadius: 24,
    }),
    image(
      "glow",
      "glow-cool",
      { x: hand.x - 330, y: hand.y - 330, width: 660, height: 660 },
      9,
      { opacity: 0.35 },
    ),
    ...rig.layers,
    ...handPhone("kid", rig.place, scale, "screen-dark"),
    rect("card", { x: 120, y: 250, width: 840, height: 230 }, "#E9F1FF", 20, {
      cornerRadius: 36,
    }),
    {
      id: "card-sender",
      type: "text",
      text: "Dad",
      frame: { x: 176, y: 282, width: 728, height: 56 },
      ...presentation,
      zIndex: 21,
      role: "label",
      color: "#3D5A9E",
      fontSize: 38,
      fontWeight: 700,
      maxLines: 1,
    },
    {
      id: "card-message",
      type: "text",
      text: "I'm outside.",
      frame: { x: 176, y: 350, width: 728, height: 96 },
      ...presentation,
      zIndex: 21,
      role: "heading",
      color: "#1C2133",
      fontSize: 64,
      fontWeight: 700,
      maxLines: 1,
    },
  ];
  // The message card and its two lines arrive together.
  const show = (id, startMs) => ({
    id: `show-${id}`,
    targetId: id,
    action: "reveal",
    startMs,
    durationMs: 360,
    params: { direction: "up", distance: 0, easingPreset: "smooth" },
  });
  const template = {
    id: "phone-glow",
    narrativeRole: "context",
    durationMs: 3600,
    visual: { type: "composition", layers },
    beats: [
      {
        id: "breath",
        targetId: "kid-upper",
        action: "emphasize",
        startMs: 0,
        durationMs: 1200,
        repeat: { intervalMs: 1400, untilMs: 3600 },
        params: { scale: 1.03, easingPreset: "smooth" },
      },
      {
        id: "screen-on",
        targetId: "kid-screen",
        action: "swap",
        startMs: 1100,
        durationMs: 100,
        params: { assetId: "screen-lit" },
      },
      {
        id: "light-up",
        targetId: "glow",
        action: "transform",
        startMs: 1100,
        durationMs: 300,
        params: { to: { scale: 1.12 }, easingPreset: "snappy" },
      },
      show("card", 1400),
      show("card-sender", 1400),
      show("card-message", 1400),
      {
        id: "look-up",
        targetId: "kid-head",
        action: "transform",
        startMs: 2500,
        durationMs: 500,
        params: { to: { rotationDeg: -4 }, easingPreset: "smooth" },
      },
    ],
    transition: { type: "cut" },
    note: "The phone lights and the message lands; carry the phone in hand and the night into the next shot.",
  };
  return {
    id: "phone-glow",
    version: VERSION,
    description:
      "A seated, faceless figure in a dark room; the phone screen lights and a message card tells the story. Pair with porch-light, or cut to the same framing with head-down.",
    parameters: {
      sender: {
        type: "string",
        pointers: [
          "/visual/layers/" +
            layers.findIndex((l) => l.id === "card-sender") +
            "/text",
        ],
        description: "Who the message is from.",
      },
      message: {
        type: "string",
        pointers: [pointerTo(layers, "card-message", "text")],
        description: "The message that turns the story, one short line.",
      },
      ...colorParameters(layers, "kid"),
    },
    template,
  };
};

/** The figure, phone in hand, stands in a doorway as a lamp switches on. */
const porchLight = () => {
  const scale = 1;
  const rig = rigLayers({
    id: "kid",
    x: 420,
    y: 860,
    scale,
    pose: "stand",
    extraForeF: ["kid-phone", "kid-screen"],
  });
  const lamp = { x: 520, y: 640, width: 100, height: 150 };
  const layers = [
    rect("night", { x: 0, y: 0, width: 1080, height: 1920 }, "#161A28", 0),
    rect("wall", { x: 0, y: 0, width: 760, height: 1660 }, "#2C3147", 1),
    rect("ground", { x: 0, y: 1640, width: 1080, height: 280 }, "#20243A", 1),
    image("door", "door", { x: 90, y: 1000, width: 330, height: 660 }, 2),
    image("lamp", "porch-lamp", lamp, 3),
    image(
      "glow",
      "glow-warm",
      { x: lamp.x + 50 - 500, y: lamp.y + 90 - 500, width: 1000, height: 1000 },
      4,
    ),
    ...rig.layers,
    ...handPhone("kid", rig.place, scale, "screen-lit"),
  ];
  const template = {
    id: "porch-light",
    narrativeRole: "context",
    durationMs: 3600,
    visual: { type: "composition", layers },
    beats: [
      {
        id: "lamp-on",
        targetId: "lamp",
        action: "swap",
        startMs: 500,
        durationMs: 100,
        params: { assetId: "lamp-on" },
      },
      {
        id: "light",
        targetId: "glow",
        action: "reveal",
        startMs: 500,
        durationMs: 300,
        params: { direction: "up", distance: 0, easingPreset: "snappy" },
      },
      {
        id: "breath",
        targetId: "kid-upper",
        action: "emphasize",
        startMs: 300,
        durationMs: 1200,
        repeat: { intervalMs: 1400, untilMs: 3600 },
        params: { scale: 1.03, easingPreset: "smooth" },
      },
      {
        id: "turn",
        targetId: "kid-head",
        action: "transform",
        startMs: 1300,
        durationMs: 400,
        params: { to: { rotationDeg: -8 }, easingPreset: "smooth" },
      },
      {
        id: "raise-arm",
        targetId: "kid-arm-n",
        action: "transform",
        startMs: 1500,
        durationMs: 260,
        params: { to: { rotationDeg: -92 }, easingPreset: "snappy" },
      },
      {
        id: "settle-arm",
        targetId: "kid-arm-n",
        action: "transform",
        startMs: 1760,
        durationMs: 300,
        params: { to: { rotationDeg: -84 }, easingPreset: "smooth" },
      },
      {
        id: "straighten",
        targetId: "kid-fore-n",
        action: "transform",
        startMs: 1500,
        durationMs: 400,
        params: { to: { rotationDeg: -6 }, easingPreset: "smooth" },
      },
    ],
    transition: { type: "cut" },
    note: "Cut from sitting to standing in the doorway; the phone stays in hand, and the lamp's light takes over from the screen's.",
  };
  return {
    id: "porch-light",
    version: VERSION,
    description:
      "The figure stands in a doorway at night, phone in hand; a wall lamp switches on and the figure points into the dark. The light carries the story.",
    parameters: colorParameters(layers, "kid"),
    template,
  };
};

const catalogPath = join(here, "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const sha = (file) =>
  createHash("sha256")
    .update(readFileSync(join(here, file)))
    .digest("hex");
const keptAssets = catalog.assets.filter(
  (asset) => !NEW_ASSETS.some(([id]) => id === asset.id),
);
catalog.version = VERSION;
catalog.assets = [
  ...keptAssets,
  ...NEW_ASSETS.map(([id, source]) => ({
    id,
    status: "ready",
    kind: "svg",
    path: `${id}.svg`,
    binding: "neutral",
    sha256: sha(`${id}.svg`),
    origin: {
      type: "generated",
      source: `Original NaraFrame Story rig prop: ${source}`,
      license: "MIT",
    },
  })),
];
catalog.patterns = [
  ...catalog.patterns.filter((pattern) => pattern.version !== VERSION),
  phoneGlow(),
  porchLight(),
];
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `catalog ${catalog.version}: ${catalog.patterns.map((p) => `${p.id}@${p.version}`).join(", ")}`,
);
