import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
// Real narration audio lives only on the owner's machine (samples are not in git).
const sampleRoot = join(repositoryRoot, "samples", "krakatau-narrated");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const RATE = 16_000;
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

const preview = async (project: string): Promise<string> => {
  const { stdout } = await run(
    process.execPath,
    [cliEntry, "preview", project, "--draft", "--rerender", "--json"],
    { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
  );
  const event = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as {
    success: boolean;
    artifacts: Record<string, string>;
  };
  expect(event.success).toBe(true);
  return event.artifacts.previewMp4 ?? "";
};

const ffmpeg = (args: string[]) =>
  run("ffmpeg", ["-v", "error", "-y", ...args], {
    maxBuffer: 256 * 1024 * 1024,
    encoding: "buffer",
  });

/** Mono float samples of a video's audio track. */
const samples = async (video: string): Promise<Float32Array> => {
  const { stdout } = await ffmpeg([
    "-i",
    video,
    "-vn",
    "-ac",
    "1",
    "-ar",
    String(RATE),
    "-f",
    "f32le",
    "-",
  ]);
  const buffer = stdout as unknown as Buffer;
  return new Float32Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength - (buffer.byteLength % 4),
    ),
  );
};

const rms = (data: Float32Array, fromSec: number, toSec: number): number => {
  const start = Math.floor(fromSec * RATE);
  const end = Math.min(data.length, Math.floor(toSec * RATE));
  let sum = 0;
  for (let i = start; i < end; i += 1) sum += (data[i] ?? 0) ** 2;
  return Math.sqrt(sum / Math.max(1, end - start));
};

/** What the soundtrack added: the mix minus the same render without it. */
const contribution = (mix: Float32Array, base: Float32Array): Float32Array => {
  const length = Math.min(mix.length, base.length);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) out[i] = (mix[i] ?? 0) - (base[i] ?? 0);
  return out;
};

