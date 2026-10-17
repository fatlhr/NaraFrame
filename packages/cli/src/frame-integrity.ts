import { spawn } from "node:child_process";
import type { Issue } from "@naraframe/core";

/**
 * Catches single-frame render corruption that decodes cleanly. Under load the
 * renderer has captured frames before they finished painting (a repeated top
 * band, or elements missing), and the result is a valid H.264 stream that no
 * decode check can fault. Real motion never does this: a corrupt frame differs
 * strongly from both neighbours while the neighbours still match each other.
 */
export const FRAME_INTEGRITY_METHOD = "neighbour-outlier/1";

/** Frames are compared as 54x96 grey thumbnails: cheap, and blind to noise. */
export const SAMPLE_WIDTH = 54;
export const SAMPLE_HEIGHT = 96;
/** Mean grey-level step (0-255) that counts as a real change. */
export const CHANGE_THRESHOLD = 4;
/** How much closer the neighbours must be to each other than to the frame. */
export const NEIGHBOUR_RATIO = 0.35;

export interface FrameOutlier {
  /** Zero-based index of the suspect frame in the decoded video stream. */
  frame: number;
  /** Mean difference from the previous frame. */
  dp: number;
  /** Mean difference from the next frame. */
  dn: number;
  /** Mean difference between the previous and next frames. */
  dpn: number;
}

export interface FrameIntegrityRecord {
  method: typeof FRAME_INTEGRITY_METHOD;
  frames: number;
  outliers: FrameOutlier[];
}

const meanAbsDiff = (left: Uint8Array, right: Uint8Array): number => {
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    sum += Math.abs((left[index] ?? 0) - (right[index] ?? 0));
  }
  return sum / left.length;
};

const isOutlier = (dp: number, dn: number, dpn: number): boolean =>
  dp > CHANGE_THRESHOLD &&
  dn > CHANGE_THRESHOLD &&
  dpn < NEIGHBOUR_RATIO * Math.min(dp, dn);

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Feeds frames one at a time and keeps only the last two, so a long video is
 * scanned in constant memory. The first and last frames have a single
 * neighbour and are never flagged.
 */
export class FrameOutlierScanner {
  readonly outliers: FrameOutlier[] = [];
  frames = 0;
  private previous: Uint8Array | null = null;
  private current: Uint8Array | null = null;
  private toCurrent = 0;

  constructor(readonly frameSize: number) {}

  push(pixels: Uint8Array): void {
    if (pixels.length !== this.frameSize) {
      throw new Error(
        `Frame has ${pixels.length} samples; expected ${this.frameSize}.`,
      );
    }
    const next = Uint8Array.from(pixels);
    if (this.current) {
      const dn = meanAbsDiff(this.current, next);
      if (this.previous) {
        const dp = this.toCurrent;
        const dpn = meanAbsDiff(this.previous, next);
        if (isOutlier(dp, dn, dpn)) {
          this.outliers.push({
            frame: this.frames - 1,
            dp: round1(dp),
            dn: round1(dn),
            dpn: round1(dpn),
          });
        }
      }
      this.toCurrent = dn;
    }
    this.previous = this.current;
    this.current = next;
    this.frames += 1;
  }
}

/**
 * Pure detector over `frameCount` consecutive grey frames of `width`x`height`
 * samples laid out back to back in `pixels`. Returns the frames that differ
 * from both neighbours while those neighbours match each other. Fewer than
 * three frames cannot show the pattern and report nothing.
 */
export const findOutlierFrames = (
  pixels: Uint8Array,
  width: number,
  height: number,
  frameCount: number = pixels.length / (width * height),
): FrameOutlier[] => {
  const frameSize = width * height;
  if (
    !Number.isInteger(frameSize) ||
    frameSize <= 0 ||
    !Number.isInteger(frameCount) ||
    frameCount < 0 ||
    pixels.length !== frameSize * frameCount
  ) {
    throw new Error(
      `Expected ${frameCount} frames of ${width}x${height} samples, got ${pixels.length} samples.`,
    );
  }
  const scanner = new FrameOutlierScanner(frameSize);
  for (let index = 0; index < frameCount; index += 1) {
    scanner.push(pixels.subarray(index * frameSize, (index + 1) * frameSize));
  }
  return scanner.outliers;
};

