import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import {
  type CompiledDraft,
  compileDraft,
  loadPlanProject,
} from "@naraframe/core";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  contactSheetLayoutFor,
  promotePreviewBuild,
  publishPreviewBuild,
  selectCheckedFrames,
  withPublishedOutputPath,
} from "../../src/preview-build.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];
let draft: CompiledDraft;

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

const crc32 = (value: Buffer): number => {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type: string, data: Buffer): Buffer => {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.byteLength);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
};

const validPng = (width: number, height: number): Buffer => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const scanlines = Buffer.alloc((width * 3 + 1) * height);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};

const probe = async (): Promise<Record<string, unknown>> => ({
  streams: [
    {
      codec_type: "video",
      codec_name: "h264",
      width: draft.width,
      height: draft.height,
      avg_frame_rate: `${draft.fps}/1`,
    },
  ],
  format: { duration: String(draft.totalFrames / draft.fps) },
});
const decode = async (): Promise<void> => undefined;
const contactSheetProbe = async (): Promise<Record<string, unknown>> => {
  const layout = contactSheetLayoutFor(selectCheckedFrames(draft, []).length);
  return {
    streams: [
      {
        codec_type: "video",
        codec_name: "png",
        width: layout.width,
        height: layout.height,
      },
    ],
  };
};
const contactSheetDecode = async (): Promise<void> => undefined;

const createStagedBuild = async (
  root: string,
  buildId: string,
  variant:
    | "valid"
    | "corrupt-mp4"
    | "hash-mismatch"
    | "incomplete-report"
    | "invalid-frame-shape"
    | "invalid-contact-sheet"
    | "missing-coverage"
    | "mixed-runtime"
    | "mixed-timestamps" = "valid",
): Promise<string> => {
  const directory = join(root, `staged-${buildId}`);
  await mkdir(directory, { recursive: true });
  const mp4 =
    variant === "corrupt-mp4"
      ? Buffer.from("not-an-mp4")
      : Buffer.concat([
          Buffer.alloc(4),
          Buffer.from("ftyp"),
          Buffer.from("isom"),
        ]);
  const expectedFrames = selectCheckedFrames(draft, []);
  const checkedFrames =
    variant === "invalid-frame-shape"
      ? [{ frame: 1, reasons: [42] }]
      : variant === "missing-coverage"
        ? expectedFrames.slice(1)
        : expectedFrames;
  const contactSheet = contactSheetLayoutFor(checkedFrames.length);
  const png =
    variant === "invalid-contact-sheet"
      ? Buffer.concat([
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          Buffer.from("fixture"),
        ])
      : validPng(contactSheet.width, contactSheet.height);
  const metadata: Record<string, unknown> = {
    schemaVersion: 1,
    buildId,
    sourceRevision: draft.sourceRevision,
    assemblyKey: draft.assemblyKey,
    mode: draft.mode,
    scope: draft.scope,
    timelineScope: draft.timelineScope,
    label: draft.label,
    profile: { id: draft.profile.id, version: draft.profile.version },
    runtime: {
      node: "v24.20.0",
      os: { platform: "darwin", release: "fixture", architecture: "arm64" },
      remotion: "4.0.521",
      browser: {
        executable: "/fixture/chrome",
        version:
          variant === "mixed-runtime" ? "Chrome report" : "Chrome fixture",
      },
      ffmpeg: { executable: "/fixture/ffmpeg", version: "ffmpeg fixture" },
    },
    render: {
      width: draft.width,
      height: draft.height,
      fps: draft.fps,
      durationInFrames: draft.totalFrames,
      codec: "h264",
      audio: "none",
      muted: true,
    },
    contactSheet,
    checkedFrames,
    startedAt: "2026-09-09T00:00:00.000Z",
    completedAt:
      variant === "mixed-timestamps"
        ? "2026-09-09T00:00:02.000Z"
        : "2026-09-09T00:00:01.000Z",
    status: "success",
    failure: null,
  };
  if (variant === "incomplete-report") {
    delete metadata.runtime;
  }
  const frames = json({
    schemaVersion: 1,
    buildId,
    sourceRevision: draft.sourceRevision,
    assemblyKey: draft.assemblyKey,
    scope: draft.scope,
    timelineScope: draft.timelineScope,
    contactSheet,
    frames: checkedFrames,
  });
  const report = json(metadata);
  await writeFile(join(directory, "preview.mp4"), mp4);
  await writeFile(join(directory, "contact-sheet.png"), png);
  await writeFile(join(directory, "frames.json"), frames);
  await writeFile(join(directory, "report.json"), report);

  const artifact = async (path: string, mediaType: string) => {
    const value = await readFile(join(directory, path));
    return { path, bytes: value.byteLength, sha256: sha256(value), mediaType };
  };
  const manifestMetadata = {
    ...metadata,
    completedAt: "2026-09-09T00:00:01.000Z",
    runtime: {
      node: "v24.20.0",
      os: { platform: "darwin", release: "fixture", architecture: "arm64" },
      remotion: "4.0.521",
      browser: { executable: "/fixture/chrome", version: "Chrome fixture" },
      ffmpeg: { executable: "/fixture/ffmpeg", version: "ffmpeg fixture" },
    },
  };
  await writeFile(
    join(directory, "manifest.json"),
    json({
      ...manifestMetadata,
      artifacts: {
        "preview.mp4": await artifact("preview.mp4", "video/mp4"),
        "contact-sheet.png": await artifact("contact-sheet.png", "image/png"),
        "frames.json": await artifact("frames.json", "application/json"),
        "report.json": await artifact("report.json", "application/json"),
      },
    }),
  );
  if (variant === "hash-mismatch") {
    await writeFile(
      join(directory, "contact-sheet.png"),
      Buffer.concat([png, Buffer.from("changed-after-manifest")]),
    );
  }
  return directory;
};

