/** An on-disk project with one recipe scene, for recipe tests. */
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";
import { narratedSource } from "./narrated-source.js";

const fixtureRecipe = fileURLToPath(
  new URL("../../../../test-fixtures/recipes/frame-card", import.meta.url),
);

export const sha = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");

/** A valid, solid-colour RGB PNG of the given size. */
export const png = (width: number, height: number): Buffer => {
  const chunk = (type: string, data: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(
      crc32(Buffer.concat([Buffer.from(type, "ascii"), data])),
      0,
    );
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x80)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

export const cardParams = (overrides: Record<string, unknown> = {}) => ({
  title: "Recipe card",
  image: {
    assetId: "photo",
    crop: { x: 0, y: 0, width: 200, height: 200 },
    focusCrop: { x: 50, y: 50, width: 100, height: 100 },
  },
  ...overrides,
});

export const makeRecipeProject = async (
  params: Record<string, unknown> = cardParams(),
  options: {
    beats?: unknown[];
    declare?: boolean;
    track?: (root: string) => void;
  } = {},
): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-recipe-"));
  options.track?.(root);
  const base = narratedSource();
  await mkdir(join(root, "assets"), { recursive: true });
  const photo = png(200, 300);
  await writeFile(join(root, "assets", "photo.png"), photo);
  await cp(fixtureRecipe, join(root, "recipes", "frame-card"), {
    recursive: true,
  });
  const write = (name: string, value: unknown) =>
    writeFile(join(root, name), `${JSON.stringify(value, null, 2)}\n`);
  await write("naraframe.json", {
    ...base.project,
    audioMode: "silent",
    ...(options.declare === false
      ? {}
      : { recipes: [{ id: "frame-card", path: "recipes/frame-card" }] }),
  });
  await write("profile.lock.json", {
    ...base.profile,
    direction: { text: "Probe direction.", sha256: sha("Probe direction.") },
  });
  await write("scenes.json", {
    schemaVersion: 1,
    scenes: [
      {
        id: "card",
        narrativeRole: "cta",
        durationMs: 1000,
        visual: { type: "recipe", recipe: "frame-card", params },
        beats: options.beats ?? [],
        transition: { type: "cut" },
      },
    ],
  });
  await write("assets/manifest.json", {
    schemaVersion: 1,
    assets: [
      {
        id: "photo",
        status: "ready",
        kind: "png",
        path: "assets/photo.png",
        sha256: sha(photo),
        origin: { type: "generated" },
      },
    ],
  });
  return root;
};