/**
 * Decodes the first video stream to grey thumbnails with ffmpeg and scans them
 * as they stream by. Rejects when ffmpeg fails or the output is not whole
 * frames.
 */
export const checkFrameIntegrity = async (
  path: string,
  ffmpegExecutable: string,
): Promise<FrameIntegrityRecord> =>
  new Promise((resolvePromise, reject) => {
    const frameSize = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    const scanner = new FrameOutlierScanner(frameSize);
    const child = spawn(
      ffmpegExecutable,
      [
        "-v",
        "error",
        "-xerror",
        "-err_detect",
        "explode",
        "-i",
        path,
        "-map",
        "0:v:0",
        "-an",
        "-vf",
        `scale=${SAMPLE_WIDTH}:${SAMPLE_HEIGHT}:flags=area,format=gray`,
        "-f",
        "rawvideo",
        "-",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const stderr: Buffer[] = [];
    let carry = Buffer.alloc(0);
    let failure: Error | null = null;
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.stdout.on("data", (chunk: Buffer) => {
      if (failure) return;
      const bytes = carry.length > 0 ? Buffer.concat([carry, chunk]) : chunk;
      let offset = 0;
      try {
        while (offset + frameSize <= bytes.length) {
          scanner.push(bytes.subarray(offset, offset + frameSize));
          offset += frameSize;
        }
      } catch (error) {
        failure = error as Error;
        child.kill();
        return;
      }
      carry = Buffer.from(bytes.subarray(offset));
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (failure) {
        reject(failure);
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `${ffmpegExecutable} exited with code ${code}: ${Buffer.concat(stderr).toString("utf8").trim()}`,
          ),
        );
        return;
      }
      if (carry.length > 0) {
        reject(
          new Error(
            `${ffmpegExecutable} produced a partial frame while checking frame integrity.`,
          ),
        );
        return;
      }
      resolvePromise({
        method: FRAME_INTEGRITY_METHOD,
        frames: scanner.frames,
        outliers: scanner.outliers,
      });
    });
  });

const LISTED_FRAMES = 20;

export const frameIntegrityIssue = (
  artifact: "preview.mp4" | "final.mp4",
  outliers: readonly FrameOutlier[],
): Issue => {
  const listed = outliers
    .slice(0, LISTED_FRAMES)
    .map((outlier) => outlier.frame)
    .join(", ");
  const more =
    outliers.length > LISTED_FRAMES
      ? ` and ${outliers.length - LISTED_FRAMES} more`
      : "";
  return {
    code: "RENDER_FRAME_INTEGRITY",
    severity: "error",
    responsible: "system",
    artifact,
    path: "/frames",
    message: `${outliers.length} frame(s) of the rendered video differ sharply from both neighbours while the neighbours match each other (frame ${listed}${more}), so the renderer captured incomplete frames. The build was not published.`,
    suggestion:
      "Run the command again, ideally with other heavy applications closed. If the same frames fail every time, the scene itself flashes for one frame; change it.",
    details: { method: FRAME_INTEGRITY_METHOD, outliers },
  };
};

export class FrameIntegrityError extends Error {
  readonly issues: Issue[];

  constructor(issues: Issue[]) {
    super("The rendered video failed the frame integrity check.");
    this.name = "FrameIntegrityError";
    this.issues = issues;
  }
}

export const isFrameIntegrityError = (
  error: unknown,
): error is FrameIntegrityError =>
  error instanceof Error &&
  error.name === "FrameIntegrityError" &&
  Array.isArray((error as FrameIntegrityError).issues);

/**
 * Runs the check on a freshly rendered video and returns the passing record
 * for the build report. Throws a FrameIntegrityError when any frame is
 * suspect, so the caller never publishes it.
 */
export const assertFrameIntegrity = async (
  path: string,
  artifact: "preview.mp4" | "final.mp4",
  ffmpegExecutable: string,
  check: (path: string) => Promise<FrameIntegrityRecord> = (file) =>
    checkFrameIntegrity(file, ffmpegExecutable),
): Promise<FrameIntegrityRecord> => {
  const record = await check(path);
  if (record.outliers.length > 0) {
    throw new FrameIntegrityError([
      frameIntegrityIssue(artifact, record.outliers),
    ]);
  }
  return record;
};
