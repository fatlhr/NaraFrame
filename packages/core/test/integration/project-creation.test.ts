import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProject, loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

const profileSource = (asset: Record<string, unknown>) => ({
  schemaVersion: 1,
  id: "test-profile",
  version: "1.0.0",
  render: {
    palette: {
      background: "#111111",
      surface: "#EEEEEE",
      text: "#FFFFFF",
      accent: "#FF5500",
    },
    typography: {
      fontFamily: "Arial, sans-serif",
      headingWeight: 800,
      bodyWeight: 500,
    },
    safeZone: { top: 80, right: 44, bottom: 100, left: 44 },
    spacingUnit: 8,
    motion: {
      revealDurationMs: 500,
      emphasizeScale: 1.08,
      focusScale: 1.06,
    },
  },
  production: {
    voiceStyleSignature: "test-voice-v1",
    illustrationStyleSignature: "test-illustration-v1",
    timing: { wordLevelRequired: false },
    assetPolicy: { allowPlannedInDraft: true },
  },
  duration: { preferredMinMs: 15_000, preferredMaxMs: 30_000 },
  lockedPaths: ["format.design", "format.draft"],
  overridablePaths: ["render.palette"],
  assets: [asset],
});

const makeRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-create-"));
  temporaryRoots.push(root);
  return root;
};

const writeProfile = async (
  directory: string,
  asset: Record<string, unknown>,
): Promise<void> => {
  await writeFile(
    join(directory, "profile.json"),
    `${JSON.stringify(profileSource(asset), null, 2)}\n`,
  );
  await writeFile(join(directory, "direction.md"), "Portable direction.\n");
};

const createFrom = async (root: string, profileDirectory: string) =>
  createProject({
    destination: join(root, "created-project"),
    projectId: "created-project",
    title: "Created Project",
    profileDirectory,
    profileSource: { kind: "local", identity: "test-profile" },
  });

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("project creation", () => {
  it("copies and locks profile assets so the project survives without its source profile", async () => {
    const root = await makeRoot();
    const profileDirectory = join(root, "source-profile");
    await mkdir(profileDirectory, { recursive: true });
    await writeFile(join(profileDirectory, "brand.png"), "profile-asset");
    await writeProfile(profileDirectory, {
      id: "brand-mark",
      kind: "png",
      path: "brand.png",
    });

    const created = await createFrom(root, profileDirectory);

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const locked = JSON.parse(
      await readFile(join(created.value.root, "profile.lock.json"), "utf8"),
    );
    expect(locked.source.identity).toBe("test-profile@1.0.0");
    expect(locked.direction.text).toBe("Portable direction.\n");
    expect(locked.assets[0].path).toMatch(
      /^assets\/profile\/[a-f0-9]{64}\.png$/,
    );
    expect(
      await readFile(join(created.value.root, locked.assets[0].path), "utf8"),
    ).toBe("profile-asset");

    await rm(profileDirectory, { recursive: true });
    const loaded = await loadPlanProject(created.value.root);
    expect(loaded.ok).toBe(true);
  });

  it("rejects a profile asset symlink that escapes the profile directory", async () => {
    const root = await makeRoot();
    const profileDirectory = join(root, "source-profile");
    await mkdir(profileDirectory, { recursive: true });
    await writeFile(join(root, "outside.png"), "outside");
    await symlink(
      join(root, "outside.png"),
      join(profileDirectory, "brand.png"),
    );
    await writeProfile(profileDirectory, {
      id: "brand-mark",
      kind: "png",
      path: "brand.png",
    });

    const created = await createFrom(root, profileDirectory);

    expect(created.ok).toBe(false);
    if (created.ok) {
      return;
    }
    expect(created.issues.map((issue) => issue.code)).toContain(
      "ASSET_PATH_UNSAFE",
    );
  });

  it("rejects a declared profile asset hash that does not match", async () => {
    const root = await makeRoot();
    const profileDirectory = join(root, "source-profile");
    await mkdir(profileDirectory, { recursive: true });
    await writeFile(join(profileDirectory, "brand.png"), "profile-asset");
    await writeProfile(profileDirectory, {
      id: "brand-mark",
      kind: "png",
      path: "brand.png",
      sha256: "0".repeat(64),
    });

    const created = await createFrom(root, profileDirectory);

    expect(created.ok).toBe(false);
    if (created.ok) {
      return;
    }
    expect(created.issues.map((issue) => issue.code)).toContain(
      "ASSET_HASH_MISMATCH",
    );
  });

  it.each([
    "../brand.png",
    "/tmp/brand.png",
    "https://example.com/brand.png",
    "nested\\brand.png",
  ])("rejects unsafe profile asset path %s", async (assetPath) => {
    const root = await makeRoot();
    const profileDirectory = join(root, "source-profile");
    await mkdir(profileDirectory, { recursive: true });
    await writeProfile(profileDirectory, {
      id: "brand-mark",
      kind: "png",
      path: assetPath,
    });

    const created = await createFrom(root, profileDirectory);

    expect(created.ok).toBe(false);
    if (created.ok) {
      return;
    }
    expect(created.issues.map((issue) => issue.code)).toContain(
      "SCHEMA_INVALID",
    );
  });
});
