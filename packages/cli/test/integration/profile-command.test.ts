import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
    expect((dry.event.data.plan as { effects: string[] }).effects).toContain(
      "regenerate-narration",
    );
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

  it("fails on a bad subcommand", async () => {
    const { exitCode } = await run("profile", "nope");
    expect(exitCode).not.toBe(0);
  });
});