const tone = async (path: string, frequency: number, seconds: number) => {
  await ffmpeg([
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${frequency}:duration=${seconds}:sample_rate=44100`,
    "-af",
    "volume=0.7",
    path,
  ]);
};

describe.skipIf(!existsSync(join(sampleRoot, "audio")))(
  "soundtrack in a real render",
  () => {
    it("ducks music under real narration, fades at the ends, places the effect, and keeps the length", async () => {
      const root = await mkdtemp(join(tmpdir(), "naraframe-mix-"));
      temporaryRoots.push(root);
      const project = join(root, "mix");
      await cp(sampleRoot, project, {
        recursive: true,
        filter: (source) =>
          !/[\\/](preview|revisions|\.naraframe|output)([\\/]|$)/.test(source),
      });
      await mkdir(join(project, "audio", "music"), { recursive: true });
      await tone(join(project, "audio", "music", "bed.wav"), 220, 60);
      await tone(join(project, "audio", "music", "hit.wav"), 1000, 1);
      const sha = async (path: string) =>
        createHash("sha256")
          .update(await readFile(join(project, path)))
          .digest("hex");
      const manifestPath = join(project, "assets", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      for (const [id, path] of [
        ["bed", "audio/music/bed.wav"],
        ["hit", "audio/music/hit.wav"],
      ] as const) {
        manifest.assets.push({
          id,
          status: "ready",
          kind: "wav",
          path,
          sha256: await sha(path),
          origin: { type: "generated", source: "ffmpeg sine test tone" },
        });
      }
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      const configPath = join(project, "naraframe.json");
      const config = JSON.parse(await readFile(configPath, "utf8"));
      const withSoundtrack = async (soundtrack: unknown) => {
        await writeFile(
          configPath,
          JSON.stringify({ ...config, soundtrack }, null, 2),
        );
        return preview(project);
      };

      const baselineVideo = await preview(project);
      const music = {
        assetId: "bed",
        volume: 0.4,
        fadeInMs: 2000,
        fadeOutMs: 2000,
        loop: true,
      };
      const sfx = [
        {
          id: "hit",
          assetId: "hit",
          sceneId: "impact",
          offsetMs: 500,
          volume: 1,
        },
      ];
      const duckedVideo = await withSoundtrack({
        music: {
          ...music,
          duck: { volume: 0.25, attackMs: 100, releaseMs: 100 },
        },
        sfx,
      });
      const flatVideo = await withSoundtrack({ music, sfx });

      const base = await samples(baselineVideo);
      const ducked = contribution(await samples(duckedVideo), base);
      const flat = contribution(await samples(flatVideo), base);

      // Same length as the video without a soundtrack (within one AAC frame).
      const seconds = base.length / RATE;
      expect(Math.abs(ducked.length / RATE - seconds)).toBeLessThan(0.1);

      // Inside real speech (mid of the "opening" block, not near an effect or a fade).
      const speech: [number, number] = [6, 12];
      const duckRatio = rms(ducked, ...speech) / rms(flat, ...speech);
      expect(duckRatio).toBeGreaterThan(0.25 * 0.75);
      expect(duckRatio).toBeLessThan(0.25 * 1.3);

      // Fades: the first and last 300 ms carry far less music than the middle.
      const mid = rms(flat, 14, 20);
      expect(rms(flat, 0, 0.3)).toBeLessThan(mid * 0.25);
      expect(rms(flat, seconds - 0.3, seconds)).toBeLessThan(mid * 0.25);

      // The effect sits in the impact scene: a 1 kHz burst well above the bed.
      const burst = (() => {
        let best = { at: 0, level: 0 };
        for (let t = 0; t + 0.2 < seconds; t += 0.1) {
          const level = rms(flat, t, t + 0.2);
          if (level > best.level) best = { at: t, level };
        }
        return best;
      })();
      expect(burst.level).toBeGreaterThan(mid * 1.5);
      expect(burst.at).toBeGreaterThan(seconds * 0.5);
    }, 900_000);
  },
);

describe("soundtrack without narration", () => {
  it("publishes a full draft with its music, reuses it on the next preview, and keeps a scoped preview silent", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-music-only-"));
    temporaryRoots.push(root);
    const project = join(root, "music-only");
    const cli = async (...args: string[]) => {
      const { stdout } = await run(
        process.execPath,
        [cliEntry, ...args, "--json"],
        { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 },
      );
      return JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as {
        success: boolean;
        buildId: string | null;
        artifacts: Record<string, string>;
        data: Record<string, unknown>;
      };
    };
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
          visual: { type: "text", text: `Music only, scene ${id}.` },
          beats: [],
          transition: { type: "cut" },
        })),
      }),
    );
    await mkdir(join(project, "audio", "music"), { recursive: true });
    await tone(join(project, "audio", "music", "bed.wav"), 220, 3);
    const manifestPath = join(project, "assets", "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assets.push({
      id: "bed",
      status: "ready",
      kind: "wav",
      path: "audio/music/bed.wav",
      sha256: createHash("sha256")
        .update(await readFile(join(project, "audio", "music", "bed.wav")))
        .digest("hex"),
      origin: { type: "generated", source: "ffmpeg sine test tone" },
    });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    const configPath = join(project, "naraframe.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    await writeFile(
      configPath,
      JSON.stringify(
        { ...config, soundtrack: { music: { assetId: "bed", volume: 0.5 } } },
        null,
        2,
      ),
    );
    const manifestRender = async (manifestJson: string | undefined) =>
      JSON.parse(await readFile(manifestJson ?? "", "utf8")).render;

    const first = await cli("preview", project, "--draft");
    expect(first.success).toBe(true);
    expect(first.data).toMatchObject({
      label: "DRAFT • WITH AUDIO",
      muted: false,
      reusedFromBuildId: null,
    });
    expect(await manifestRender(first.artifacts.manifestJson)).toMatchObject({
      audio: "aac",
      muted: false,
    });
    const music = await samples(first.artifacts.previewMp4 ?? "");
    expect(rms(music, 0.5, 1.5)).toBeGreaterThan(0.01);

    const again = await cli("preview", project, "--draft");
    expect(again.success).toBe(true);
    expect(again.data).toMatchObject({
      muted: false,
      reusedFromBuildId: first.buildId,
    });
    expect(await manifestRender(again.artifacts.manifestJson)).toMatchObject({
      audio: "aac",
      muted: false,
    });

    // A scoped preview carries no music.
    const scoped = await cli("preview", project, "--draft", "--scene", "two");
    expect(scoped.success).toBe(true);
    expect(scoped.data).toMatchObject({
      label: "DRAFT • NO AUDIO",
      muted: true,
    });
    expect(await manifestRender(scoped.artifacts.manifestJson)).toMatchObject({
      audio: "none",
      muted: true,
    });
  }, 900_000);
});
