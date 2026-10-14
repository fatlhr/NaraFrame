import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  compileDraft,
  generationKeyForBlock,
  loadPlanProject,
} from "@naraframe/core";
import { expect, it } from "vitest";

const run = promisify(execFile);
const repository = fileURLToPath(new URL("../../../..", import.meta.url));
const fixture = join(repository, "test-fixtures/project-general-explainer");
const entry = join(repository, "packages/cli/dist/index.js");
const hash = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
interface Event {
  success: boolean;
  sourceRevision: string;
  buildId: string;
  data: { reusedFromBuildId?: string };
  artifacts: { previewMp4: string };
  issues: Array<{ code: string }>;
}
const cli = async (...args: string[]): Promise<Event> => {
  const result = await run(process.execPath, [entry, ...args, "--json"], {
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  }).catch((error: { stdout: string }) => ({ stdout: error.stdout }));
  return JSON.parse(result.stdout.trim().split("\n").at(-1) ?? "{}");
};
const crop = async (file: string, frame: number) => {
  const { stdout } = await run(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      file,
      "-vf",
      `select=eq(n\\,${frame}),crop=540:120:0:760`,
      "-frames:v",
      "1",
      "-pix_fmt",
      "rgb24",
      "-f",
      "rawvideo",
      "-",
    ],
    { encoding: "buffer", maxBuffer: 1024 * 1024 },
  );
  return stdout;
};
const mse = (a: Buffer, b: Buffer) => {
  expect(a.length).toBe(b.length);
  expect(a.length).toBeGreaterThan(0);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += ((a[i] ?? 0) - (b[i] ?? 0)) ** 2;
  return sum / a.length;
};

