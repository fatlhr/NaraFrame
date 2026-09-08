import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("Krakatau draft project", () => {
  it("loads strict source JSON and compiles a 15-second vertical draft", async () => {
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
      totalFrames: 450,
      label: "DRAFT • NO AUDIO",
    });
    expect(
      compiled.value.scenes.map((scene) => [scene.startFrame, scene.endFrame]),
    ).toEqual([
      [0, 150],
      [150, 300],
      [300, 450],
    ]);
    expect(compiled.value.assets["krakatau-map"]).toMatchObject({
      kind: "placeholder",
      assetId: "krakatau-map",
    });

    const repeatedCompile = compileDraft(loaded.value.source);
    expect(repeatedCompile.ok).toBe(true);
    if (repeatedCompile.ok) {
      expect(repeatedCompile.value.sourceRevision).toBe(
        compiled.value.sourceRevision,
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
    await cp(sampleRoot, root, { recursive: true });
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
});
