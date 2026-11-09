import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft, ScenesSchema } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const shape = (
  id: string,
  frame = { x: 100, y: 600, width: 200, height: 100 },
  extra: Partial<Extract<Layer, { type: "shape" }>> = {},
): Layer => ({
  id,
  type: "shape",
  shape: "rectangle",
  fill: "#3E7A8C",
  frame,
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
  ...extra,
});

const group = (
  id: string,
  memberIds: string[],
  extra: Partial<Extract<Layer, { type: "group" }>> = {},
): Layer => ({
  id,
  type: "group",
  memberIds,
  transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
  zIndex: 1,
  ...extra,
});

const scene = (layers: Layer[], beats: Beat[] = []): Scene => ({
  id: "skeleton",
  narrativeRole: "context",
  durationMs: 2000,
  visual: { type: "composition", layers },
  beats,
  transition: { type: "cut" },
});

const messages = (layers: Layer[]) => {
  const result = ScenesSchema.safeParse({
    schemaVersion: 1,
    scenes: [scene(layers)],
  });
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

const silentSource = (scenes: Scene[]): PlanSource => {
  const { narration: _narration, ...rest } = narratedSource({ scenes });
  return rest;
};

const skeleton = (): Layer[] => [
  shape("torso"),
  shape("upper-arm"),
  shape("forearm"),
  shape("hand"),
  group("forearm-g", ["forearm", "hand"], { pivot: { x: 0, y: 0.5 } }),
  group("arm-g", ["upper-arm", "forearm-g"], { pivot: { x: 0, y: 0.5 } }),
  group("body-g", ["torso", "arm-g"]),
];

describe("nested groups (S3)", () => {
  it("accepts a body, arm, forearm and hand skeleton", () => {
    expect(messages(skeleton())).toEqual([]);
  });

  it("refuses a group that contains itself through another group", () => {
    const found = messages([
      shape("a"),
      group("one", ["a", "two"]),
      group("two", ["one"]),
    ]);
    expect(found.some((message) => message.includes("cycle"))).toBe(true);
  });

  it("refuses a layer held by two groups", () => {
    const found = messages([
      shape("a"),
      group("one", ["a"]),
      group("two", ["a"]),
    ]);
    expect(found).toContain("Layer already belongs to group one");
  });

  it("refuses more than four levels", () => {
    const four = [
      shape("leaf"),
      group("g1", ["leaf"]),
      group("g2", ["g1"]),
      group("g3", ["g2"]),
      group("g4", ["g3"]),
    ];
    expect(messages(four)).toEqual([]);
    const five = messages([...four, group("g5", ["g4"])]);
    expect(five.some((message) => message.includes("at most 4 levels"))).toBe(
      true,
    );
  });

  it("keeps the plane on the root group", () => {
    const found = messages([
      shape("a"),
      group("inner", ["a"], { space: "world" }),
      group("outer", ["inner"]),
    ]);
    expect(
      found.some((message) =>
        message.includes("takes its plane from its root"),
      ),
    ).toBe(true);
  });

  it("nests groups only in an absolute group", () => {
    const found = messages([
      shape("a"),
      group("inner", ["a"]),
      group("outer", ["inner"], {
        frame: { x: 0, y: 0, width: 1080, height: 1920 },
        layout: {
          type: "stack",
          direction: "vertical",
          gap: 0,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          align: "start",
        },
      }),
    ]);
    expect(found.some((message) => message.includes("absolute group"))).toBe(
      true,
    );
  });

  it("puts every descendant of a world root group in the world", () => {
    const outside = { x: -400, y: 600, width: 300, height: 100 };
    const layers = [
      shape("far", outside),
      group("inner", ["far"]),
      group("outer", ["inner"], { space: "world", parallax: 0.5 }),
    ];
    const result = compileDraft(silentSource([scene(layers)]));
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      "LAYER_OUTSIDE_CANVAS",
    );
  });

  it("does not guess contrast for text carried by a moving nested group", () => {
    const panel = shape(
      "panel",
      { x: 100, y: 600, width: 880, height: 400 },
      { fill: "#FFFFFF" },
    );
    const label: Layer = {
      id: "label",
      type: "text",
      text: "Hi",
      color: "#FFFFFF",
      frame: { x: 160, y: 700, width: 400, height: 160 },
      opacity: 1,
      rotationDeg: 0,
      zIndex: 2,
    };
    const layers = [
      panel,
      label,
      group("sign", ["label"]),
      group("arm", ["sign"]),
    ];
    const still = compileDraft(silentSource([scene(layers)]));
    if (!still.ok) throw new Error(still.issues.map((i) => i.code).join());
    expect(still.issues.map((issue) => issue.code)).toContain(
      "CONTRAST_INSUFFICIENT",
    );
    const moving = compileDraft(
      silentSource([
        scene(layers, [
          {
            id: "wave",
            targetId: "arm",
            action: "transform",
            startMs: 0,
            durationMs: 500,
            params: { to: { rotationDeg: -20 } },
          },
        ]),
      ]),
    );
    if (!moving.ok) throw new Error(moving.issues.map((i) => i.code).join());
    const unverified = moving.issues.find(
      (issue) => issue.code === "CONTRAST_UNVERIFIED",
    );
    expect(unverified?.message).toContain("nested groups");
  });
});
