import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

interface Event {
  success: boolean;
  buildId: string | null;
  artifacts: Record<string, string>;
  data: Record<string, unknown>;
  issues: Array<{ code: string; severity: string }>;
}

const cli = async (...args: string[]): Promise<Event> => {
  const { stdout } = await run(
    process.execPath,
    [cliEntry, ...args, "--json"],
    { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  ).catch((error: { stdout?: string }) => ({ stdout: error.stdout ?? "{}" }));
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as Event;
};

const probe = async (video: string) => {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames",
    "-of",
    "json",
    video,
  ]);
  return (
    JSON.parse(stdout) as { streams: Array<Record<string, string | number>> }
  ).streams;
};

const decodes = async (video: string): Promise<void> => {
  await run("ffmpeg", [
    "-v",
    "error",
    "-xerror",
    "-i",
    video,
    "-f",
    "null",
    "-",
  ]);
};

/** Two explicitly timed one-second scenes on the bundled profile. */
const makeProject = async (
  name: string,
  withMusic: boolean,
): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), `naraframe-${name}-`));
  temporaryRoots.push(root);
  const project = join(root, name);
  expect(
    (await cli("create", project, "--profile", "current-issues")).success,
  ).toBe(true);
  await writeFile(
    join(project, "scenes.json"),
    JSON.stringify({
      schemaVersion: 1,
      scenes: ["one", "two"].map((id) => ({
        id,
        narrativeRole: id === "one" ? "hook" : "cta",
        durationMs: 1000,
        visual: { type: "text", text: `Audio mode ${name}, scene ${id}.` },
        beats: [],
        transition: { type: "cut" },
      })),
    }),
  );
  if (withMusic) {
    await mkdir(join(project, "audio", "music"), { recursive: true });
    const bed = join(project, "audio", "music", "bed.wav");
    await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=220:sample_rate=48000:duration=3",
      bed,
    ]);
    const manifestPath = join(project, "assets", "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assets.push({
      id: "bed",
      status: "ready",
      kind: "wav",
      path: "audio/music/bed.wav",
      sha256: createHash("sha256")
        .update(await readFile(bed))
        .digest("hex"),
      origin: { type: "generated", source: "ffmpeg sine test tone" },
    });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }
  const configPath = join(project, "naraframe.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  await writeFile(
    configPath,
    JSON.stringify(
      withMusic
        ? { ...config, soundtrack: { music: { assetId: "bed", volume: 0.5 } } }
        : config,
      null,
      2,
    ),
  );
  return project;
};

const declare = async (project: string, audioMode: string): Promise<void> => {
  const configPath = join(project, "naraframe.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  await writeFile(
    configPath,
    JSON.stringify({ ...config, audioMode }, null, 2),
  );
};

describe("native-resolution preview", () => {
  it("renders a native 1080 draft beside the default 540 and approves an export from it", async () => {
    const project = await makeProject("native-preview", false);
    await declare(project, "silent");

    const native = await cli("preview", project, "--resolution", "1080");
    expect(native.success).toBe(true);
    expect(native.data).toMatchObject({ resolution: 1080, muted: true });
    const half = await cli("preview", project);
    expect(half.success).toBe(true);
    expect(half.data).toMatchObject({
      resolution: 540,
      reusedFromBuildId: null,
    });
    expect(half.buildId?.slice(0, 12)).not.toBe(native.buildId?.slice(0, 12));

    for (const [event, width, height] of [
      [native, 1080, 1920],
      [half, 540, 960],
    ] as const) {
      const streams = await probe(event.artifacts.previewMp4 ?? "");
      expect(streams).toEqual([
        expect.objectContaining({
          codec_type: "video",
          width,
          height,
          nb_frames: "60",
        }),
      ]);
      const manifest = JSON.parse(
        await readFile(event.artifacts.manifestJson ?? "", "utf8"),
      );
      expect(manifest.render).toMatchObject({ width, height, audio: "none" });
      expect(manifest.label).toBe("DRAFT • NO AUDIO");
    }

    const final = await cli(
      "render",
      project,
      "--approve-preview",
      native.buildId ?? "",
    );
    expect(final.success).toBe(true);
    expect(final.data).toMatchObject({
      width: 1080,
      height: 1920,
      audio: "none",
    });
    await decodes(final.artifacts.finalMp4 ?? "");
  }, 900_000);
});
