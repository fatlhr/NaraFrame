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

const codes = (event: Event) =>
  event.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);

describe("final export by audio mode", () => {
  it.each([
    { name: "music-only", mode: "music", withMusic: true, audio: "aac" },
    { name: "silent", mode: "silent", withMusic: false, audio: "none" },
  ])(
    "exports a declared $name project as a native final through the CLI",
    async ({ name, mode, withMusic, audio }) => {
      const project = await makeProject(name, withMusic);

      // Undeclared draft timing is not promoted to a final clock.
      const undeclared = await cli(
        "validate",
        project,
        "--stage",
        "production",
      );
      expect(undeclared.success).toBe(false);
      expect(codes(undeclared)).toEqual(["AUDIO_MODE_UNDECLARED"]);

      await declare(project, mode);
      const validated = await cli("validate", project, "--stage", "production");
      expect(validated.success).toBe(true);
      expect(validated.data.audioMode).toEqual({ mode, source: "project" });

      const preview = await cli("preview", project);
      expect(preview.success).toBe(true);
      const final = await cli(
        "render",
        project,
        "--approve-preview",
        preview.buildId ?? "",
      );
      expect(final.success).toBe(true);
      expect(final.data).toMatchObject({
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 60,
        audio,
        audioMode: { mode, source: "project" },
      });

      const video = final.artifacts.finalMp4 ?? "";
      const streams = await probe(video);
      expect(streams.filter((s) => s.codec_type === "video")).toEqual([
        expect.objectContaining({
          codec_name: "h264",
          width: 1080,
          height: 1920,
          avg_frame_rate: "30/1",
          nb_frames: "60",
        }),
      ]);
      const audioStreams = streams.filter((s) => s.codec_type === "audio");
      expect(audioStreams.map((s) => s.codec_name)).toEqual(
        audio === "aac" ? ["aac"] : [],
      );
      await decodes(video);

      const report = JSON.parse(
        await readFile(final.artifacts.reportJson ?? "", "utf8"),
      );
      expect(report.render.audio).toBe(audio);
      expect(report.audioMode).toEqual({ mode, source: "project" });
      expect(report.approval.previewBuildId).toBe(preview.buildId);
    },
    900_000,
  );
});
