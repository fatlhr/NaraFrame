import type { PlanSource } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { planProfileReview } from "../../src/profile/review.js";

const palette = {
  background: "#111111",
  surface: "#EEEEEE",
  text: "#FFFFFF",
  accent: "#FF5500",
};

const frame = { x: 0, y: 0, width: 10, height: 10 };
const common = { opacity: 1, rotationDeg: 0, zIndex: 0, frame };

const source = {
  scenes: {
    scenes: [
      {
        id: "one",
        visual: {
          type: "composition",
          layers: [
            {
              id: "title",
              type: "text",
              text: "Hi",
              color: "palette.text",
              ...common,
            },
            { id: "default-text", type: "text", text: "Hi", ...common },
            {
              id: "rule",
              type: "shape",
              shape: "rectangle",
              fill: "palette.accent",
              stroke: { color: "#00FF00", width: 2 },
              ...common,
            },
            {
              id: "photo",
              type: "image",
              assetId: "plate",
              fit: "cover",
              ...common,
            },
            {
              id: "route",
              type: "path",
              d: "M0 0L1 1",
              viewBox: { minX: 0, minY: 0, width: 1, height: 1 },
              stroke: { color: "palette.surface", width: 1 },
              fill: "#ABCDEF",
              ...common,
            },
          ],
        },
      },
      { id: "two", visual: { type: "text", text: "plain" } },
      { id: "three", visual: { type: "recipe", recipe: "r", params: {} } },
    ],
  },
} as unknown as PlanSource;

const none = { direction: false, illustration: false };

describe("planProfileReview", () => {
  it("returns nothing when no palette slot, direction or illustration changes", () => {
    expect(
      planProfileReview(
        source,
        { before: palette, after: { ...palette } },
        none,
      ),
    ).toBeUndefined();
  });

  it("treats a hex that differs only in case as unchanged", () => {
    expect(
      planProfileReview(
        source,
        { before: palette, after: { ...palette, text: "#ffffff" } },
        none,
      ),
    ).toBeUndefined();
  });

  it("names a changed slot's tokens by layer and property, and lists literals once the palette moves", () => {
    const review = planProfileReview(
      source,
      { before: palette, after: { ...palette, accent: "#00AA55" } },
      none,
    );
    expect(review?.paletteBound).toEqual([
      {
        sceneId: "one",
        layerId: "rule",
        property: "fill",
        token: "palette.accent",
        before: "#FF5500",
        after: "#00AA55",
      },
    ]);
    expect(
      review?.literalColors.map((item) => [
        item.layerId,
        item.property,
        item.color,
      ]),
    ).toEqual([
      ["rule", "stroke.color", "#00FF00"],
      ["route", "fill", "#ABCDEF"],
    ]);
    expect(review?.imageLayers).toEqual([
      { sceneId: "one", layerId: "photo", assetId: "plate" },
    ]);
  });

  it("reports a direction change without any bound layers", () => {
    const review = planProfileReview(
      source,
      { before: palette, after: { ...palette } },
      { direction: true, illustration: false },
    );
    expect(review?.paletteBound).toEqual([]);
    expect(review?.literalColors).toHaveLength(2);
    expect(review?.imageLayers).toHaveLength(1);
  });

  it("lists only images for an illustration change", () => {
    const review = planProfileReview(
      source,
      { before: palette, after: { ...palette } },
      { direction: false, illustration: true },
    );
    expect(review).toEqual({
      paletteBound: [],
      literalColors: [],
      imageLayers: [{ sceneId: "one", layerId: "photo", assetId: "plate" }],
    });
  });
});
