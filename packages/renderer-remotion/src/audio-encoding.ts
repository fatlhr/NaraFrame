import type { FfmpegOverrideFn } from "@remotion/renderer";

/** Encode PCM into the final container so AAC priming metadata survives muxing. */
export const encodeAudioWhenMuxing: FfmpegOverrideFn = ({ type, args }) => {
  if (type !== "stitcher") return args;
  const index = args.indexOf("-c:a");
  if (index !== -1 && args[index + 1] !== "copy") {
    throw new Error(
      "Expected Remotion's PCM audio copy at the final stitcher.",
    );
  }
  const encoded =
    index === -1
      ? args
      : [
          ...args.slice(0, index + 1),
          "libfdk_aac",
          "-b:a",
          "320k",
          "-cutoff",
          "18000",
          ...args.slice(index + 2),
        ];
  return [
    ...encoded.slice(0, -1),
    // The temporary filename satisfies Remotion's PCM extension validator;
    // the actual output is explicitly AAC/H.264 in an MP4 container.
    "-f",
    "mp4",
    "-movflags",
    "+faststart",
    ...encoded.slice(-1),
  ];
};
