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

interface Listed {
  id: string;
  version: string;
  summary: string;
  requireSourcing: boolean;
  preferredDurationMs: { min: number; max: number };
  voiceStyleSignature: string;
  path: string;
}

describe("profile list", () => {
  it("lists the built-in profiles with what is needed to choose one", async () => {
    const { exitCode, event } = await run("profile", "list");
    expect(exitCode).toBe(0);
    expect(event.success).toBe(true);
    expect(event.data.action).toBe("list");
    const profiles = event.data.profiles as Listed[];
    expect(profiles.map((profile) => profile.id)).toEqual([
      "current-issues",
      "general-explainer",
    ]);
    const byId = Object.fromEntries(
      profiles.map((profile) => [profile.id, profile]),
    );
    expect(byId["current-issues"]).toMatchObject({
      version: "0.3.0",
      requireSourcing: true,
      preferredDurationMs: { min: 15000, max: 30000 },
      voiceStyleSignature: "id-editorial-grounded-v1",
      summary: expect.stringMatching(/^Explain a current event .*\.$/),
    });
    expect(byId["general-explainer"]).toMatchObject({
      version: "1.0.0",
      requireSourcing: false,
      preferredDurationMs: { min: 15000, max: 60000 },
      voiceStyleSignature: "id-teaching-warm-v1",
      summary:
        "Teach one idea from a stable subject: how something works, what the numbers say, how two things differ.",
    });
    for (const profile of profiles) {
      expect(profile.path).toMatch(new RegExp(`/profiles/${profile.id}$`));
      // The id in the list is exactly what `create --profile` accepts.
      expect(
        (await run("profile", "inspect", profile.id)).event.data,
      ).toMatchObject({ profile: { id: profile.id } });
    }
  });

  it("prints one line per profile in text mode and takes no arguments", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line: unknown) => {
      lines.push(String(line));
    });
    expect(await runCli(["profile", "list"])).toBe(0);
    vi.restoreAllMocks();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(
      /^current-issues@0\.3\.0 \| sources required \| 15-30 s \| voice id-editorial-grounded-v1 \| Explain/,
    );
    expect(lines[1]).toMatch(
      /^general-explainer@1\.0\.0 \| sources optional \| 15-60 s \| voice id-teaching-warm-v1 \| Teach one idea/,
    );
    expect((await run("profile", "list", "extra")).exitCode).toBe(3);
  });

  it("creates, validates and inspects a project from general-explainer", async () => {
    const parent = await tmp();
    const root = join(parent, "one-off");
    expect(
      (await run("create", root, "--profile", "general-explainer")).exitCode,
    ).toBe(0);
    const lock = JSON.parse(
      await readFile(join(root, "profile.lock.json"), "utf8"),
    );
    expect(lock).toMatchObject({
      id: "general-explainer",
      production: { requireSourcing: false },
      source: {
        kind: "repository",
        identity: "profiles/general-explainer@1.0.0",
      },
    });
  });

  it("is the profile the general-explainer reference project was built with", async () => {
    const parent = await tmp();
    const project = join(parent, "reference");
    await cp(
      new URL(
        "../../../../test-fixtures/project-general-explainer",
        import.meta.url,
      ),
      project,
      { recursive: true },
    );
    const dry = await run(
      "profile",
      "apply",
      "general-explainer",
      project,
      "--dry-run",
    );
    expect(dry.exitCode).toBe(0);
    expect(dry.event.data).toMatchObject({
      plan: {
        changes: [],
        from: { version: "1.0.0" },
        to: { version: "1.0.0" },
      },
    });
    expect((await run("validate", project, "--stage", "plan")).exitCode).toBe(
      0,
    );
  });
});

