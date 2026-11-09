import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ffmpeg = process.env.NARAFRAME_FFMPEG_EXECUTABLE || "ffmpeg";
const ffprobe = process.env.NARAFRAME_FFPROBE_EXECUTABLE || "ffprobe";
const options = { maxBuffer: 32 * 1024 * 1024 };
const limits = {
  Y: { MAX: 48, AVG: 0.25 },
  U: { MAX: 16, AVG: 0.15 },
  V: { MAX: 16, AVG: 0.15 },
};

async function timeline(path) {
  const { stdout } = await run(
    ffprobe,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_streams",
      "-show_frames",
      "-show_entries",
      "stream=width,height,r_frame_rate,time_base,sample_aspect_ratio,pix_fmt,color_range,color_space,color_transfer,color_primaries:frame=best_effort_timestamp",
      "-of",
      "json",
      path,
    ],
    options,
  );
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  const timestamps = probe.frames?.map((frame) => frame.best_effort_timestamp);
  if (
    !stream?.width ||
    !stream.height ||
    !timestamps?.length ||
    timestamps.some(
      (stamp, index) =>
        !Number.isSafeInteger(stamp) ||
        (index > 0 && stamp <= timestamps[index - 1]),
    )
  ) {
    throw new Error(
      "Expected a readable video with increasing frame timestamps.",
    );
  }
  // ffprobe can attach unrelated side data even with -show_entries.
  const fields = [
    "width",
    "height",
    "r_frame_rate",
    "time_base",
    "sample_aspect_ratio",
    "pix_fmt",
    "color_range",
    "color_space",
    "color_transfer",
    "color_primaries",
  ];
  return { format: fields.map((key) => stream[key]), timestamps };
}

async function compare(left, right, windows) {
  const a = await timeline(left);
  const b = await timeline(right);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error("Video format or decoded frame timeline differs.");
  }
  if (
    windows.some(([start, end]) => start >= end || end > a.timestamps.length)
  ) {
    throw new Error(
      "Tolerance windows must be non-empty and within the decoded timeline.",
    );
  }

  const diff = [
    "[0:v:0]format=yuv420p[left];[1:v:0]format=yuv420p[right];",
    "[left][right]lut2=c0='abs(x-y)':c1='abs(x-y)':c2='abs(x-y)':shortest=1:repeatlast=0,",
    "signalstats,metadata=mode=print:file=-",
  ].join("");
  const { stdout } = await run(
    ffmpeg,
    [
      "-v",
      "error",
      "-filter_complex_threads",
      "1",
      "-i",
      left,
      "-i",
      right,
      "-filter_complex",
      diff,
      "-an",
      "-f",
      "null",
      "-",
    ],
    options,
  );
  const frames = stdout.split(/^frame:/mu).slice(1);
  if (frames.length !== a.timestamps.length) {
    throw new Error(
      "The raster comparison did not cover the decoded timeline.",
    );
  }

  const peak = {
    Y: { MAX: 0, AVG: 0 },
    U: { MAX: 0, AVG: 0 },
    V: { MAX: 0, AVG: 0 },
  };
  let differentFrames = 0;
  let rejectedFrames = 0;
  const firstRejections = [];
  for (const [index, frame] of frames.entries()) {
    const stats = Object.fromEntries(
      [
        ...frame.matchAll(/^lavfi\.signalstats\.([YUV](?:MAX|AVG))=(.+)$/gmu),
      ].map(([, key, value]) => [key, Number(value)]),
    );
    const allowed = windows.some(
      ([start, end]) => index >= start && index < end,
    );
    let different = false;
    let rejected = false;
    for (const plane of ["Y", "U", "V"]) {
      for (const metric of ["MAX", "AVG"]) {
        const value = stats[plane + metric];
        if (!Number.isFinite(value) || value < 0 || value > 255) {
          throw new Error(
            `Missing or invalid raster statistic at frame ${index}.`,
          );
        }
        peak[plane][metric] = Math.max(peak[plane][metric], value);
        different ||= value > 0;
        rejected ||= value > (allowed ? limits[plane][metric] : 0);
      }
    }
    if (different) differentFrames++;
    if (rejected) {
      rejectedFrames++;
      if (firstRejections.length < 10) firstRejections.push(index);
    }
  }
  return {
    passed: rejectedFrames === 0,
    frames: frames.length,
    differentFrames,
    rejectedFrames,
    firstRejections,
    windows,
    limits,
    peak,
  };
}

try {
  const [left, right, ...args] = process.argv.slice(2);
  if (
    !left ||
    !right ||
    args.some((arg) => !/^--tolerate=\d+:\d+$/u.test(arg))
  ) {
    throw new Error(
      "Usage: node scripts/check-release-frames.mjs LEFT.mp4 RIGHT.mp4 [--tolerate=START:END ...]",
    );
  }
  const windows = args.map((arg) =>
    arg.slice("--tolerate=".length).split(":").map(Number),
  );
  const result = await compare(resolve(left), resolve(right), windows);
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
