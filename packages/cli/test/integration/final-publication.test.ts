import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Approval, CompiledDraft } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import type { RenderedDraft } from "@naraframe/renderer-remotion";
import { afterEach, describe, expect, it } from "vitest";
import { narratedSource } from "../../../core/test/integration/narrated-source.js";
import { promoteFinalBuild, publishFinalBuild } from "../../src/final-build.js";
import {
  FRAME_INTEGRITY_METHOD,
  isFrameIntegrityError,
} from "../../src/frame-integrity.js";

const sha = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const tmp = async (prefix: string) => {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};

const compiled = compileDraft(
  narratedSource(),
  { type: "project" },
  { mode: "final" },
);
if (!compiled.ok) throw new Error("fixture must compile");
const draft: CompiledDraft = compiled.value;

const approval: Approval = {
  sourceRevision: draft.sourceRevision,
  assemblyKey: draft.assemblyKey,
  scope: { type: "project" },
  previewBuildId: "preview-1",
  autonomy: null,
  approvedAt: "2026-09-20T00:00:00.000Z",
};

const goodProbe = async () => ({
  streams: [
    {
      codec_type: "video",
      codec_name: "h264",
      width: 1080,
      height: 1920,
      avg_frame_rate: "30/1",
      duration: String(draft.totalFrames / 30),
    },
    { codec_type: "audio", codec_name: "aac" },
  ],
  format: { duration: String(draft.totalFrames / 30) },
});
const media = {
  probe: goodProbe,
  decode: async () => undefined,
  audioDecode: async () => undefined,
};
const cleanIntegrity = async () => ({
  method: FRAME_INTEGRITY_METHOD,
  frames: draft.totalFrames,
  outliers: [],
});
const mp4 = Buffer.concat([
  Buffer.alloc(4),
  Buffer.from("ftypisom"),
  Buffer.from("payload"),
]);

type Variant = "valid" | "tampered-video" | "wrong-assembly" | "extra-artifact";

const stage = async (
  root: string,
  buildId: string,
  variant: Variant = "valid",
) => {
  const directory = join(root, `staged-${buildId}`);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "final.mp4"), mp4);
  const report = {
    schemaVersion: 1,
    buildId,
    mode: "final",
    sourceRevision: draft.sourceRevision,
    assemblyKey:
      variant === "wrong-assembly" ? "f".repeat(64) : draft.assemblyKey,
    status: "success",
  };
  await writeFile(join(directory, "report.json"), JSON.stringify(report));
  const record = async (path: string, mediaType: string) => {
    const file = await readFile(join(directory, path));
    return { path, bytes: file.byteLength, sha256: sha(file), mediaType };
  };
  const artifacts = [
    await record("final.mp4", "video/mp4"),
    await record("report.json", "application/json"),
  ];
  if (variant === "extra-artifact") {
    await writeFile(join(directory, "notes.txt"), "x");
    artifacts.push(await record("notes.txt", "text/plain"));
  }
  await writeFile(
    join(directory, "manifest.json"),
    JSON.stringify({
      ...report,
      assemblyKey: draft.assemblyKey,
      artifacts,
      completedAt: "2026-09-20T00:00:01.000Z",
    }),
  );
  if (variant === "tampered-video")
    await writeFile(
      join(directory, "final.mp4"),
      Buffer.concat([mp4, Buffer.from("!")]),
    );
  return directory;
};

const promote = async (
  output: string,
  root: string,
  buildId: string,
  variant?: Variant,
  extra = {},
) =>
  promoteFinalBuild({
    stagedBuildDirectory: await stage(root, buildId, variant),
    outputDirectory: output,
    buildId,
    draft,
    ...media,
    ...extra,
  });

