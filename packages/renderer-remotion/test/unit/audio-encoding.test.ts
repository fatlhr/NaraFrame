import { describe, expect, it } from "vitest";
import { encodeAudioWhenMuxing } from "../../src/audio-encoding.js";

describe("AAC at the final mux", () => {
  it("encodes PCM once into MP4 and retains the video command", () => {
    const args = [
      "-i",
      "frames.mov",
      "-i",
      "mix.wav",
      "-c:a",
      "copy",
      "-c:v",
      "copy",
      "output.mkv",
    ];
    const result = encodeAudioWhenMuxing({ type: "stitcher", args });
    expect(result).toEqual([
      "-i",
      "frames.mov",
      "-i",
      "mix.wav",
      "-c:a",
      "libfdk_aac",
      "-b:a",
      "320k",
      "-cutoff",
      "18000",
      "-c:v",
      "copy",
      "-f",
      "mp4",
      "-movflags",
      "+faststart",
      "output.mkv",
    ]);
    expect(args[5]).toBe("copy");
  });

  it("keeps MP4 even if no audible track was registered, without changing video pre-encoding", () => {
    const silent = ["-i", "frames.mov", "-an", "output.mkv"];
    expect(encodeAudioWhenMuxing({ type: "stitcher", args: silent })).toEqual([
      "-i",
      "frames.mov",
      "-an",
      "-f",
      "mp4",
      "-movflags",
      "+faststart",
      "output.mkv",
    ]);
    const pre = ["-c:a", "copy", "video.mov"];
    expect(encodeAudioWhenMuxing({ type: "pre-stitcher", args: pre })).toBe(
      pre,
    );
  });

  it("rejects an unexpected upstream audio command rather than silently remapping it", () => {
    expect(() =>
      encodeAudioWhenMuxing({
        type: "stitcher",
        args: ["-c:a", "aac", "output.mkv"],
      }),
    ).toThrow("Expected Remotion's PCM audio copy");
  });
});
