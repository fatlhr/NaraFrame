import { AssetManifestSchema, ScenesSchema } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const textLayer = () => ({
  id: "copy",
  type: "text" as const,
  text: "Krakatau",
  frame: { x: 100, y: 100, width: 400, height: 160 },
  opacity: 1,
  rotationDeg: 0,
  zIndex: 1,
});

const groupLayer = () => ({
  id: "copy-group",
  type: "group" as const,
  memberIds: ["copy"],
  transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
  zIndex: 2,
});

const sceneDocument = () => ({
  schemaVersion: 1 as const,
  scenes: [
    {
      id: "context",
      narrativeRole: "context",
      durationMs: 2000,
      visual: {
        type: "composition" as const,
        layers: [textLayer(), groupLayer()],
      },
      beats: [
        {
          id: "reveal-copy",
          targetId: "copy",
          action: "reveal" as const,
          startMs: 0,
          durationMs: 500,
          params: { direction: "up" as const, distance: 40 },
        },
      ],
      transition: { type: "cut" as const },
    },
  ],
});

const firstScene = (document: ReturnType<typeof sceneDocument>) => {
  const scene = document.scenes.at(0);
  if (!scene) {
    throw new Error("Expected the visual schema fixture scene.");
  }
  return scene;
};

const fixtureGroup = (document: ReturnType<typeof sceneDocument>) => {
  const group = firstScene(document).visual.layers.find(
    (layer) => layer.type === "group",
  );
  if (group?.type !== "group") {
    throw new Error("Expected the visual schema fixture group.");
  }
  return group;
};

describe("visual source schema", () => {
  it("accepts the bounded M0 layer, action, group, and cut contract", () => {
    expect(ScenesSchema.safeParse(sceneDocument()).success).toBe(true);
  });

  it("rejects unknown actions and raw executable or keyframe fields", () => {
    const unknownAction = sceneDocument();
    Object.assign(unknownAction.scenes[0]?.beats[0] ?? {}, {
      action: "bounce",
    });
    expect(ScenesSchema.safeParse(unknownAction).success).toBe(false);

    const rawKeyframes = sceneDocument();
    Object.assign(rawKeyframes.scenes[0]?.beats[0] ?? {}, {
      keyframes: [{ frame: 0, value: 0 }],
    });
    expect(ScenesSchema.safeParse(rawKeyframes).success).toBe(false);

    const executable = sceneDocument();
    Object.assign(executable.scenes[0]?.visual.layers[0] ?? {}, {
      code: "process.exit(1)",
    });
    expect(ScenesSchema.safeParse(executable).success).toBe(false);
  });

  it("rejects recursive, broken, duplicated, and multiply-owned group members", () => {
    const recursive = sceneDocument();
    fixtureGroup(recursive).memberIds = ["copy-group"];
    expect(ScenesSchema.safeParse(recursive).success).toBe(false);

    const broken = sceneDocument();
    fixtureGroup(broken).memberIds = ["missing-layer"];
    expect(ScenesSchema.safeParse(broken).success).toBe(false);

    const duplicated = sceneDocument();
    fixtureGroup(duplicated).memberIds = ["copy", "copy"];
    expect(ScenesSchema.safeParse(duplicated).success).toBe(false);

    const multipleOwners = sceneDocument();
    firstScene(multipleOwners).visual.layers.push({
      ...groupLayer(),
      id: "second-group",
    });
    expect(ScenesSchema.safeParse(multipleOwners).success).toBe(false);
  });

  it("rejects SVG or video assets", () => {
    for (const kind of ["svg", "video"]) {
      expect(
        AssetManifestSchema.safeParse({
          schemaVersion: 1,
          assets: [
            {
              id: "unsupported",
              status: "ready",
              kind,
              path: `assets/source.${kind === "svg" ? "svg" : "mp4"}`,
              sha256: "0".repeat(64),
              origin: { type: "user" },
            },
          ],
        }).success,
      ).toBe(false);
    }
  });
});