it("revises caption policy without changing audio, clips selected frame windows, and undoes to reusable pixels", async () => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-caption-policy-"));
  try {
    const read = async (file: string) =>
      JSON.parse(await readFile(join(fixture, file), "utf8"));
    const put = async (file: string, value: unknown) =>
      writeFile(join(root, file), JSON.stringify(value, null, 2));
    const config = await read("naraframe.json");
    delete config.soundtrack;
    config.id = "caption-policy-e2e";
    config.audioMode = "voice";
    await put("naraframe.json", config);
    const profile = await read("profile.lock.json");
    if (!profile.overridablePaths.includes("render.captions"))
      profile.overridablePaths.push("render.captions");
    profile.render.captions = { fontSize: 44, maxLines: 3 };
    await put("profile.lock.json", profile);
    const narration = await read("narration.json");
    narration.order = ["question"];
    narration.blocks = narration.blocks.filter(
      (b: { id: string }) => b.id === "question",
    );
    await put("narration.json", narration);
    const manifest = await read("assets/manifest.json");
    manifest.assets = manifest.assets.filter(
      (a: { id: string }) => a.id === "voice-question",
    );
    await mkdir(join(root, "assets"));
    await put("assets/manifest.json", manifest);
    for (const asset of manifest.assets) {
      await mkdir(dirname(join(root, asset.path)), { recursive: true });
      await cp(join(fixture, asset.path), join(root, asset.path));
    }
    await put("scenes.json", {
      schemaVersion: 1,
      scenes: [
        {
          id: "caption-proof",
          narrativeRole: "explanation",
          durationMs: 6151,
          narration: { blockId: "question" },
          visual: {
            type: "composition",
            layers: [
              {
                id: "backing",
                type: "shape",
                shape: "rectangle",
                fill: "palette.accent",
                frame: { x: 0, y: 1460, width: 1080, height: 420 },
                opacity: 1,
                rotationDeg: 0,
                zIndex: 0,
              },
            ],
          },
          beats: [],
          transition: { type: "cut" },
        },
      ],
    });
    await put("captions.json", {
      schemaVersion: 1,
      corrections: [],
      mode: "full",
    });
    const state = async () => {
      const loaded = await loadPlanProject(root);
      if (!loaded.ok) throw Error(JSON.stringify(loaded.issues));
      const source = loaded.value.source;
      const block = source.narration?.blocks[0];
      if (!block) throw Error("fixture");
      const draft = compileDraft(source);
      if (!draft.ok) throw Error(JSON.stringify(draft.issues));
      return {
        voiceKey: generationKeyForBlock(source, block),
        narration: source.narration,
        frames: draft.value.totalFrames,
        captions: draft.value.captions,
      };
    };
    const original = await state();
    expect((await cli("validate", root, "--stage", "plan")).success).toBe(true);
    const full = await cli("preview", root, "--draft");
    expect(full.success).toBe(true);
    const native = await cli("preview", root, "--resolution", "1080");
    expect(native.success).toBe(true);
    const stage = join(root, "staging");
    await mkdir(stage);
    const edit = async (captions: unknown) => {
      await writeFile(join(stage, "captions.json"), JSON.stringify(captions));
      const status = await cli("status", root);
      expect(
        (
          await cli(
            "edit",
            root,
            "--from",
            stage,
            "--expect",
            status.sourceRevision,
          )
        ).success,
      ).toBe(true);
      expect((await cli("validate", root, "--stage", "plan")).success).toBe(
        true,
      );
    };
    await edit({
      schemaVersion: 1,
      corrections: [],
      mode: "selected",
      selections: [
        {
          blockId: "question",
          phraseId: "question-p1",
          startOffsetMs: 300,
          endOffsetMs: 1800,
        },
      ],
    });
    const selected = await cli("preview", root, "--draft");
    expect(selected.success).toBe(true);
    expect(selected.buildId).not.toBe(full.buildId);
    const stale = await cli(
      "render",
      root,
      "--approve-preview",
      native.buildId,
    );
    expect(stale.issues.map((i) => i.code)).toContain("APPROVAL_PREVIEW_STALE");
    await edit({ schemaVersion: 1, corrections: [], mode: "none" });
    const none = await cli("preview", root, "--draft");
    expect(none.success).toBe(true);
    const noneNative = await cli("preview", root, "--resolution", "1080");
    expect(noneNative.success).toBe(true);
    const after = await state();
    expect(after.captions).toBeUndefined();
    expect(after.voiceKey).toBe(original.voiceKey);
    expect(after.narration).toEqual(original.narration);
    expect(after.frames).toBe(original.frames);
    for (const frame of [0, 8, 54, 91])
      expect(
        mse(
          await crop(selected.artifacts.previewMp4, frame),
          await crop(none.artifacts.previewMp4, frame),
        ),
      ).toBeLessThan(1);
    for (const frame of [9, 53])
      expect(
        mse(
          await crop(selected.artifacts.previewMp4, frame),
          await crop(none.artifacts.previewMp4, frame),
        ),
      ).toBeGreaterThan(100);
    const pcmHash = async (event: Event) =>
      hash(
        (
          await run(
            "ffmpeg",
            [
              "-v",
              "error",
              "-i",
              event.artifacts.previewMp4,
              "-map",
              "0:a:0",
              "-f",
              "f32le",
              "-",
            ],
            { encoding: "buffer", maxBuffer: 8 * 1024 * 1024 },
          )
        ).stdout,
      );
    const audio = await pcmHash(full);
    for (const event of [native, selected, none, noneNative])
      expect(await pcmHash(event)).toBe(audio);
    expect(hash(await readFile(join(root, manifest.assets[0].path)))).toBe(
      manifest.assets[0].sha256,
    );
    await edit({
      schemaVersion: 1,
      corrections: [],
      mode: "selected",
      selections: [],
    });
    const empty = await cli("preview", root, "--draft");
    expect(empty.success).toBe(true);
    expect(empty.data.reusedFromBuildId).toBe(none.buildId);
    for (let i = 0; i < 3; i++)
      expect((await cli("undo", root)).success).toBe(true);
    const restored = await cli("preview", root, "--draft");
    expect(restored.success).toBe(true);
    expect(restored.data.reusedFromBuildId).toBe(full.buildId);
    expect(hash(await readFile(restored.artifacts.previewMp4))).toBe(
      hash(await readFile(full.artifacts.previewMp4)),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 600_000);
