import type { PlanSource } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

/** One scene whose shape and text name palette slots instead of hex values. */
const tokenScene = (): PlanSource => {
  const base = narratedSource();
  return {
    ...base,
    scenes: {
      ...base.scenes,
      scenes: base.scenes.scenes.map((scene, index) =>
        index !== 0
          ? scene
          : {
              ...scene,
              visual: {
                type: "composition",
                layers: [
                  {
                    id: "rule",
                    type: "shape",
                    shape: "rectangle",
                    fill: "palette.accent",
                    frame: { x: 88, y: 500, width: 300, height: 8 },
                    opacity: 1,
                    rotationDeg: 0,
                    zIndex: 0,
                  },
                  {
                    id: "panel",
                    type: "shape",
                    shape: "rectangle",
                    fill: "#123456",
                    frame: { x: 88, y: 600, width: 300, height: 80 },
                    opacity: 1,
                    rotationDeg: 0,
                    zIndex: 0,
                  },
                  {
                    id: "caption",
                    type: "text",
                    text: "Tokened",
                    frame: { x: 88, y: 700, width: 800, height: 80 },
                    color: "palette.surface",
                    opacity: 1,
                    rotationDeg: 0,
                    zIndex: 1,
                  },
                ],
              },
            },
      ),
    },
  };
};

const withPalette = (
  source: PlanSource,
  palette: PlanSource["profile"]["render"]["palette"],
): PlanSource => ({
  ...source,
  profile: {
    ...source.profile,
    render: { ...source.profile.render, palette },
  },
});

const layersOf = (source: PlanSource) => {
  const result = compileDraft(source);
  if (!result.ok)
    throw new Error(`compile failed: ${result.issues.map((i) => i.code)}`);
  const scene = result.value.scenes[0];
  return Object.fromEntries(
    scene?.layers.map((layer) => [
      layer.id,
      layer.type === "shape"
        ? layer.fill
        : layer.type === "text"
          ? layer.color
          : null,
    ]) ?? [],
  );
};

describe("palette tokens in a scene", () => {
  it("resolves to the profile's colours and leaves literal hex alone", () => {
    const layers = layersOf(tokenScene());
    expect(layers.rule).toBe("#FF5A36");
    expect(layers.caption).toBe("#E8E0D2");
    expect(layers.panel).toBe("#123456");
  });

  it("follows the profile when the palette changes, which is the point", () => {
    const swapped = withPalette(tokenScene(), {
      background: "#F4F1EA",
      surface: "#1C2733",
      text: "#16202B",
      accent: "#0B7A75",
    });
    const layers = layersOf(swapped);
    expect(layers.rule).toBe("#0B7A75");
    expect(layers.caption).toBe("#1C2733");
    // A hard-coded colour is the author's choice and is never repainted.
    expect(layers.panel).toBe("#123456");
  });
});
