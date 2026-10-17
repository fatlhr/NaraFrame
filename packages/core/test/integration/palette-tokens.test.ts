import type { PlanSource } from "@naraframe/core";
import { compileDraft, computeSceneRenderKeys } from "@naraframe/core";
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

/** A scene whose shape and image carry strokes of the given colours. */
const strokeScene = (shapeStroke: string, imageStroke: string): PlanSource => {
  const base = tokenScene();
  const scenes = base.scenes.scenes.map((scene, index) =>
    index !== 0
      ? scene
      : {
          ...scene,
          visual: {
            type: "composition" as const,
            layers: [
              {
                id: "panel",
                type: "shape" as const,
                shape: "rectangle" as const,
                fill: "#123456",
                frame: { x: 88, y: 600, width: 300, height: 80 },
                stroke: { color: shapeStroke, width: 6 },
                opacity: 1,
                rotationDeg: 0,
                zIndex: 0,
              },
              {
                id: "photo",
                type: "image" as const,
                assetId: "plate",
                fit: "cover" as const,
                frame: { x: 88, y: 800, width: 300, height: 200 },
                stroke: { color: imageStroke, width: 4 },
                opacity: 1,
                rotationDeg: 0,
                zIndex: 0,
              },
            ],
          },
        },
  );
  return {
    ...base,
    scenes: { ...base.scenes, scenes },
    assets: {
      ...base.assets,
      assets: [
        ...base.assets.assets,
        {
          id: "plate",
          status: "ready",
          kind: "png",
          path: "assets/plate.png",
          sha256: "c".repeat(64),
          origin: { type: "user", source: "test" },
        },
      ],
    },
  } as PlanSource;
};

const strokesOf = (source: PlanSource) => {
  const result = compileDraft(source);
  if (!result.ok)
    throw new Error(`compile failed: ${result.issues.map((i) => i.code)}`);
  const scene = result.value.scenes[0];
  const stroke = (id: string) => {
    const layer = scene?.layers.find((item) => item.id === id);
    return layer && (layer.type === "shape" || layer.type === "image")
      ? layer.stroke?.color
      : undefined;
  };
  return {
    panel: stroke("panel"),
    photo: stroke("photo"),
    renderKey: computeSceneRenderKeys(result.value)[0],
    assemblyKey: result.value.assemblyKey,
  };
};

describe("palette tokens in shape and image strokes", () => {
  it("resolves to the profile's colours, as a path stroke does", () => {
    const strokes = strokesOf(strokeScene("palette.accent", "palette.text"));
    expect(strokes.panel).toBe("#FF5A36");
    expect(strokes.photo).toBe("#F5F1E8");
  });

  it("follows the profile when the palette changes", () => {
    const swapped = withPalette(strokeScene("palette.accent", "palette.text"), {
      background: "#F4F1EA",
      surface: "#1C2733",
      text: "#16202B",
      accent: "#0B7A75",
    });
    const strokes = strokesOf(swapped);
    expect(strokes.panel).toBe("#0B7A75");
    expect(strokes.photo).toBe("#16202B");
  });

  it("compiles a hex stroke untouched, and a token to the same render key as its hex", () => {
    const literal = strokesOf(strokeScene("#FF5A36", "#F5F1E8"));
    expect(literal.panel).toBe("#FF5A36");
    expect(literal.photo).toBe("#F5F1E8");
    const tokened = strokesOf(strokeScene("palette.accent", "palette.text"));
    // The render key sees only resolved colours, so moving a project from
    // hex to tokens that resolve to the same colours re-renders nothing.
    expect(tokened.renderKey).toEqual(literal.renderKey);
    expect(tokened.assemblyKey).toBe(literal.assemblyKey);
  });
});
