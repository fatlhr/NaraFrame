import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const sampleRoot = join(repositoryRoot, "samples", "krakatau-draft");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
// A local OFL face. It is read, never redistributed: the test skips without it.
const localFont = join(
  homedir(),
  "Library",
  "Fonts",
  "SourceCodePro[wght].ttf",
);
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((r) => rm(r, { recursive: true, force: true })),
  );
});

interface Event {
  success: boolean;
  readiness: string;
  issues: Array<{ code: string; severity: string; message: string }>;
}

const preview = async (project: string): Promise<Event> => {
  const stdout = await run(
    process.execPath,
    [cliEntry, "preview", project, "--draft", "--rerender", "--json"],
    { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  ).then(
    (result) => result.stdout,
    (error: { stdout?: string }) => error.stdout ?? "",
  );
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as Event;
};

/** One short scene whose display role is set in a bundled face. */
const makeProject = async (fontBytes: Buffer): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-font-"));
  roots.push(root);
  for (const entry of [
    "naraframe.json",
    "assets",
    "scenes.json",
    "profile.lock.json",
  ]) {
    await cp(join(sampleRoot, entry), join(root, entry), { recursive: true });
  }

  const fontPath = "assets/profile/probe.ttf";
  await mkdir(join(root, "assets", "profile"), { recursive: true });
  await writeFile(join(root, fontPath), fontBytes);
  const lock = JSON.parse(
    await readFile(join(root, "profile.lock.json"), "utf8"),
  );
  lock.assets = [
    {
      id: "probe-face",
      kind: "font",
      path: fontPath,
      sha256: createHash("sha256").update(fontBytes).digest("hex"),
      family: "NaraFrame Probe Display",
      weight: 700,
    },
  ];
  lock.render.typography.displayFontFamily = "NaraFrame Probe Display";
  lock.duration = { preferredMinMs: 100, preferredMaxMs: 600_000 };
  await writeFile(
    join(root, "profile.lock.json"),
    JSON.stringify(lock, null, 2),
  );

  const scenes = JSON.parse(await readFile(join(root, "scenes.json"), "utf8"));
  scenes.scenes = [
    {
      ...scenes.scenes[0],
      durationMs: 500,
      visual: { type: "text", text: "Probe" },
      beats: [],
      transition: { type: "cut" },
    },
  ];
  await writeFile(join(root, "scenes.json"), JSON.stringify(scenes, null, 2));
  return root;
};

describe("bundled fonts in the frame render context", () => {
  it("stops the render and names the face when a bundled font cannot be used", async () => {
    // Valid-looking file, unparseable as a font: the browser registers
    // nothing, and a frame drawn now would silently use a substitute.
    const project = await makeProject(Buffer.from("NOT-A-FONT".repeat(64)));
    const event = await preview(project);

    expect(event.success).toBe(false);
    expect(event.readiness).toBe("invalid");
    const issue = event.issues.find(
      (entry) => entry.code === "FONT_NOT_LOADED",
    );
    expect(issue, JSON.stringify(event.issues)).toBeDefined();
    expect(issue?.severity).toBe("error");
    // The message has to say which face, or it cannot be acted on.
    expect(issue?.message).toContain("NaraFrame Probe Display");
    expect(issue?.message).toContain("700");
  }, 600_000);

  it.skipIf(!existsSync(localFont))(
    "renders when the bundled font really is available",
    async () => {
      const project = await makeProject(await readFile(localFont));
      const event = await preview(project);
      expect(event.success, JSON.stringify(event.issues)).toBe(true);
      expect(
        event.issues.filter((entry) => entry.code === "FONT_NOT_LOADED"),
      ).toEqual([]);
    },
    600_000,
  );
});