describe("promoteFinalBuild", () => {
  it("publishes the build and points output/current.json at it", async () => {
    const root = await tmp("naraframe-final-");
    const output = join(root, "output");
    await mkdir(join(output, "builds"), { recursive: true });
    const result = await promote(output, root, "build-one");
    const pointer = JSON.parse(
      await readFile(join(output, "current.json"), "utf8"),
    );
    expect(pointer).toMatchObject({
      buildId: "build-one",
      manifest: "builds/build-one/manifest.json",
      manifestSha256: result.manifestSha256,
    });
    expect((await readdir(join(output, "builds", "build-one"))).sort()).toEqual(
      ["final.mp4", "manifest.json", "report.json"],
    );
  });

  it("keeps the previous build current when publication fails before the pointer switch", async () => {
    const root = await tmp("naraframe-final-");
    const output = join(root, "output");
    await mkdir(join(output, "builds"), { recursive: true });
    await promote(output, root, "build-one");
    const before = await readFile(join(output, "current.json"));

    await expect(
      promote(output, root, "build-two", "valid", {
        failureInjection: "before-pointer",
      }),
    ).rejects.toThrow("Injected final publication failure");
    expect(await readFile(join(output, "current.json"))).toEqual(before);
    expect(JSON.parse(before.toString()).buildId).toBe("build-one");
  });

  it("rejects a tampered artifact, wrong metadata, and unlisted or extra files without publishing", async () => {
    const root = await tmp("naraframe-final-");
    const output = join(root, "output");
    await mkdir(join(output, "builds"), { recursive: true });
    await expect(
      promote(output, root, "tampered", "tampered-video"),
    ).rejects.toThrow("integrity check");
    await expect(
      promote(output, root, "wrong", "wrong-assembly"),
    ).rejects.toThrow("does not match the compiled export");
    await expect(
      promote(output, root, "extra", "extra-artifact"),
    ).rejects.toThrow("exactly final.mp4 and report.json");
    expect(await readdir(join(output, "builds"))).toEqual([]);
    await expect(stat(join(output, "current.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects media without the narration audio or with audio that will not decode", async () => {
    const root = await tmp("naraframe-final-");
    const output = join(root, "output");
    await mkdir(join(output, "builds"), { recursive: true });
    const silentProbe = async () => ({
      streams: [
        {
          codec_type: "video",
          codec_name: "h264",
          width: 1080,
          height: 1920,
          avg_frame_rate: "30/1",
          duration: String(draft.totalFrames / 30),
        },
      ],
      format: { duration: String(draft.totalFrames / 30) },
    });
    await expect(
      promote(output, root, "no-audio", "valid", { probe: silentProbe }),
    ).rejects.toThrow("AAC");
    await expect(
      promote(output, root, "bad-audio", "valid", {
        audioDecode: async () => {
          throw new Error("audio stream is corrupt");
        },
      }),
    ).rejects.toThrow("corrupt");
    await expect(
      promote(output, root, "draft-size", "valid", {
        probe: async () => ({
          ...(await goodProbe()),
          streams: [
            {
              codec_type: "video",
              codec_name: "h264",
              width: 540,
              height: 960,
              avg_frame_rate: "30/1",
            },
            { codec_type: "audio", codec_name: "aac" },
          ],
        }),
      }),
    ).rejects.toThrow("H.264 render signature");
    expect(await readdir(join(output, "builds"))).toEqual([]);
  });

  it("refuses to overwrite an existing immutable build", async () => {
    const root = await tmp("naraframe-final-");
    const output = join(root, "output");
    await mkdir(join(output, "builds"), { recursive: true });
    await promote(output, root, "build-one");
    await expect(promote(output, root, "build-one")).rejects.toThrow(
      "already exists",
    );
  });
});

const ffmpeg =
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

describe.skipIf(!existsSync(ffmpeg))("publishFinalBuild", () => {
  const fakeRender = (bytes: Buffer = mp4) =>
    (async ({
      outputPath,
    }: {
      outputPath?: string;
    }): Promise<RenderedDraft> => {
      if (outputPath) await writeFile(outputPath, bytes);
      return {
        outputPath: outputPath ?? "",
        durationInFrames: draft.totalFrames,
        width: 1080,
        height: 1920,
        fps: 30,
        browserExecutable: process.execPath,
        remotionVersion: "test",
        visualPreflight: { issues: [], frames: [] },
      };
    }) as never;

  it("renders, verifies, records the approval and cost, and publishes atomically", async () => {
    const root = await tmp("naraframe-final-");
    const cost = {
      currency: "IDR",
      budget: 100,
      estimated: 10,
      actual: 10,
      unknown: 0,
      reserved: 0,
      available: 90,
      receipts: [],
    };
    const published = await publishFinalBuild({
      projectRoot: root,
      draft,
      approval,
      issues: [],
      cost,
      render: fakeRender(),
      frameIntegrity: cleanIntegrity,
      ...media,
    });
    const report = JSON.parse(
      await readFile(join(published.buildDirectory, "report.json"), "utf8"),
    );
    expect(report).toMatchObject({
      mode: "final",
      sourceRevision: draft.sourceRevision,
      approval,
      cost,
      status: "success",
    });
    expect(report.frameIntegrity).toEqual({
      method: FRAME_INTEGRITY_METHOD,
      frames: draft.totalFrames,
      outliers: [],
    });
    expect(report.render).toMatchObject({
      width: 1080,
      height: 1920,
      codec: "h264",
      audio: "aac",
    });
    const pointer = JSON.parse(
      await readFile(join(root, "output", "current.json"), "utf8"),
    );
    expect(pointer.buildId).toBe(published.buildId);
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
  });

  it("publishes nothing and leaves no attempt behind when rendering fails", async () => {
    const root = await tmp("naraframe-final-");
    await expect(
      publishFinalBuild({
        projectRoot: root,
        draft,
        approval,
        issues: [],
        cost: null,
        render: (async () => {
          throw new Error("renderer crashed");
        }) as never,
        ...media,
      }),
    ).rejects.toThrow("renderer crashed");
    await expect(
      stat(join(root, "output", "current.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
  });

  it("publishes nothing when the new render has incomplete frames", async () => {
    const root = await tmp("naraframe-final-");
    const failure = await publishFinalBuild({
      projectRoot: root,
      draft,
      approval,
      issues: [],
      cost: null,
      render: fakeRender(),
      frameIntegrity: async () => ({
        method: FRAME_INTEGRITY_METHOD,
        frames: draft.totalFrames,
        outliers: [
          { frame: 14, dp: 30, dn: 31, dpn: 1 },
          { frame: 106, dp: 28, dn: 29, dpn: 2 },
        ],
      }),
      ...media,
    }).catch((error: unknown) => error);

    expect(isFrameIntegrityError(failure)).toBe(true);
    if (!isFrameIntegrityError(failure)) return;
    expect(failure.issues).toEqual([
      expect.objectContaining({
        code: "RENDER_FRAME_INTEGRITY",
        artifact: "final.mp4",
        message: expect.stringContaining("frame 14, 106"),
      }),
    ]);
    await expect(
      stat(join(root, "output", "current.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(join(root, "output", "builds"))).toEqual([]);
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
  });

  it("keeps the earlier build current when a later export is interrupted before the pointer", async () => {
    const root = await tmp("naraframe-final-");
    const first = await publishFinalBuild({
      projectRoot: root,
      draft,
      approval,
      issues: [],
      cost: null,
      render: fakeRender(),
      frameIntegrity: cleanIntegrity,
      ...media,
    });
    await expect(
      publishFinalBuild({
        projectRoot: root,
        draft,
        approval,
        issues: [],
        cost: null,
        render: fakeRender(),
        failureInjection: "before-pointer",
        frameIntegrity: cleanIntegrity,
        ...media,
      }),
    ).rejects.toThrow("Injected final publication failure");
    const pointer = JSON.parse(
      await readFile(join(root, "output", "current.json"), "utf8"),
    );
    expect(pointer.buildId).toBe(first.buildId);
  });
});
