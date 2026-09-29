import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileDraft,
  loadPlanProject,
  validatePlanSource,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

/**
 * A writable copy of the sample's source and assets. Generated state is left
 * out: other test files run CLI commands on the shared sample (for example
 * `status`, whose reuse report creates and removes
 * `.naraframe/attempts/reuse-*`), and copying that directory while it churns
 * failed with ENOENT.
 */
const copySampleSource = (to: string) =>
  cp(sampleRoot, to, {
    recursive: true,
    filter: (source) =>
      !/[\\/](\.naraframe|preview|revisions)([\\/]|$)/.test(
        source.slice(sampleRoot.length),
      ),
  });

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("Krakatau draft project", () => {
  it("copies the shared sample's source without its generated state", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-copy-"));
    temporaryRoots.push(root);

    await copySampleSource(root);

    const entries = await readdir(root);
    expect(entries).toEqual(
      expect.arrayContaining([
        "assets",
        "naraframe.json",
        "profile.lock.json",
        "scenes.json",
      ]),
    );
    expect(entries).not.toContain(".naraframe");
    expect(entries).not.toContain("preview");
    expect(entries).not.toContain("revisions");
  });

  it("loads strict source JSON and compiles an 18-second vertical draft", async () => {
    const loaded = await loadPlanProject(sampleRoot);

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const compiled = compileDraft(loaded.value.source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    expect(compiled.value).toMatchObject({
      width: 540,
      height: 960,
      fps: 30,
      totalFrames: 540,
      scope: { type: "project" },
      timelineScope: "project",
      label: "DRAFT • NO AUDIO",
    });
    expect(
      compiled.value.scenes.map((scene) => [scene.startFrame, scene.endFrame]),
    ).toEqual([
      [0, 120],
      [120, 300],
      [300, 420],
      [420, 540],
    ]);
    expect(compiled.value.assets["krakatau-map"]).toMatchObject({
      kind: "png",
      publicPath: "assets/krakatau-map.png",
    });

    const repeatedCompile = compileDraft(loaded.value.source);
    expect(repeatedCompile.ok).toBe(true);
    if (repeatedCompile.ok) {
      expect(repeatedCompile.value.sourceRevision).toBe(
        compiled.value.sourceRevision,
      );
      expect(repeatedCompile.value.assemblyKey).toBe(
        compiled.value.assemblyKey,
      );
    }
  });

  it("compiles a selected scene onto a local half-open timeline", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const compiled = compileDraft(loaded.value.source, {
      type: "scene",
      sceneId: "context",
    });

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }
    expect(compiled.value).toMatchObject({
      totalFrames: 180,
      timelineScope: "local",
      scope: {
        type: "scene",
        sceneId: "context",
        sourceStartFrame: 120,
        sourceEndFrame: 300,
      },
    });
    expect(compiled.value.scenes).toHaveLength(1);
    expect(compiled.value.scenes[0]).toMatchObject({
      id: "context",
      startFrame: 0,
      endFrame: 180,
    });

    const scene = compiled.value.scenes[0];
    const map = scene?.layers.find((layer) => layer.id === "map-image");
    const copy = scene?.layers.find((layer) => layer.id === "context-copy");
    const reveal = scene?.beats.find((beat) => beat.id === "reveal-map");
    const emphasize = scene?.beats.find((beat) => beat.id === "pulse-marker");
    const focus = scene?.beats.find((beat) => beat.id === "focus-map");
    expect(map).toMatchObject({
      frame: { x: 65, y: 180, width: 410, height: 307.5 },
    });
    expect(copy).toMatchObject({
      type: "text",
      fontSize: 34,
      lineHeight: 1.15,
      overflowPolicy: "shrink",
    });
    expect(reveal).toMatchObject({
      action: "reveal",
      startFrame: 9,
      durationInFrames: 30,
      params: {
        direction: "left",
        distance: 40,
        easingPreset: "smooth",
      },
    });
    expect(emphasize).toMatchObject({
      action: "emphasize",
      startFrame: 63,
      durationInFrames: 27,
      params: { scale: 1.22, easingPreset: "smooth" },
    });
    expect(focus).toMatchObject({
      action: "focus",
      startFrame: 42,
      durationInFrames: 126,
      params: {
        camera: "push",
        intensity: 0.85,
        easingPreset: "smooth",
      },
    });
  });

  it("returns actionable compile errors for missing scenes and invalid boundaries", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const missing = compileDraft(loaded.value.source, {
      type: "scene",
      sceneId: "missing-scene",
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.issues).toContainEqual(
        expect.objectContaining({
          code: "SCENE_NOT_FOUND",
          path: "/scope/sceneId",
        }),
      );
    }

    const source = structuredClone(loaded.value.source);
    const context = source.scenes.scenes.find(
      (scene) => scene.id === "context",
    );
    if (context?.visual.type !== "composition") {
      throw new Error("Expected the sample context composition.");
    }
    const map = context.visual.layers.find((layer) => layer.id === "map-image");
    if (!map || map.type === "group") {
      throw new Error("Expected the sample map layer.");
    }
    map.frame.x = 1000;
    const outsideCanvas = compileDraft(source, {
      type: "scene",
      sceneId: "context",
    });
    expect(outsideCanvas.ok).toBe(false);
    if (!outsideCanvas.ok) {
      expect(outsideCanvas.issues.map((issue) => issue.code)).toContain(
        "LAYER_OUTSIDE_CANVAS",
      );
    }
  });

  it("keeps safe-zone findings as warnings and rejects beats past the scene end", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const safeZoneSource = structuredClone(loaded.value.source);
    const context = safeZoneSource.scenes.scenes.find(
      (scene) => scene.id === "context",
    );
    if (context?.visual.type !== "composition") {
      throw new Error("Expected the sample context composition.");
    }
    const copy = context.visual.layers.find(
      (layer) => layer.id === "context-copy",
    );
    if (copy?.type !== "text") {
      throw new Error("Expected the sample context text layer.");
    }
    copy.frame.x = 0;
    const warning = compileDraft(safeZoneSource, {
      type: "scene",
      sceneId: "context",
    });
    expect(warning.ok).toBe(true);
    expect(warning.issues).toContainEqual(
      expect.objectContaining({
        code: "TEXT_OUTSIDE_SAFE_ZONE",
        severity: "warning",
      }),
    );

    const beatSource = structuredClone(loaded.value.source);
    const beatContext = beatSource.scenes.scenes.find(
      (scene) => scene.id === "context",
    );
    if (!beatContext) {
      throw new Error("Expected the sample context scene.");
    }
    const focus = beatContext.beats.find((beat) => beat.id === "focus-map");
    if (!focus) {
      throw new Error("Expected the sample focus beat.");
    }
    focus.startMs = 5100;
    focus.durationMs = 1000;
    const outsideScene = compileDraft(beatSource, {
      type: "scene",
      sceneId: "context",
    });
    expect(outsideScene.ok).toBe(false);
    if (!outsideScene.ok) {
      expect(outsideScene.issues.map((issue) => issue.code)).toContain(
        "BEAT_OUTSIDE_SCENE",
      );
    }
  });

  it("rejects image references missing from the asset manifest", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const source = structuredClone(loaded.value.source);
    const context = source.scenes.scenes.find(
      (scene) => scene.id === "context",
    );
    if (context?.visual.type !== "composition") {
      throw new Error("Expected the sample context composition.");
    }
    const map = context.visual.layers.find((layer) => layer.id === "map-image");
    if (map?.type !== "image") {
      throw new Error("Expected the sample map image layer.");
    }
    map.assetId = "missing-map";

    const validated = validatePlanSource(source);
    expect(validated.ok).toBe(false);
    if (!validated.ok) {
      expect(validated.issues).toContainEqual(
        expect.objectContaining({
          code: "ASSET_UNDECLARED",
          path: "/scenes/1/visual/layers/1/assetId",
        }),
      );
    }
  });

  it("reports a missing required source file without throwing", async () => {
    const loaded = await loadPlanProject(`${sampleRoot}/does-not-exist`);

    expect(loaded.ok).toBe(false);
    if (loaded.ok) {
      return;
    }

    expect(loaded.issues).toHaveLength(4);
    expect(
      loaded.issues.every((issue) => issue.code === "SOURCE_MISSING"),
    ).toBe(true);
  });

  it("rejects a ready PNG whose contents do not match its locked hash", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-load-"));
    temporaryRoots.push(root);
    await copySampleSource(root);
    await writeFile(join(root, "assets/map.png"), "changed-image");
    const manifestPath = join(root, "assets/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assets[0] = {
      id: "krakatau-map",
      status: "ready",
      kind: "png",
      path: "assets/map.png",
      sha256: "0".repeat(64),
      origin: { type: "user" },
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const loaded = await loadPlanProject(root);

    expect(loaded.ok).toBe(false);
    if (loaded.ok) {
      return;
    }
    expect(loaded.issues.map((issue) => issue.code)).toContain(
      "ASSET_HASH_MISMATCH",
    );
  });

  it("stays free of M0.10 variety warnings at project scope after its transition migration", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const compiled = compileDraft(loaded.value.source);

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.issues.map((issue) => issue.code)).not.toContain(
      "SINGLE_TRANSITION_TYPE",
    );
  });

  it("does not run project-wide variety checks against a single scene", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const compiled = compileDraft(loaded.value.source, {
      type: "scene",
      sceneId: "context",
    });

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.issues).not.toContainEqual(
      expect.objectContaining({ code: "SINGLE_TRANSITION_TYPE" }),
    );
  });
});
