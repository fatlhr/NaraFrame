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

  it("accepts named easing presets and rejects arbitrary easing code", () => {
    const smooth = sceneDocument();
    Object.assign(smooth.scenes[0]?.beats[0]?.params ?? {}, {
      easingPreset: "smooth",
    });
    expect(ScenesSchema.safeParse(smooth).success).toBe(true);

    const arbitrary = sceneDocument();
    Object.assign(arbitrary.scenes[0]?.beats[0]?.params ?? {}, {
      easingPreset: "spring(300, 20)",
    });
    expect(ScenesSchema.safeParse(arbitrary).success).toBe(false);
  });

  it("accepts bounded appearance, typography, layout, and camera anchors", () => {
    const document = sceneDocument();
    const copy = firstScene(document).visual.layers[0];
    if (copy?.type !== "text") throw new Error("Expected text fixture.");
    Object.assign(copy, {
      role: "heading",
      fontSize: 72,
      lineHeight: 0.98,
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      maxLines: 2,
      overflowPolicy: "shrink",
    });
    const group = fixtureGroup(document);
    Object.assign(group, {
      frame: { x: 80, y: 80, width: 600, height: 320 },
      layout: {
        type: "stack",
        direction: "vertical",
        gap: 24,
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        align: "start",
      },
    });
    Object.assign(firstScene(document).beats[0] ?? {}, {
      action: "focus",
      params: {
        camera: "zoom",
        intensity: 0.8,
        anchor: { x: 0.25, y: 0.75 },
      },
    });

    expect(ScenesSchema.safeParse(document).success).toBe(true);
  });

  it("rejects unbounded appearance and layout values", () => {
    const invalidRadius = sceneDocument();
    Object.assign(firstScene(invalidRadius).visual.layers[0] ?? {}, {
      fontSize: 5000,
    });
    expect(ScenesSchema.safeParse(invalidRadius).success).toBe(false);

    const missingLayoutFrame = sceneDocument();
    Object.assign(fixtureGroup(missingLayoutFrame), {
      layout: { type: "grid", columns: 2, gap: 20 },
    });
    expect(ScenesSchema.safeParse(missingLayoutFrame).success).toBe(false);

    const invalidAnchor = sceneDocument();
    Object.assign(firstScene(invalidAnchor).beats[0] ?? {}, {
      action: "focus",
      params: {
        camera: "zoom",
        intensity: 0.8,
        anchor: { x: 1.4, y: 0.5 },
      },
    });
    expect(ScenesSchema.safeParse(invalidAnchor).success).toBe(false);
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

  it("rejects duplicate scene or beat IDs and unresolved beat targets", () => {
    const duplicateScene = sceneDocument();
    duplicateScene.scenes.push(structuredClone(firstScene(duplicateScene)));
    expect(ScenesSchema.safeParse(duplicateScene).success).toBe(false);

    const duplicateBeat = sceneDocument();
    firstScene(duplicateBeat).beats.push(
      structuredClone(firstScene(duplicateBeat).beats[0] as never),
    );
    expect(ScenesSchema.safeParse(duplicateBeat).success).toBe(false);

    const missingTarget = sceneDocument();
    const beat = firstScene(missingTarget).beats[0];
    if (!beat) throw new Error("Expected the visual schema fixture beat.");
    beat.targetId = "missing-layer";
    expect(ScenesSchema.safeParse(missingTarget).success).toBe(false);
  });

  it("accepts a vector asset and still rejects video", () => {
    const manifest = (kind: string, extension: string) => ({
      schemaVersion: 1,
      assets: [
        {
          id: "artwork",
          status: "ready",
          kind,
          path: `assets/source.${extension}`,
          sha256: "0".repeat(64),
          origin: { type: "user" },
        },
      ],
    });
    // SVG is supported since M2.4.1; it is read and sanitised by the loader.
    expect(AssetManifestSchema.safeParse(manifest("svg", "svg")).success).toBe(
      true,
    );
    // An SVG asset must actually be an .svg file.
    expect(AssetManifestSchema.safeParse(manifest("svg", "png")).success).toBe(
      false,
    );
    expect(
      AssetManifestSchema.safeParse(manifest("video", "mp4")).success,
    ).toBe(false);
  });
});
