import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const run = promisify(execFile);
const repository = fileURLToPath(new URL("../../../..", import.meta.url));
const cliEntry = join(repository, "packages/cli/dist/index.js");
const rate = 48_000;
const toleranceMs = 1000 / 30;
const hash = (data: string | Buffer) =>
  createHash("sha256").update(data).digest("hex");

// The oracle comes from the authored PCM, not the compiled timing or an offset
// estimated from the output. The last clip deliberately ends off the frame grid.
const expectedIntervals = [
  [0, 400],
  [700, 1237],
  [2237, 3224],
];
const pcm = (durationMs: number, frequency: number, internalPause: boolean) => {
  const count = durationMs * (rate / 1000);
  const wav = Buffer.alloc(44 + count * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const silent = internalPause && i >= 400 * 48 && i < 700 * 48;
    wav.writeInt16LE(
      silent
        ? 0
        : Math.round(12000 * Math.cos((2 * Math.PI * frequency * i) / rate)),
      44 + i * 2,
    );
  }
  return wav;
};

const intervals = async (path: string): Promise<number[][]> => {
  const { stdout } = await run(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      path,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(rate),
      "-f",
      "f32le",
      "-",
    ],
    { encoding: "buffer", timeout: 30_000, maxBuffer: 4 * 1024 * 1024 },
  );
  const result: number[][] = [];
  let start: number | null = null;
  const windows = Math.floor(stdout.length / (48 * 4));
  for (let ms = 0; ms <= windows; ms++) {
    let sum = 0;
    if (ms < windows) {
      for (let sample = 0; sample < 48; sample++) {
        sum += stdout.readFloatLE((ms * 48 + sample) * 4) ** 2;
      }
    }
    const active = Math.sqrt(sum / 48) >= 0.03;
    if (active && start === null) start = ms;
    if (!active && start !== null) {
      result.push([start, ms]);
      start = null;
    }
  }
  return result;
};

it("keeps AAC onset, pauses and the off-frame terminal sample within one frame in preview and final", async () => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-audio-boundaries-"));
  try {
    const json = async (path: string, value: unknown) =>
      writeFile(join(root, path), JSON.stringify(value, null, 2));
    const fixture = join(repository, "test-fixtures/project-general-explainer");
    const profile = JSON.parse(
      await readFile(join(fixture, "profile.lock.json"), "utf8"),
    );
    const config = JSON.parse(
      await readFile(join(fixture, "naraframe.json"), "utf8"),
    );
    await json("profile.lock.json", profile);
    await json("naraframe.json", {
      ...config,
      id: "synthetic-boundaries",
      title: "Synthetic scheduling",
    });
    await mkdir(join(root, "assets"));
    await mkdir(join(root, "audio/narration"), { recursive: true });
    const definitions = [
      { id: "first", ms: 1237, frequency: 440, pause: 1000 },
      { id: "last", ms: 987, frequency: 880, pause: 0 },
    ];
    const assets = [];
    const blocks = [];
    for (const { id, ms, frequency, pause } of definitions) {
      const wav = pcm(ms, frequency, id === "first");
      const sha256 = hash(wav);
      const path = `audio/narration/${sha256}.wav`;
      const text = `Synthetic ${id}.`;
      await writeFile(join(root, path), wav);
      assets.push({
        id: `voice-${id}`,
        status: "ready",
        kind: "wav",
        path,
        sha256,
        origin: { type: "generated", source: "local deterministic PCM probe" },
        generation: {
          textSha256: hash(text),
          voiceStyleSignature: profile.production.voiceStyleSignature,
        },
      });
      blocks.push({
        id,
        text,
        audioAssetId: `voice-${id}`,
        audioDurationMs: ms,
        pauseAfterMs: pause,
        phrases: [{ id: `${id}-phrase`, text, startMs: 0, endMs: ms }],
      });
    }
    // Verify the independent input detector before using it on an encoded mix.
    expect(await intervals(join(root, assets[0]?.path ?? ""))).toEqual([
      [0, 400],
      [700, 1237],
    ]);
    expect(await intervals(join(root, assets[1]?.path ?? ""))).toEqual([
      [0, 987],
    ]);
    await json("assets/manifest.json", { schemaVersion: 1, assets });
    await json("narration.json", {
      schemaVersion: 1,
      order: ["first", "last"],
      blocks,
    });
    await json("scenes.json", {
      schemaVersion: 1,
      scenes: blocks.map((block) => ({
        id: block.id,
        narrativeRole: "context",
        durationMs: 999,
        visual: { type: "text", text: block.text },
        beats: [],
        transition: { type: "cut" },
        narration: { blockId: block.id },
      })),
    });
    const cli = async (...args: string[]) => {
      const { stdout } = await run(
        process.execPath,
        [cliEntry, ...args, "--json"],
        {
          timeout: 120_000,
          killSignal: "SIGINT",
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      const event = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}");
      expect(event.success).toBe(true);
      return event;
    };
    expect(
      (await cli("validate", root, "--stage", "production")).readiness,
    ).toBe("ready");
    const preview = await cli("preview", root, "--rerender");
    const final = await cli(
      "render",
      root,
      "--approve-preview",
      preview.buildId,
    );
    expect(final.sourceRevision).toBe(preview.sourceRevision);
    expect(final.data.approval.previewBuildId).toBe(preview.buildId);
    for (const video of [
      preview.artifacts.previewMp4,
      final.artifacts.finalMp4,
    ]) {
      const actual = await intervals(video);
      expect(actual).toHaveLength(expectedIntervals.length);
      for (let i = 0; i < expectedIntervals.length; i++) {
        for (let edge = 0; edge < 2; edge++) {
          expect(
            Math.abs(
              (actual[i]?.[edge] ?? Infinity) -
                (expectedIntervals[i]?.[edge] ?? 0),
            ),
          ).toBeLessThanOrEqual(toleranceMs);
        }
      }
      // No audible terminal material extends beyond the video (1 ms RMS bins).
      expect(actual.at(-1)?.[1]).toBeLessThanOrEqual((1000 * 97) / 30 + 1);
      await run("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"], {
        timeout: 30_000,
      });
    }
    const { stdout } = await run(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        final.artifacts.finalMp4,
      ],
      { timeout: 30_000 },
    );
    const probe = JSON.parse(stdout);
    const video = probe.streams.find(
      (stream: { codec_type: string }) => stream.codec_type === "video",
    );
    const audio = probe.streams.find(
      (stream: { codec_type: string }) => stream.codec_type === "audio",
    );
    expect(video).toMatchObject({
      codec_name: "h264",
      width: 1080,
      height: 1920,
      r_frame_rate: "30/1",
      nb_frames: "97",
    });
    expect(audio).toMatchObject({ codec_name: "aac", sample_rate: "48000" });
    expect(probe.format.format_name).toContain("mp4");
    const manifest = JSON.parse(
      await readFile(final.artifacts.manifestJson, "utf8"),
    );
    expect(hash(await readFile(final.artifacts.finalMp4))).toBe(
      manifest.artifacts.find(
        (artifact: { path: string }) => artifact.path === "final.mp4",
      ).sha256,
    );
    expect(
      JSON.parse(await readFile(final.artifacts.current, "utf8")).buildId,
    ).toBe(final.buildId);
    expect(await readdir(join(root, ".naraframe/attempts"))).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 300_000);
