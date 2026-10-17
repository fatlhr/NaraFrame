import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";
import {
  type CompiledDraft,
  compileDraft,
  loadPlanProject,
} from "@naraframe/core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FRAME_INTEGRITY_METHOD,
  isFrameIntegrityError,
} from "../../src/frame-integrity.js";
import {
  contactSheetLayoutFor,
  preparePreviewOutputRoots,
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
    | "label-audio-mismatch"
    | "mixed-timestamps" = "valid",
  audio: {
    draft?: CompiledDraft;
    render?: { audio: "none" | "aac"; muted: boolean };
  } = {},
): Promise<string> => {
  const target = audio.draft ?? draft;
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
  const expectedFrames = selectCheckedFrames(target, []);
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
    sourceRevision: target.sourceRevision,
    assemblyKey: target.assemblyKey,
    mode: target.mode,
    scope: target.scope,
    timelineScope: target.timelineScope,
    label:
      variant === "label-audio-mismatch" ? "DRAFT • WITH AUDIO" : target.label,
    profile: { id: target.profile.id, version: target.profile.version },
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
      width: target.width,
      height: target.height,
      fps: target.fps,
      durationInFrames: target.totalFrames,
      codec: "h264",
      ...(audio.render ?? { audio: "none", muted: true }),
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
    sourceRevision: target.sourceRevision,
    assemblyKey: target.assemblyKey,
    scope: target.scope,
    timelineScope: target.timelineScope,
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
  it("creates safe output roots and publishes from a fresh source-only project", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-fresh-"));
    temporaryRoots.push(root);
    await Promise.all([
      cp(join(sampleRoot, "assets"), join(root, "assets"), { recursive: true }),
      ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
        cp(join(sampleRoot, file), join(root, file)),
      ),
    ]);
    await expect(stat(join(root, ".naraframe"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(stat(join(root, "preview"))).rejects.toMatchObject({
      code: "ENOENT",
    });

    const outputRoots = await preparePreviewOutputRoots(root);
    await expect(stat(outputRoots.attempts)).resolves.toMatchObject({});
    await expect(stat(outputRoots.builds)).resolves.toMatchObject({});

    const buildId = "first-fresh-checkout-build";
    const published = await promotePreviewBuild({
      stagedBuildDirectory: await createStagedBuild(root, buildId),
      previewDirectory: outputRoots.preview,
      buildId,
      draft,
      probe,
      decode,
      contactSheetProbe,
      contactSheetDecode,
    });
    await expect(stat(published.buildDirectory)).resolves.toMatchObject({});
    expect(
      JSON.parse(await readFile(published.currentPointer, "utf8")),
    ).toMatchObject({ buildId, manifestSha256: published.manifestSha256 });
  });

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

  it("does not replace the pointer when cancellation arrives after pointer preparation", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "naraframe-preview-pointer-race-"),
    );
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    const previousPointer = json({ schemaVersion: 1, buildId: "previous" });
    await writeFile(join(previewDirectory, "current.json"), previousPointer);
    const controller = new AbortController();

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(
          root,
          "cancelled-pointer",
        ),
        previewDirectory,
        buildId: "cancelled-pointer",
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
        signal: controller.signal,
        onPointerPrepared: () => controller.abort(),
      } as Parameters<typeof promotePreviewBuild>[0] & {
        onPointerPrepared: () => void;
      }),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(await readFile(join(previewDirectory, "current.json"), "utf8")).toBe(
      previousPointer,
    );
    expect(
      (await readdir(previewDirectory)).filter((entry) =>
        entry.startsWith(".current-"),
      ),
    ).toEqual([]);
  });

  it("closes the pointer handle when cancellation arrives immediately after open", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "naraframe-preview-pointer-open-abort-"),
    );
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    const controller = new AbortController();
    const close = vi.fn(async () => undefined);

    await expect(
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, "opened-pointer"),
        previewDirectory,
        buildId: "opened-pointer",
        draft,
        probe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
        signal: controller.signal,
        pointerOpener: async () => {
          controller.abort();
          return {
            sync: async () => undefined,
            close,
          } as Awaited<ReturnType<typeof open>>;
        },
      }),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps the pointer successful when a signal arrives while rename is in flight", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "naraframe-preview-pointer-commit-"),
    );
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    const controller = new AbortController();
    const buildId = "committed-pointer";
    let releaseRename: (() => void) | undefined;
    const renameReleased = new Promise<void>((resolvePromise) => {
      releaseRename = resolvePromise;
    });
    let signalRenameStarted: (() => void) | undefined;
    const renameStarted = new Promise<void>((resolvePromise) => {
      signalRenameStarted = resolvePromise;
    });

    const promotion = promotePreviewBuild({
      stagedBuildDirectory: await createStagedBuild(root, buildId),
      previewDirectory,
      buildId,
      draft,
      probe,
      decode,
      contactSheetProbe,
      contactSheetDecode,
      signal: controller.signal,
      onPointerRenameDispatched: () => controller.abort(),
      pointerRenamer: async (from: string, to: string) => {
        signalRenameStarted?.();
        await renameReleased;
        await rename(from, to);
      },
    });

    const dispatched = await Promise.race([
      renameStarted.then(() => true),
      new Promise<boolean>((resolvePromise) => {
        // A generous bound: promotion hashes and probes files first, which can
        // take well over 50 ms on a busy machine.
        setTimeout(() => resolvePromise(false), 5000);
      }),
    ]);
    expect(dispatched).toBe(true);
    expect(controller.signal.aborted).toBe(true);
    releaseRename?.();
    const promoted = await promotion;
    expect(
      JSON.parse(await readFile(promoted.currentPointer, "utf8")),
    ).toMatchObject({ buildId });
    expect(
      (await readdir(previewDirectory)).filter((entry) =>
        entry.startsWith(".current-"),
      ),
    ).toEqual([]);
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
        "label-mismatch",
        "label-audio-mismatch",
        "Build metadata is incomplete",
      ],
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

  it("publishes a soundtrack-only draft with AAC and rejects metadata that denies its audio", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-soundtrack-"));
    temporaryRoots.push(root);
    const previewDirectory = join(root, "preview");
    await mkdir(join(previewDirectory, "builds"), { recursive: true });
    const previousPointer = json({ schemaVersion: 1, buildId: "previous" });
    await writeFile(join(previewDirectory, "current.json"), previousPointer);
    // Music without narration: the renderer writes one AAC stream and the
    // compiler labels the draft as carrying audio.
    const soundtrackDraft: CompiledDraft = {
      ...draft,
      label: "DRAFT • WITH AUDIO",
      soundtrack: {
        music: {
          assetId: "music-bed",
          volume: 0.6,
          loop: false,
          trimStartFrames: 0,
          fadeInFrames: 6,
          fadeOutFrames: 9,
        },
        sfx: [],
      },
    };
    expect(soundtrackDraft.narration).toBeUndefined();
    const withAac = async () => {
      const result = await probe();
      return {
        ...result,
        streams: [
          ...(result.streams as unknown[]),
          { codec_type: "audio", codec_name: "aac" },
        ],
      };
    };
    const promote = async (
      buildId: string,
      render: { audio: "none" | "aac"; muted: boolean },
      mediaProbe = withAac,
    ) =>
      promotePreviewBuild({
        stagedBuildDirectory: await createStagedBuild(root, buildId, "valid", {
          draft: soundtrackDraft,
          render,
        }),
        previewDirectory,
        buildId,
        draft: soundtrackDraft,
        probe: mediaProbe,
        decode,
        contactSheetProbe,
        contactSheetDecode,
      });

    for (const [buildId, render] of [
      ["claims-silence", { audio: "none", muted: true }],
      ["claims-muted", { audio: "aac", muted: true }],
    ] as const) {
      await expect(promote(buildId, render)).rejects.toThrow(
        "Build metadata is incomplete",
      );
      expect(
        await readFile(join(previewDirectory, "current.json"), "utf8"),
      ).toBe(previousPointer);
      await expect(
        stat(join(previewDirectory, "builds", buildId)),
      ).rejects.toMatchObject({ code: "ENOENT" });
    }
    await expect(
      promote("missing-audio-stream", { audio: "aac", muted: false }, probe),
    ).rejects.toThrow("exactly one AAC audio stream");

    const published = await promote("soundtrack-only", {
      audio: "aac",
      muted: false,
    });
    expect(
      JSON.parse(await readFile(published.currentPointer, "utf8")),
    ).toMatchObject({
      buildId: "soundtrack-only",
      manifestSha256: published.manifestSha256,
    });
    expect(
      JSON.parse(
        await readFile(join(published.buildDirectory, "manifest.json"), "utf8"),
      ).render,
    ).toMatchObject({ audio: "aac", muted: false });
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
      if (unsafeRoot === "preview") {
        await symlink(external, join(root, "preview"));
      } else {
        await mkdir(join(root, ".naraframe"));
        await symlink(external, join(root, ".naraframe", "attempts"));
      }

      await expect(
        publishPreviewBuild({ draft, projectRoot: root, issues: [] }),
      ).rejects.toThrow("Unsafe output path");
      expect(await readFile(sentinel, "utf8")).toBe("unchanged\n");
      expect(await readdir(external)).toEqual(["current.json"]);
      expect(await readdir(root)).toEqual([
        unsafeRoot === "preview" ? "preview" : ".naraframe",
      ]);
    }
  });

  it("cleans attempt staging when rendering fails before publication", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-cleanup-"));
    temporaryRoots.push(root);
    const previousBrowser = process.env.NARAFRAME_BROWSER_EXECUTABLE;
    process.env.NARAFRAME_BROWSER_EXECUTABLE = join(root, "missing-browser");

    try {
      await expect(
        publishPreviewBuild({ draft, projectRoot: root, issues: [] }),
      ).rejects.toThrow("Browser executable not found");
    } finally {
      if (previousBrowser === undefined) {
        delete process.env.NARAFRAME_BROWSER_EXECUTABLE;
      } else {
        process.env.NARAFRAME_BROWSER_EXECUTABLE = previousBrowser;
      }
    }

    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
    expect(await readdir(join(root, "preview", "builds"))).toEqual([]);
  });

  it("keeps a beat ending at a scene boundary in its owning scene", () => {
    const boundaryDraft = structuredClone(draft);
    const first = boundaryDraft.scenes[0];
    const next = boundaryDraft.scenes[1];
    if (!first || !next) throw new Error("Boundary fixture needs two scenes");
    first.beats = [
      {
        id: "boundary-exit",
        targetId: first.id,
        action: "exit",
        startFrame: 0,
        durationInFrames: first.endFrame - first.startFrame,
        params: {},
      },
    ];
    const frames = selectCheckedFrames(boundaryDraft, []);
    const settled = frames.find((frame) =>
      frame.reasons.includes("semantic-beat-settled:exit:boundary-exit"),
    );
    expect(settled).toMatchObject({
      frame: first.endFrame - 1,
      sceneId: first.id,
    });
    expect(
      frames.find((frame) => frame.frame === next.startFrame),
    ).toMatchObject({
      sceneId: next.id,
      reasons: expect.arrayContaining(["scene-entry"]),
    });
    for (const frame of frames) {
      const owner = boundaryDraft.scenes.find(
        (scene) => scene.id === frame.sceneId,
      );
      expect(owner).toBeDefined();
      expect(frame.frame).toBeGreaterThanOrEqual(owner?.startFrame ?? Infinity);
      expect(frame.frame).toBeLessThan(owner?.endFrame ?? -Infinity);
    }
  });

  it("retains the source offset when clamping a scoped scene's final beat", () => {
    const scoped = structuredClone(draft);
    const scene = scoped.scenes[1];
    if (!scene) throw new Error("Scoped fixture needs a second scene");
    const sourceStartFrame = scene.startFrame;
    const sourceEndFrame = scene.endFrame;
    const duration = sourceEndFrame - sourceStartFrame;
    scene.startFrame = 0;
    scene.endFrame = duration;
    scene.beats = [
      {
        id: "scoped-exit",
        targetId: scene.id,
        action: "exit",
        startFrame: 0,
        durationInFrames: duration,
        params: {},
      },
    ];
    scoped.scenes = [scene];
    scoped.totalFrames = duration;
    scoped.scope = {
      type: "scene",
      sceneId: scene.id,
      sourceStartFrame,
      sourceEndFrame,
    };
    const frames = selectCheckedFrames(scoped, []);
    expect(
      frames.find((frame) =>
        frame.reasons.includes("semantic-beat-settled:exit:scoped-exit"),
      ),
    ).toMatchObject({
      frame: duration - 1,
      sourceFrame: sourceEndFrame - 1,
      sceneId: scene.id,
    });
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

const ffmpeg =
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

describe.skipIf(!existsSync(ffmpeg))("frame integrity of a new render", () => {
  /** Stands in for the renderer: a real, flat H.264 clip of the draft's size. */
  const fakeRender = (async ({ outputPath }: { outputPath?: string }) => {
    if (!outputPath) throw new Error("fixture needs an output path");
    await promisify(execFile)(ffmpeg, [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      `color=c=0x305070:s=${draft.width}x${draft.height}:r=${draft.fps}`,
      "-frames:v",
      String(draft.totalFrames),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ]);
    return {
      outputPath,
      durationInFrames: draft.totalFrames,
      width: draft.width,
      height: draft.height,
      fps: draft.fps,
      browserExecutable: process.execPath,
      remotionVersion: "test",
      visualPreflight: { issues: [], frames: [] },
    };
  }) as never;

  it("records a passing check in the report and manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-integrity-"));
    temporaryRoots.push(root);
    const published = await publishPreviewBuild({
      draft,
      projectRoot: root,
      issues: [],
      render: fakeRender,
    });
    for (const name of ["report.json", "manifest.json"]) {
      const metadata = JSON.parse(
        await readFile(join(published.buildDirectory, name), "utf8"),
      );
      expect(metadata.frameIntegrity).toEqual({
        method: FRAME_INTEGRITY_METHOD,
        frames: draft.totalFrames,
        outliers: [],
      });
    }
  });

  it("publishes nothing when the new render has incomplete frames", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-preview-integrity-"));
    temporaryRoots.push(root);
    const failure = await publishPreviewBuild({
      draft,
      projectRoot: root,
      issues: [],
      render: fakeRender,
      frameIntegrity: async () => ({
        method: FRAME_INTEGRITY_METHOD,
        frames: draft.totalFrames,
        outliers: [{ frame: 223, dp: 40, dn: 41, dpn: 2 }],
      }),
    }).catch((error: unknown) => error);

    expect(isFrameIntegrityError(failure)).toBe(true);
    if (!isFrameIntegrityError(failure)) return;
    expect(failure.issues).toEqual([
      expect.objectContaining({
        code: "RENDER_FRAME_INTEGRITY",
        artifact: "preview.mp4",
        message: expect.stringContaining("frame 223"),
      }),
    ]);
    expect(await readdir(join(root, "preview", "builds"))).toEqual([]);
    await expect(
      access(join(root, "preview", "current.json")),
    ).rejects.toThrow();
    expect(await readdir(join(root, ".naraframe", "attempts"))).toEqual([]);
  });
});
