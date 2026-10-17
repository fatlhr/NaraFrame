import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const roots: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

interface Event {
  status: string;
  success: boolean;
  issues: Array<{ code: string }>;
  data: Record<string, unknown>;
}

const run = async (
  ...args: string[]
): Promise<{ exitCode: number; event: Event }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(String(value));
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitCode = await runCli([...args, "--json"]);
  vi.restoreAllMocks();
  return { exitCode, event: JSON.parse(writes.at(-1) ?? "{}") as Event };
};

const tmp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-profile-cli-"));
  roots.push(dir);
  return dir;
};

interface ProfileJson {
  version: string;
  render: { palette: { accent: string } };
  production: { voiceStyleSignature: string };
}

const base: ProfileJson = JSON.parse(
  await readFile(
    new URL(
      "../../../../profiles/current-issues/profile.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

const candidate = async (
  patch: (profile: ProfileJson) => void,
): Promise<string> => {
  const dir = await tmp();
  const profile = structuredClone(base);
  patch(profile);
  await writeFile(join(dir, "profile.json"), JSON.stringify(profile));
  await writeFile(join(dir, "direction.md"), "A different direction.");
  return dir;
};

describe("profile command", () => {
  it("inspects a profile without a project", async () => {
    const { exitCode, event } = await run(
      "profile",
      "inspect",
      "current-issues",
    );
    expect(exitCode).toBe(0);
    expect((event.data.profile as { id: string }).id).toBe("current-issues");
    expect(
      (event.data.profile as { overridablePaths: string[] }).overridablePaths,
    ).toContain("render.palette");
  });

  it("reports a profile's brand, audio default and asset roles", async () => {
    const dir = await candidate((profile) => {
      const patched = profile as ProfileJson & {
        brand?: unknown;
        production: { audioMode?: string };
      };
      patched.brand = {
        name: "Example",
        cta: { label: "Join", url: "example.org" },
      };
      patched.production.audioMode = "music";
    });
    const { exitCode, event } = await run("profile", "inspect", dir);
    expect(exitCode).toBe(0);
    expect(event.data.profile).toMatchObject({
      audioMode: "music",
      brand: { name: "Example", cta: { label: "Join", url: "example.org" } },
    });
  });

  it("dry-runs and applies a new profile version, then undo restores it", async () => {
    const parent = await tmp();
    const root = join(parent, "demo");
    expect(
      (await run("create", root, "--profile", "current-issues")).exitCode,
    ).toBe(0);
    const next = await candidate((profile) => {
      profile.version = "9.9.9";
      profile.render.palette.accent = "#00AA55";
      profile.production.voiceStyleSignature = "another-voice";
    });
    const before = await readFile(join(root, "profile.lock.json"), "utf8");

    const dry = await run("profile", "apply", next, root, "--dry-run");
    expect(dry.exitCode).toBe(0);
    expect(dry.event.data.applied).toBe(false);
    // The created project has no narration, so there is no voice to redo.
    expect(
      (dry.event.data.plan as { effects: string[] }).effects,
    ).not.toContain("regenerate-narration");
    expect(await readFile(join(root, "profile.lock.json"), "utf8")).toBe(
      before,
    );

    const applied = await run("profile", "apply", next, root);
    expect(applied.exitCode, JSON.stringify(applied.event.issues)).toBe(0);
    expect(applied.event.data.applied).toBe(true);
    expect(
      JSON.parse(await readFile(join(root, "naraframe.json"), "utf8")).profile
        .version,
    ).toBe("9.9.9");

    expect((await run("undo", root)).exitCode).toBe(0);
    expect(await readFile(join(root, "profile.lock.json"), "utf8")).toBe(
      before,
    );
  });

  it("summarises the scene review in the text output and keeps it in the JSON plan", async () => {
    const parent = await tmp();
    const root = join(parent, "demo");
    expect(
      (await run("create", root, "--profile", "current-issues")).exitCode,
    ).toBe(0);
    const sample = new URL(
      "../../../../samples/krakatau-draft/",
      import.meta.url,
    ).pathname;
    await cp(join(sample, "assets"), join(root, "assets"), {
      recursive: true,
      force: true,
    });
    const scenes = JSON.parse(
      await readFile(join(sample, "scenes.json"), "utf8"),
    );
    const context = scenes.scenes.find(
      (scene: { id: string }) => scene.id === "context",
    );
    for (const layer of context.visual.layers) {
      if (layer.id === "eruption-ring") layer.fill = "palette.accent";
    }
    await writeFile(join(root, "scenes.json"), JSON.stringify(scenes, null, 2));
    const next = await candidate((profile) => {
      profile.version = "9.9.9";
      profile.render.palette.accent = "#00AA55";
    });

    const dry = await run("profile", "apply", next, root, "--dry-run");
    expect(dry.exitCode).toBe(0);
    const review = (
      dry.event.data.plan as {
        review: {
          paletteBound: Array<{
            layerId: string;
            before: string;
            after: string;
          }>;
          imageLayers: Array<{ assetId: string }>;
        };
      }
    ).review;
    expect(review.paletteBound).toMatchObject([
      { layerId: "eruption-ring", after: "#00AA55" },
    ]);
    expect(review.imageLayers).toEqual([
      { sceneId: "context", layerId: "map-image", assetId: "krakatau-map" },
    ]);

    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line: unknown) => {
      lines.push(String(line));
    });
    expect(await runCli(["profile", "apply", next, root, "--dry-run"])).toBe(0);
    vi.restoreAllMocks();
    expect(lines.filter((line) => line.startsWith("Review:"))).toEqual([
      `Review: palette.accent ${review.paletteBound[0]?.before} -> #00AA55 repaints 1 layer`,
      expect.stringContaining(
        "hex colours the switch will not repaint on 2 layers",
      ),
      "Review: images to check against the new profile on 1 layer (krakatau-map)",
    ]);
  });

  it("fails on a bad subcommand", async () => {
    const { exitCode } = await run("profile", "nope");
    expect(exitCode).not.toBe(0);
  });
});
