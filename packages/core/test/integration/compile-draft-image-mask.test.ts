import type { Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

// F2: an image mask radius past half the shortest edge is pure geometry on
// the resolved radius, so `validate` (compileDraft) reports it without a
// preview; the profile's default media radius counts when the layer has none.

const photo = (
  overrides: Partial<Extract<Layer, { type: "image" }>>,
): Layer => ({
  id: "check",
  type: "image",
  assetId: "photo",
  fit: "contain",
  frame: { x: 100, y: 100, width: 56, height: 56 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 0,
  ...overrides,
});

const withLayer = (layer: Layer, mediaRadius?: number): PlanSource => {
  const scene: Scene = {
    id: "probe",
    narrativeRole: "context",
    durationMs: 2000,
    visual: { type: "composition", layers: [layer] },
    beats: [],
    transition: { type: "cut" },
  };
  const { narration: _narration, ...rest } = narratedSource({
    scenes: [scene],
  });
  const render = rest.profile.render;
  return {
    ...rest,
    assets: {
      ...rest.assets,
      assets: [
        ...rest.assets.assets,
        {
          id: "photo",
          status: "ready",
          kind: "png",
          path: "assets/photo.png",
          sha256: "c".repeat(64),
          origin: { type: "user", source: "test" },
        },
      ],
    },
    profile: {
      ...rest.profile,
      render:
        mediaRadius === undefined
          ? render
          : {
              ...render,
              appearance: {
                radius: { small: 20, medium: 44, large: 72 },
                stroke: { color: "#E8E0D2", width: 0 },
                shadow: {
                  color: "#000000",
                  opacity: 0,
                  offsetX: 0,
                  offsetY: 0,
                  blur: 0,
                },
                ...render.appearance,
                media: { fit: "cover", cornerRadius: mediaRadius },
              },
            },
    },
  } as PlanSource;
};

const masks = (source: PlanSource) =>
  compileDraft(source).issues.filter(
    (issue) => issue.code === "IMAGE_MASK_INVALID",
  );

describe("IMAGE_MASK_INVALID at compile time", () => {
  it("reports a radius past half the shortest edge that the profile default supplies", () => {
    // current-issues' media radius 44 on a 56 px check icon, as after the retrial's profile change.
    const result = compileDraft(withLayer(photo({}), 44));
    expect(result.ok).toBe(false);
    expect(masks(withLayer(photo({}), 44))).toEqual([
      expect.objectContaining({
        severity: "error",
        entityId: "check",
        path: "/scenes/0/visual/layers/0",
        message: "Image check corner radius exceeds half of its shortest edge.",
      }),
    ]);
  });

  it("reports an explicit radius past half the shortest edge", () => {
    expect(masks(withLayer(photo({ cornerRadius: 40 })))).toHaveLength(1);
  });

  it("accepts a radius of exactly half, an explicit zero over the default, and no radius", () => {
    expect(masks(withLayer(photo({ cornerRadius: 28 })))).toEqual([]);
    expect(masks(withLayer(photo({ cornerRadius: 0 }), 44))).toEqual([]);
    expect(masks(withLayer(photo({})))).toEqual([]);
  });
});