describe("profile new", () => {
  const base = [
    "--from",
    "general-explainer",
    "--name",
    "Weekly Science",
    "--background",
    "#10261F",
    "--accent",
    "#FFB000",
  ];

  it("makes a series profile from a name and colours that inspects, creates and keeps its colours readable", async () => {
    const parent = await tmp();
    const folder = join(parent, "profiles", "weekly-science");
    const made = await run(
      "profile",
      "new",
      folder,
      ...base,
      "--language",
      "English",
    );
    expect(made.exitCode, JSON.stringify(made.event.issues)).toBe(0);
    expect(made.event.data).toMatchObject({
      action: "new",
      path: folder,
      palette: {
        background: "#10261F",
        text: "#F2EFE6",
        accent: "#FFB000",
      },
      profile: { id: "weekly-science", version: "1.0.0" },
    });
    const palette = (made.event.data as { palette: Record<string, string> })
      .palette;
    expect(palette.surface).toMatch(/^#[0-9A-F]{6}$/);

    const profile = JSON.parse(
      await readFile(join(folder, "profile.json"), "utf8"),
    );
    expect(profile.id).toBe("weekly-science");
    expect(profile.render.palette).toEqual(palette);
    // The outline follows the panel colour, as it did in the profile it came from.
    expect(profile.render.appearance.stroke.color).toBe(palette.surface);
    const direction = await readFile(join(folder, "direction.md"), "utf8");
    expect(direction).toContain("# Weekly Science");
    expect(direction).toContain("Language: English.");
    expect(direction).toContain("#FFB000");
    expect(direction).toMatch(/Sourcing:/);

    // It is a profile like any other: inspect reads it, create pins it.
    const inspected = await run("profile", "inspect", folder);
    expect(inspected.exitCode).toBe(0);
    const project = join(parent, "episode-1");
    expect((await run("create", project, "--profile", folder)).exitCode).toBe(
      0,
    );
    expect(
      JSON.parse(await readFile(join(project, "profile.lock.json"), "utf8"))
        .render.palette,
    ).toEqual(palette);
  });

  it("derives a light series' text and panel colours too", async () => {
    const parent = await tmp();
    const made = await run(
      "profile",
      "new",
      join(parent, "light"),
      "--from",
      "current-issues",
      "--name",
      "Pagi Cerah",
      "--background",
      "FAF7F0",
      "--accent",
      "#C2410C",
    );
    expect(made.exitCode).toBe(0);
    const palette = (made.event.data as { palette: Record<string, string> })
      .palette;
    expect(palette.text).toBe("#15130F");
    expect(palette.background).toBe("#FAF7F0");
    expect(palette.surface).not.toBe(palette.background);
  });

  it("keeps a text colour the owner gave, and refuses colours too close to read", async () => {
    const parent = await tmp();
    const kept = await run(
      "profile",
      "new",
      join(parent, "a"),
      ...base,
      "--text",
      "#ffffff",
    );
    expect(
      (kept.event.data as { palette: { text: string } }).palette.text,
    ).toBe("#FFFFFF");
    const muddy = await run(
      "profile",
      "new",
      join(parent, "b"),
      ...base,
      "--text",
      "#223322",
    );
    expect(muddy.exitCode).toBe(1);
    expect(muddy.event.issues.map((issue) => issue.code)).toEqual([
      "PROFILE_COLOURS_TOO_CLOSE",
    ]);
    const flat = await run(
      "profile",
      "new",
      join(parent, "c"),
      "--from",
      "general-explainer",
      "--name",
      "Flat",
      "--background",
      "#10261F",
      "--accent",
      "#11291F",
    );
    expect(flat.event.issues.map((issue) => issue.code)).toEqual([
      "PROFILE_COLOURS_TOO_CLOSE",
    ]);
    const odd = await run(
      "profile",
      "new",
      join(parent, "d"),
      ...base.slice(0, 7),
      "red",
    );
    expect(odd.event.issues.map((issue) => issue.code)).toEqual([
      "PROFILE_COLOUR_INVALID",
    ]);
    // Nothing is left behind by a refusal.
    await expect(readFile(join(parent, "b", "profile.json"))).rejects.toThrow();
  });

  it("refuses a target folder that already has files and a missing option", async () => {
    const parent = await tmp();
    const folder = join(parent, "taken");
    expect((await run("profile", "new", folder, ...base)).exitCode).toBe(0);
    const again = await run("profile", "new", folder, ...base);
    expect(again.exitCode).toBe(1);
    expect(again.event.issues.map((issue) => issue.code)).toEqual([
      "PROFILE_TARGET_EXISTS",
    ]);
    expect(
      (
        await run(
          "profile",
          "new",
          join(parent, "x"),
          "--from",
          "general-explainer",
        )
      ).exitCode,
    ).toBe(3);
  });

  it("makes the id from the name in lowercase kebab-case without accents", async () => {
    const parent = await tmp();
    const made = await run(
      "profile",
      "new",
      join(parent, "p"),
      "--from",
      "general-explainer",
      "--name",
      "  Seri Sains Ringkas!  ",
      "--background",
      "#10261F",
      "--accent",
      "#FFB000",
    );
    expect((made.event.data as { profile: { id: string } }).profile.id).toBe(
      "seri-sains-ringkas",
    );
    const none = await run(
      "profile",
      "new",
      join(parent, "q"),
      "--from",
      "general-explainer",
      "--name",
      "!!!",
      "--background",
      "#10261F",
      "--accent",
      "#FFB000",
    );
    expect(none.event.issues.map((issue) => issue.code)).toEqual([
      "PROFILE_NAME_INVALID",
    ]);
  });
});
