import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import {
  compileDraft,
  computeSceneRenderKeys,
  ScenesSchema,
  validatePlanSource,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { audioAsset, narratedSource } from "./narrated-source.js";

const pose = (id: string, sha: string) =>
  ({
    id,
    status: "ready",
    kind: "png",
    path: `assets/${id}.png`,
    sha256: sha.repeat(64),
    origin: { type: "generated" },
  }) as const;

const raka: Extract<Layer, { type: "image" }> = {
  id: "raka",
  type: "image",
  assetId: "raka-sit",
  fit: "contain",
  frame: { x: 300, y: 700, width: 480, height: 720 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
};

const swap = (id: string, startMs: number, assetId: string): Beat => ({
  id,
  targetId: "raka",
  action: "swap",
  startMs,
  durationMs: 100,
  params: { assetId },
});

const scene = (beats: Beat[], layers: Layer[] = [raka]): Scene => ({
  id: "phone",
  narrativeRole: "context",
  durationMs: 3000,
  visual: { type: "composition", layers },
  beats,
  transition: { type: "cut" },
});

const source = (
  scenes: Scene[],
  poses = [
    pose("raka-sit", "1"),
    pose("raka-hold", "2"),
    pose("raka-down", "3"),
  ],
): PlanSource => {
  const { narration: _narration, ...rest } = narratedSource({ scenes });
  return {
    ...rest,
    assets: { ...rest.assets, assets: [...rest.assets.assets, ...poses] },
    imageSizes: Object.fromEntries(
      poses.map((item) => [item.id, { width: 400, height: 600 }]),
    ),
  };
};

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

describe("swap beat (S4)", () => {
  it("shows a sequence of poses on one layer at the swap frames", () => {
    const result = compileDraft(
      source([
        scene([
          swap("hold", 1000, "raka-hold"),
          swap("down", 2200, "raka-down"),
        ]),
      ]),
    );
    if (!result.ok) throw new Error(codes(result.issues).join());
    const beats = result.value.scenes[0]?.beats ?? [];
    expect(
      beats.map((beat) => [
        beat.action,
        beat.startFrame,
        beat.action === "swap" ? beat.params.assetId : null,
      ]),
    ).toEqual([
      ["swap", 30, "raka-hold"],
      ["swap", 66, "raka-down"],
    ]);
  });

  it("targets only image layers", () => {
    const label: Layer = {
      id: "raka",
      type: "text",
      text: "Raka",
      frame: { x: 300, y: 700, width: 480, height: 200 },
      opacity: 1,
      rotationDeg: 0,
      zIndex: 1,
    };
    const parsed = ScenesSchema.safeParse({
      schemaVersion: 1,
      scenes: [scene([swap("hold", 1000, "raka-hold")], [label])],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe(
      "A swap beat targets an image layer",
    );
  });

  it("refuses two swaps of one layer on the same frame", () => {
    const result = compileDraft(
      source([
        scene([
          swap("hold", 1000, "raka-hold"),
          swap("down", 1010, "raka-down"),
        ]),
      ]),
    );
    expect(codes(result.issues)).toContain("MOTION_PROPERTY_OVERLAP");
  });

  it("allows swaps a frame apart whatever their durations", () => {
    const result = compileDraft(
      source([
        scene([
          { ...swap("hold", 1000, "raka-hold"), durationMs: 900 },
          swap("down", 1034, "raka-down"),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("refuses audio as a pose and undeclared assets", () => {
    const withAudio = source(
      [scene([swap("hold", 1000, "voice")])],
      [pose("raka-sit", "1"), audioAsset("voice", "4".repeat(64))],
    );
    expect(codes(compileDraft(withAudio).issues)).toContain(
      "SWAP_ASSET_INVALID",
    );
    const missing = validatePlanSource(
      source([scene([swap("hold", 1000, "raka-missing")])]),
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok)
      expect(codes(missing.issues)).toContain("ASSET_UNDECLARED");
  });

  it("needs every pose of a cropped layer at the same pixel size", () => {
    const cropped = { ...raka, crop: { x: 0, y: 0, width: 400, height: 600 } };
    const base = source([scene([swap("hold", 1000, "raka-hold")], [cropped])]);
    expect(compileDraft(base).ok).toBe(true);
    const mismatched = {
      ...base,
      imageSizes: {
        ...base.imageSizes,
        "raka-hold": { width: 300, height: 600 },
      },
    };
    expect(codes(compileDraft(mismatched).issues)).toContain(
      "SWAP_ASSET_INVALID",
    );
  });

  it("re-renders the scene when a swapped pose file changes", () => {
    const keyFor = (holdSha: string) => {
      const result = compileDraft(
        source(
          [scene([swap("hold", 1000, "raka-hold")])],
          [pose("raka-sit", "1"), pose("raka-hold", holdSha)],
        ),
      );
      if (!result.ok) throw new Error(codes(result.issues).join());
      return computeSceneRenderKeys(result.value)[0]?.key;
    };
    expect(keyFor("2")).not.toBe(keyFor("5"));
  });
});
