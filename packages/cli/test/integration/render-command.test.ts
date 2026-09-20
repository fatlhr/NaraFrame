import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "@naraframe/cli";
import {
  compileDraft,
  loadPlanProject,
  narrationTextHash,
  type PlanSource,
  readApprovals,
} from "@naraframe/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { narratedSource } from "../../../core/test/integration/narrated-source.js";

const ffmpeg =
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const roots: string[] = [];

interface Event {
  status: string;
  success: boolean;
  readiness: string;
  sourceRevision: string | null;
  issues: Array<{ code: string; severity: string }>;
  data: Record<string, unknown>;
}

const run = async (
  ...args: string[]
): Promise<{ exitCode: number; event: Event }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(String(value));
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitCode = await runCli([...args, "--json"]);
  vi.restoreAllMocks();
  return { exitCode, event: JSON.parse(writes.at(-1) ?? "{}") as Event };
};

const tone = (path: string, seconds: number) =>
  execFileSync(ffmpeg, [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:sample_rate=48000:duration=${seconds}`,
    path,
  ]);

interface Options {
  contextDeclaredMs?: number;
  omitNarration?: boolean;
  plannedImage?: boolean;
  /** Scene that still uses the planned image; defaults to s1. */
  plannedImageOn?: string;
  /** Leave the first block without audio. */
  plannedContext?: boolean;
  unbound?: boolean;
}

/** A narrated project on disk with real, correctly sized WAV audio. */
const makeProject = async (
  options: Options = {},
): Promise<{ root: string; source: PlanSource }> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-render-"));
  roots.push(root);
  await mkdir(join(root, "assets"), { recursive: true });
  await mkdir(join(root, "audio", "narration"), { recursive: true });
  const seconds = { context: 2.4, mechanism: 1.8 };
  const audio: Record<string, { path: string; sha: string }> = {};
  for (const [name, length] of Object.entries(seconds)) {
    const temporary = join(root, `${name}.wav`);
    tone(temporary, length);
    const bytes = await readFile(temporary);
    const path = `audio/narration/${sha(bytes)}.wav`;
    await writeFile(join(root, path), bytes);
    await rm(temporary);
    audio[name] = { path, sha: sha(bytes) };
  }
  const base = narratedSource({
    contextDurationMs: options.contextDeclaredMs ?? 2400,
    requireSourcing: false,
  });
  const text = (id: string) =>
    base.narration?.blocks.find((block) => block.id === id)?.text ?? "";
  const generation = (id: string) =>
    options.unbound
      ? {}
      : { generation: { textSha256: narrationTextHash(text(id)) } };
  const source: PlanSource = {
    ...base,
    profile: {
      ...base.profile,
      direction: {
        text: "Probe direction.",
        sha256: sha(Buffer.from("Probe direction.")),
      },
    },
    assets: {
      schemaVersion: 1,
      assets: [
        {
          id: "voice-context",
          status: "ready",
          kind: "wav",
          path: audio.context?.path ?? "",
          sha256: audio.context?.sha ?? "",
          origin: { type: "generated" },
          ...generation("context"),
        },
        {
          id: "voice-mechanism",
          status: "ready",
          kind: "wav",
          path: audio.mechanism?.path ?? "",
          sha256: audio.mechanism?.sha ?? "",
          origin: { type: "generated" },
          ...generation("mechanism"),
        },
        ...(options.plannedImage || options.plannedImageOn
          ? [
              {
                id: "art",
                status: "planned" as const,
                kind: "png" as const,
                purpose: "Ilustrasi",
                intendedOrigin: "generated" as const,
              },
            ]
          : []),
      ] as PlanSource["assets"]["assets"],
    },
    scenes: {
      ...base.scenes,
      scenes: base.scenes.scenes.map((scene) =>
        (options.plannedImage || options.plannedImageOn) &&
        scene.id === (options.plannedImageOn ?? "s1")
          ? {
              ...scene,
              visual: {
                type: "media" as const,
                assetId: "art",
                fit: "cover" as const,
              },
            }
          : scene,
      ),
    },
  };
  const write = (name: string, value: unknown) =>
    writeFile(join(root, name), JSON.stringify(value, null, 2));
  await write("naraframe.json", source.project);
  await write("profile.lock.json", source.profile);
  await write("scenes.json", source.scenes);
  await write("assets/manifest.json", source.assets);
  if (options.plannedContext) {
    const blocks = source.narration?.blocks.map((block) =>
      block.id === "context" ? { id: "context", text: block.text } : block,
    );
    await write("narration.json", { ...source.narration, blocks });
  } else if (!options.omitNarration)
    await write("narration.json", source.narration);
  else
    await write("scenes.json", {
      ...source.scenes,
      scenes: source.scenes.scenes.map(({ narration: _n, ...scene }) => scene),
    });
  return { root, source };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

const codes = (event: Event) =>
  event.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => issue.code);

describe.skipIf(!existsSync(ffmpeg))("validate --stage production", () => {
  it("passes for a narrated project whose audio is real, bound, and correctly sized", async () => {
    const { root } = await makeProject();
    const { exitCode, event } = await run(
      "validate",
      root,
      "--stage",
      "production",
    );
    expect(exitCode, JSON.stringify(event.issues)).toBe(0);
    expect(event).toMatchObject({
      status: "completed",
      readiness: "ready",
      data: { stage: "production" },
    });
  });

  it("rejects audio whose real length differs from the declared block duration", async () => {
    const { root } = await makeProject({ contextDeclaredMs: 2700 });
    const { exitCode, event } = await run(
      "validate",
      root,
      "--stage",
      "production",
    );
    expect(exitCode).toBe(1);
    expect(codes(event)).toContain("AUDIO_DURATION_MISMATCH");
  });

  it("rejects narrated audio that cannot be proven current", async () => {
    const { root } = await makeProject({ unbound: true });
    const { event } = await run("validate", root, "--stage", "production");
    expect(codes(event)).toContain("VOICE_BINDING_MISSING");
  });

  it("rejects a planned image that a scene still uses, and a project with no narration", async () => {
    const planned = await makeProject({ plannedImage: true });
    expect(
      codes(
        (await run("validate", planned.root, "--stage", "production")).event,
      ),
    ).toContain("ASSET_NOT_READY");
    const silent = await makeProject({ omitNarration: true });
    expect(
      codes(
        (await run("validate", silent.root, "--stage", "production")).event,
      ),
    ).toContain("NARRATION_REQUIRED");
  });

  it("still accepts the plan stage and rejects an unknown stage", async () => {
    const { root } = await makeProject();
    expect((await run("validate", root, "--stage", "plan")).exitCode).toBe(0);
    expect((await run("validate", root, "--stage", "publish")).exitCode).toBe(
      3,
    );
  });
});

describe.skipIf(!existsSync(ffmpeg))("render command gates", () => {
  it("needs exactly one approval and an owner name for autonomous export", async () => {
    const { root } = await makeProject();
    expect((await run("render", root)).exitCode).toBe(3);
    expect((await run("render", root, "--autonomous")).exitCode).toBe(3);
    expect(
      (
        await run(
          "render",
          root,
          "--approve-preview",
          "p1",
          "--autonomous",
          "--authorized-by",
          "fatih",
        )
      ).exitCode,
    ).toBe(3);
    expect(
      (
        await run(
          "render",
          root,
          "--approve-preview",
          "p1",
          "--authorized-by",
          "fatih",
        )
      ).exitCode,
    ).toBe(3);
  });

  it("refuses a project that is not production-ready before recording any approval", async () => {
    const { root } = await makeProject({ plannedImage: true });
    const { exitCode, event } = await run(
      "render",
      root,
      "--approve-preview",
      "p1",
    );
    expect(exitCode).toBe(1);
    expect(codes(event)).toContain("ASSET_NOT_READY");
    await expect(
      readFile(join(root, "revisions", "approvals")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects an approval that names an unknown preview build", async () => {
    const { root } = await makeProject();
    const { exitCode, event } = await run(
      "render",
      root,
      "--approve-preview",
      "does-not-exist",
    );
    expect(exitCode).toBe(1);
    expect(codes(event)).toEqual(["APPROVAL_PREVIEW_UNKNOWN"]);
    expect(await readApprovals(root, event.sourceRevision ?? "")).toEqual([]);
  });

  it("does not carry a review of an older source over to the current one", async () => {
    const { root, source } = await makeProject();
    const stale = compileDraft({
      ...source,
      scenes: {
        ...source.scenes,
        scenes: source.scenes.scenes.map((scene) =>
          scene.id === "s1"
            ? {
                ...scene,
                visual: { type: "text" as const, text: "Versi lama" },
              }
            : scene,
        ),
      },
    });
    if (!stale.ok) throw new Error("fixture");
    const directory = join(root, "preview", "builds", "old-build");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "manifest.json"),
      JSON.stringify({
        sourceRevision: stale.value.sourceRevision,
        assemblyKey: stale.value.assemblyKey,
        scope: { type: "project" },
        render: { audio: "aac" },
      }),
    );
    const { exitCode, event } = await run(
      "render",
      root,
      "--approve-preview",
      "old-build",
    );
    expect(exitCode).toBe(1);
    expect(codes(event)).toEqual(["APPROVAL_PREVIEW_STALE"]);
  });

  it("does not accept a silent preview as the review of a narrated export", async () => {
    const { root } = await makeProject();
    const current = compileDraft(
      (await loadPlanProject(root)).value?.source as PlanSource,
    );
    if (!current.ok) throw new Error("fixture");
    const directory = join(root, "preview", "builds", "silent-build");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "manifest.json"),
      JSON.stringify({
        sourceRevision: current.value.sourceRevision,
        assemblyKey: current.value.assemblyKey,
        scope: { type: "project" },
        render: { audio: "none" },
      }),
    );
    const { event } = await run(
      "render",
      root,
      "--approve-preview",
      "silent-build",
    );
    expect(codes(event)).toEqual(["APPROVAL_PREVIEW_SILENT"]);
  });
});

describe.skipIf(!existsSync(ffmpeg))("status output and approval", () => {
  it("reports no export and no approval for a project that has none", async () => {
    const { root } = await makeProject();
    const { event } = await run("status", root);
    expect(event.data.output).toEqual({ buildId: null, state: "none" });
    expect(event.data.approval).toBeNull();
  });
});

describe.skipIf(!existsSync(ffmpeg))("scoped production checks", () => {
  const scopedCheck = (root: string, sceneId?: string) =>
    run(
      "validate",
      root,
      "--stage",
      "production",
      ...(sceneId ? ["--scene", sceneId] : []),
    );
  const infoCodes = (event: Event) =>
    event.issues
      .filter((issue) => issue.severity === "info")
      .map((issue) => issue.code);

  it("passes a ready scene while the last scene's image is still planned, and reports the gap separately", async () => {
    const { root } = await makeProject({ plannedImageOn: "s3" });
    const scene = await scopedCheck(root, "s1");
    expect(scene.exitCode, JSON.stringify(scene.event.issues)).toBe(0);
    expect(scene.event).toMatchObject({
      status: "completed",
      readiness: "ready",
      data: { stage: "production" },
    });
    expect(infoCodes(scene.event)).toContain("OUT_OF_SCOPE_ASSET_NOT_READY");
    expect(codes(scene.event)).toEqual([]);
  });

  it("fails the whole project and the scene that owns the planned image, so a final export is refused", async () => {
    const { root } = await makeProject({ plannedImageOn: "s3" });
    const whole = await scopedCheck(root);
    expect(whole.exitCode).toBe(1);
    expect(codes(whole.event)).toContain("ASSET_NOT_READY");
    const owner = await scopedCheck(root, "s3");
    expect(owner.exitCode).toBe(1);
    expect(codes(owner.event)).toContain("ASSET_NOT_READY");
    const refused = await run("render", root, "--approve-preview", "any-build");
    expect(refused.exitCode).toBe(1);
    expect(codes(refused.event)).toContain("ASSET_NOT_READY");
  });

  it("previews a later scene on a local timeline while an earlier block has no audio", async () => {
    const { root } = await makeProject({ plannedContext: true });
    expect(codes((await scopedCheck(root)).event)).toContain(
      "TIMELINE_INCOMPLETE",
    );
    const later = await scopedCheck(root, "s3");
    expect(later.exitCode, JSON.stringify(later.event.issues)).toBe(0);
    expect(later.event).toMatchObject({
      readiness: "ready",
      data: { stage: "production" },
    });
    expect(infoCodes(later.event)).toContain("OUT_OF_SCOPE_BLOCK_NOT_READY");
    const first = await scopedCheck(root, "s1");
    expect(first.exitCode).toBe(1);
    expect(codes(first.event)).toContain("SCENE_BLOCK_NOT_READY");
  });

  it("makes a production preview fail fast, without rendering, when the scope is not ready", async () => {
    const { root } = await makeProject({ plannedImageOn: "s3" });
    const blocked = await run("preview", root, "--scene", "s3");
    expect(blocked.exitCode).toBe(1);
    expect(blocked.event).toMatchObject({
      status: "failed",
      readiness: "not-ready",
      data: { stage: "production" },
    });
    expect(codes(blocked.event)).toContain("ASSET_NOT_READY");
  });

  it("rejects --scene at the plan stage and an unknown scene", async () => {
    const { root } = await makeProject();
    expect(
      (await run("validate", root, "--stage", "plan", "--scene", "s1"))
        .exitCode,
    ).toBe(3);
    const missing = await scopedCheck(root, "nope");
    expect(missing.exitCode).toBe(1);
    expect(codes(missing.event)).toContain("SCENE_NOT_FOUND");
  });
});