beforeAll(async () => {
  const loaded = await loadPlanProject(sampleRoot);
  if (!loaded.ok) {
    throw new Error("Unable to load the checked-in preview sample.");
  }
  const compiled = compileDraft(loaded.value.source);
  if (!compiled.ok) {
    throw new Error("Unable to compile the checked-in preview sample.");
  }
  draft = compiled.value;
});

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("atomic preview publication", () => {
  it("promotes one complete directory and leaves the previous pointer selected on interruption", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-publish-"));
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    await writeFile(
      join(previewDirectory, "current.json"),
      json({ schemaVersion: 1, buildId: "previous" }),
    );

    const firstBuildId = "first-complete-build";
    const first = await promotePreviewBuild({
      stagedBuildDirectory: await createStagedBuild(root, firstBuildId),
      previewDirectory,
      buildId: firstBuildId,
      draft,
      probe,
      decode,
      contactSheetProbe,
      contactSheetDecode,
    });
    await expect(access(first.buildDirectory)).resolves.toBeUndefined();
    expect(
      JSON.parse(await readFile(first.currentPointer, "utf8")),
    ).toMatchObject({
      buildId: firstBuildId,
      manifestSha256: first.manifestSha256,
    });

    const pointerBeforeFailure = await readFile(first.currentPointer);
    const interruptedBuildId = "complete-but-not-selected";
    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, interruptedBuildId),
        previewDirectory,
        buildId: interruptedBuildId,
        draft,
        failureInjection: "before-pointer",
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow("before pointer promotion");
    expect(await readFile(first.currentPointer)).toEqual(pointerBeforeFailure);
    await expect(
      access(
        join(previewDirectory, "builds", interruptedBuildId, "manifest.json"),
      ),
    ).resolves.toBeUndefined();

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, firstBuildId),
        previewDirectory,
        buildId: firstBuildId,
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow();
    expect(await readFile(first.currentPointer)).toEqual(pointerBeforeFailure);

    const emptyBuildId = "existing-empty-build";
    const emptyBuildDirectory = join(previewDirectory, "builds", emptyBuildId);
    await mkdir(emptyBuildDirectory);
    const emptyStaging = await createStagedBuild(root, emptyBuildId);
    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: emptyStaging,
        previewDirectory,
        buildId: emptyBuildId,
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow("destination already exists");
    expect(await readdir(emptyBuildDirectory)).toEqual([]);
    await expect(stat(emptyStaging)).resolves.toMatchObject({});
    expect(await readFile(first.currentPointer)).toEqual(pointerBeforeFailure);
  });

  it("rejects corrupt media and incomplete reports before publishing or changing current", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-integrity-"));
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(previewDirectory, { recursive: true });
    const previousPointer = json({ schemaVersion: 1, buildId: "previous" });
    await writeFile(join(previewDirectory, "current.json"), previousPointer);

    for (const [buildId, variant, message] of [
      ["corrupt-media", "corrupt-mp4", "invalid file signature"],
      ["hash-mismatch", "hash-mismatch", "size/hash integrity check"],
      ["missing-metadata", "incomplete-report", "Build metadata is incomplete"],
      ["invalid-frames", "invalid-frame-shape", "invalid checked frame"],
      ["mixed-runtime", "mixed-runtime", "disagree on shared runtime"],
      [
        "mixed-timestamps",
        "mixed-timestamps",
        "disagree on shared completedAt",
      ],
    ] as const) {
      await expect(
        promotePreviewBuild({
          stagedBuildDirectory: await createStagedBuild(root, buildId, variant),
          previewDirectory,
          buildId,
          draft,
          probe,
          decode,
          contactSheetProbe,
          contactSheetDecode,
        }),
      ).rejects.toThrow(message);
      expect(
        await readFile(join(previewDirectory, "current.json"), "utf8"),
      ).toBe(previousPointer);
      await expect(
        stat(join(previewDirectory, "builds", buildId)),
      ).rejects.toMatchObject({ code: "ENOENT" });
    }
  });

  it("rejects plausible probed media when full decode fails or audio exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-media-gate-"));
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(previewDirectory, { recursive: true });
    const previousPointer = json({ schemaVersion: 1, buildId: "previous" });
    await writeFile(join(previewDirectory, "current.json"), previousPointer);

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, "decode-corrupt"),
        previewDirectory,
        buildId: "decode-corrupt",
        draft,
        probe,
        decode: async () => {
          throw new Error("synthetic full decode failure");
        },
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow("full decode failure");
    expect(await readFile(join(previewDirectory, "current.json"), "utf8")).toBe(
      previousPointer,
    );

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, "contains-audio"),
        previewDirectory,
        buildId: "contains-audio",
        draft,
        probe: async () => {
          const result = await probe();
          return {
            ...result,
            streams: [
              ...(result.streams as unknown[]),
              { codec_type: "audio", codec_name: "aac" },
            ],
          };
        },
        decode,
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow("contains an audio stream");
    expect(await readFile(join(previewDirectory, "current.json"), "utf8")).toBe(
      previousPointer,
    );
  });

  it("rejects incomplete contact-sheet evidence and missing representative coverage", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-contact-"));
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    const previousPointer = json({ schemaVersion: 1, buildId: "previous" });
    await writeFile(join(previewDirectory, "current.json"), previousPointer);

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(
          root,
          "decode-invalid-contact",
          "invalid-contact-sheet",
        ),
        previewDirectory,
        buildId: "decode-invalid-contact",
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode: async () => {
          throw new Error("synthetic PNG decode failure");
        },
      }),
    ).rejects.toThrow("PNG decode failure");

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(
          root,
          "missing-coverage",
          "missing-coverage",
        ),
        previewDirectory,
        buildId: "missing-coverage",
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
      }),
    ).rejects.toThrow("missing required representative coverage");

    expect(await readFile(join(previewDirectory, "current.json"), "utf8")).toBe(
      previousPointer,
    );
  });

  it("rejects output symlinks before any render or external write", async () => {
    for (const unsafeRoot of ["preview", "attempts"] as const) {
      const root = await mkdtemp(join(tmpdir(), "naraframe-preview-symlink-"));
      const external = await mkdtemp(
        join(tmpdir(), "naraframe-preview-external-"),
      );
      temporaryRoots.push(root, external);
      const sentinel = join(external, "current.json");
      await writeFile(sentinel, "unchanged\n");
      await mkdir(join(root, ".naraframe"), { recursive: true });
      if (unsafeRoot === "preview") {
        await mkdir(join(root, ".naraframe", "attempts"));
        await symlink(external, join(root, "preview"));
      } else {
        await mkdir(join(root, "preview", "builds"), { recursive: true });
        await symlink(external, join(root, ".naraframe", "attempts"));
      }

      await expect(
        publishPreviewBuild({ draft, projectRoot: root, issues: [] }),
      ).rejects.toThrow("Unsafe output path");
      expect(await readFile(sentinel, "utf8")).toBe("unchanged\n");
      expect(await readdir(external)).toEqual(["current.json"]);
    }
  });

  it("selects at least one checked frame per scene and each semantic beat", () => {
    const frames = selectCheckedFrames(draft, []);
    for (const scene of draft.scenes) {
      expect(frames.some((frame) => frame.sceneId === scene.id)).toBe(true);
      for (const beat of scene.beats) {
        expect(
          frames.some((frame) =>
            frame.reasons.includes(`semantic-beat:${beat.action}:${beat.id}`),
          ),
        ).toBe(true);
      }
    }

    const stagingPath = join(tmpdir(), "attempt", "build", "preview.mp4");
    const publishedDirectory = join(tmpdir(), "preview", "builds", "build-id");
    const published = withPublishedOutputPath(
      {
        outputPath: stagingPath,
        durationInFrames: draft.totalFrames,
        width: draft.width,
        height: draft.height,
        fps: draft.fps,
        browserExecutable: "/fixture/chrome",
        remotionVersion: "4.0.521",
      },
      publishedDirectory,
    );
    expect(published.outputPath).toBe(join(publishedDirectory, "preview.mp4"));
  });
});
