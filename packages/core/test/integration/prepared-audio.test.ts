import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  checkProductionReadiness,
  checkVoiceBindings,
  compileDraft,
  createProject,
  editProject,
  exportSchemas,
  generationKeyForBlock,
  inspectLibrary,
  loadPlanProject,
  NarrationSchema,
  narrationTextHash,
  PreparedTimingPackageSchema,
  preparedTimingHash,
  readApprovals,
  recordApproval,
  stageLibrary,
  stagePreparedAudio,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { hashValue } from "../../src/project/hash.js";
import { narratedSource } from "./narrated-source.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const temporary = async () => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-prepared-test-"));
  dirs.push(dir);
  return dir;
};
const writeJson = async (root: string, path: string, value: unknown) => {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), JSON.stringify(value));
};
const checked = <T>(
  r: { ok: true; value: T } | { ok: false; issues: unknown },
): T => {
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value;
};
const verifiedSource = () => {
  const source = narratedSource();
  if (!source.narration) throw new Error("fixture");
  source.assets.assets = source.assets.assets.map((a) => {
    const block = source.narration?.blocks.find(
      (b) => "audioAssetId" in b && b.audioAssetId === a.id,
    );
    return a.status === "ready" && a.kind === "mp3" && block
      ? { ...a, generation: { textSha256: narrationTextHash(block.text) } }
      : a;
  });
  const block = source.narration.blocks[0];
  if (!block || !("audioAssetId" in block)) throw new Error("fixture");
  block.prepared = {
    schemaVersion: 1,
    units: "milliseconds",
    audioSha256: "a".repeat(64),
    textSha256: narrationTextHash(block.text),
    timingSha256: preparedTimingHash(block),
    audioDurationMs: block.audioDurationMs,
    alignment: { method: "manual", source: "synthetic regression fixture" },
    uncertainties: [],
    verification: {
      state: "verified",
      method: "listening",
      reviewer: "Synthetic test reviewer",
      verifiedAt: "2026-10-14T00:00:00Z",
    },
  };
  return source;
};
describe("opt-in prepared receipts", () => {
  it("receipt-only authority edits preserve assembly and generation identity", () => {
    const source = verifiedSource();
    const before = checked(compileDraft(source));
    const block = source.narration?.blocks[0];
    if (!block || !("prepared" in block) || !block.prepared)
      throw new Error("fixture");
    const key = generationKeyForBlock(source, block);
    block.prepared.uncertainties.push(
      "Retained word metadata is not native motion.",
    );
    const after = checked(compileDraft(source));
    expect(after.assemblyKey).toBe(before.assemblyKey);
    expect(after.sourceRevision).not.toBe(before.sourceRevision);
    expect(generationKeyForBlock(source, block)).toBe(key);
    expect(checkVoiceBindings(source)).toEqual([]);
  });
  it.each(["text", "phrases", "words", "duration", "asset"])(
    "rejects stale %s bindings",
    (kind) => {
      const source = verifiedSource();
      const block = source.narration?.blocks[0];
      if (!block || !("phrases" in block)) throw new Error("fixture");
      if (kind === "text") block.text += " Changed.";
      if (kind === "phrases") {
        const phrase = block.phrases[0];
        if (phrase) phrase.endMs -= 1;
      }
      if (kind === "duration") block.audioDurationMs += 10;
      if (kind === "words") {
        const phrase = block.phrases[0];
        if (phrase)
          phrase.words = [
            {
              id: "w",
              text: "Krakatau",
              startMs: phrase.startMs,
              endMs: phrase.endMs,
            },
          ];
      }
      if (kind === "asset") {
        const asset = source.assets.assets.find(
          (a) => a.id === block.audioAssetId,
        );
        if (asset?.status === "ready") asset.sha256 = "b".repeat(64);
      }
      expect(
        checkVoiceBindings(source).some(
          (i) => i.code === "PREPARED_AUDIO_STALE" && i.severity === "error",
        ),
      ).toBe(true);
    },
  );
  it("trailing hold affects rendering but not reviewed speech timing or generation", () => {
    const source = verifiedSource(),
      before = checked(compileDraft(source));
    const block = source.narration?.blocks[0];
    if (!block || !("phrases" in block)) throw new Error("fixture");
    const timing = preparedTimingHash(block),
      key = generationKeyForBlock(source, block);
    block.pauseAfterMs += 1000;
    expect(preparedTimingHash(block)).toBe(timing);
    expect(checkVoiceBindings(source)).toEqual([]);
    expect(generationKeyForBlock(source, block)).toBe(key);
    expect(checked(compileDraft(source)).assemblyKey).not.toBe(
      before.assemblyKey,
    );
  });
  it("pending remains draft warning and blocks production without confirmed generation", () => {
    const source = verifiedSource();
    const block = source.narration?.blocks[0];
    if (!block || !("prepared" in block) || !block.prepared)
      throw new Error("fixture");
    block.prepared.verification = { state: "pending" };
    source.assets.assets = source.assets.assets.map((a) => {
      if (a.id !== block.audioAssetId || !("generation" in a)) return a;
      const { generation: _generation, ...rest } = a;
      return rest;
    });
    const compiled = compileDraft(source),
      draft = checked(compiled);
    expect(
      compiled.issues.some(
        (i) => i.code === "PREPARED_AUDIO_PENDING" && i.severity === "warning",
      ),
    ).toBe(true);
    expect(
      checkProductionReadiness(source, draft, compiled.issues).some(
        (i) => i.code === "PREPARED_AUDIO_PENDING" && i.severity === "error",
      ),
    ).toBe(true);
  });
  it("unrelated stale block does not block a scoped draft", () => {
    const source = verifiedSource();
    const block = source.narration?.blocks[0];
    if (block) block.text += " Changed.";
    const result = compileDraft(source, { type: "scene", sceneId: "s3" });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    expect(
      result.issues.some(
        (i) => i.code === "PREPARED_AUDIO_STALE" && i.severity === "warning",
      ),
    ).toBe(true);
  });
  it("pending review is scoped for production while unrelated blocks remain advisory", () => {
    const source = verifiedSource();
    const block = source.narration?.blocks[0];
    if (!block || !("prepared" in block) || !block.prepared)
      throw new Error("fixture");
    block.prepared.verification = { state: "pending" };
    source.assets.assets = source.assets.assets.map((a) => {
      if (a.id !== block.audioAssetId || !("generation" in a)) return a;
      const { generation: _generation, ...rest } = a;
      return rest;
    });
    for (const sceneId of ["s1", "s3"]) {
      const compiled = compileDraft(source, { type: "scene", sceneId });
      const issues = checkProductionReadiness(
        source,
        checked(compiled),
        compiled.issues,
        { sceneId, finalExport: false },
      );
      expect(
        issues.find((i) => i.code === "PREPARED_AUDIO_PENDING")?.severity,
      ).toBe(sceneId === "s1" ? "error" : "info");
    }
  });
  it("exports passive timing package and opt-in receipt in public schemas", () => {
    const schemas = exportSchemas();
    expect(schemas.PreparedTimingPackage).toBeDefined();
    expect(JSON.stringify(schemas.PreparedTimingPackage)).toContain(
      "milliseconds",
    );
    expect(JSON.stringify(schemas.Narration)).toContain("prepared");
  });
  it("rejects a pending confirmed generation binding and a verified missing binding", () => {
    const source = verifiedSource();
    const block = source.narration?.blocks[0];
    if (!block || !("prepared" in block) || !block.prepared)
      throw new Error("fixture");
    const attestation = block.prepared.verification;
    block.prepared.verification = { state: "pending" };
    expect(
      checkVoiceBindings(source).some(
        (i) =>
          i.code === "PREPARED_AUDIO_UNCONFIRMED_BINDING" &&
          i.severity === "error",
      ),
    ).toBe(true);
    block.prepared.verification = attestation;
    source.assets.assets = source.assets.assets.map((a) => {
      if (a.id !== block.audioAssetId || !("generation" in a)) return a;
      const { generation: _generation, ...rest } = a;
      return rest;
    });
    expect(
      checkVoiceBindings(source).some(
        (i) =>
          i.code === "PREPARED_AUDIO_BINDING_MISSING" && i.severity === "error",
      ),
    ).toBe(true);
  });
  it("preserves unknown style and warns on known mismatch without substituting profile style", () => {
    const source = verifiedSource();
    expect(
      checkVoiceBindings(source).some((i) => i.code === "VOICE_STYLE_MISMATCH"),
    ).toBe(false);
    const block = source.narration?.blocks[0];
    if (!block || !("audioAssetId" in block)) throw new Error("fixture");
    source.assets.assets = source.assets.assets.map((a) =>
      a.id === block.audioAssetId && a.status === "ready" && a.kind === "mp3"
        ? {
            ...a,
            generation: {
              textSha256: narrationTextHash(block.text),
              voiceStyleSignature: "known-different-style",
            },
          }
        : a,
    );
    expect(
      checkVoiceBindings(source).some(
        (i) => i.code === "VOICE_STYLE_MISMATCH" && i.severity === "warning",
      ),
    ).toBe(true);
    const compiled = compileDraft(source);
    expect(
      checkProductionReadiness(source, checked(compiled), compiled.issues).some(
        (i) => i.code === "VOICE_STYLE_MISMATCH" && i.severity === "error",
      ),
    ).toBe(true);
    const asset = source.assets.assets.find((a) => a.id === block.audioAssetId);
    expect(
      asset && "generation" in asset
        ? asset.generation?.voiceStyleSignature
        : undefined,
    ).toBe("known-different-style");
  });
  it("validates words only for opt-in and rejects unverified attestation or wrong units", () => {
    const source = verifiedSource();
    const narration = source.narration;
    const block = narration?.blocks[0];
    if (!block || !("phrases" in block) || !narration)
      throw new Error("fixture");
    const phrase = block.phrases[0];
    if (!phrase) throw new Error("fixture");
    phrase.words = [
      {
        id: "bad",
        text: "bad",
        startMs: phrase.startMs,
        endMs: phrase.endMs + 1,
      },
    ];
    expect(NarrationSchema.safeParse(narration).success).toBe(false);
    delete block.prepared;
    expect(NarrationSchema.safeParse(narration).success).toBe(true);
    const p = {
      schemaVersion: 1,
      units: "seconds",
      audioSha256: "a".repeat(64),
      text: "test",
      phrases: [{ id: "p", text: "test", startMs: 0, endMs: 1 }],
      pauseAfterMs: 0,
      alignment: { method: "manual", source: "test" },
      uncertainties: [],
      verification: { state: "verified" },
    };
    expect(PreparedTimingPackageSchema.safeParse(p).success).toBe(false);
    expect(
      PreparedTimingPackageSchema.safeParse({ ...p, units: "milliseconds" })
        .success,
    ).toBe(false);
  });
});

// Captured synthetic PCM fixture, never owner listening evidence.
const wav = () => {
  const pcm = Buffer.alloc(16000),
    bytes = Buffer.alloc(44 + pcm.length);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24);
  bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(pcm.length, 40);
  pcm.copy(bytes, 44);
  return bytes;
};
const setup = async () => {
  const parent = await temporary(),
    root = join(parent, "project"),
    from = join(parent, "clip.wav"),
    timingPath = join(parent, "timing.json");
  checked(
    await createProject({
      destination: root,
      projectId: "prepared",
      title: "Prepared",
      profileDirectory: resolve("profiles/current-issues"),
      profileSource: {
        kind: "repository",
        identity: "profiles/current-issues",
      },
    }),
  );
  const bytes = wav(),
    audioSha256 = createHash("sha256").update(bytes).digest("hex");
  await writeFile(from, bytes);
  const narration = {
    schemaVersion: 1,
    order: ["speech"],
    blocks: [{ id: "speech", text: "Synthetic speech." }],
  };
  await writeJson(root, "narration.json", narration);
  const timing = {
    schemaVersion: 1,
    units: "milliseconds",
    audioSha256,
    text: "Synthetic speech.",
    phrases: [{ id: "p", text: "Synthetic speech.", startMs: 0, endMs: 1000 }],
    pauseAfterMs: 300,
    alignment: { method: "manual", source: "Synthetic fixture" },
    uncertainties: [],
    verification: { state: "pending" },
  };
  await writeJson(parent, "timing.json", timing);
  return { parent, root, from, timingPath, timing, bytes };
};
describe("captured public preparation support", () => {
  it("stages captured bytes and package when caller files mutate during the injected probe", async () => {
    const s = await setup(),
      probe = join(s.parent, "probe.sh");
    await writeFile(
      probe,
      `#!/bin/sh\nprintf mutated > '${s.from}'\nprintf '{}' > '${s.timingPath}'\nprintf '%s' '{"format":{"duration":"1.000"},"streams":[{"codec_type":"audio"}]}'\n`,
      { mode: 0o755 },
    );
    const staged = checked(
      await stagePreparedAudio({
        root: s.root,
        from: s.from,
        timing: s.timingPath,
        block: "speech",
        ffprobePath: probe,
      }),
    );
    dirs.push(staged.staging);
    expect((await readFile(s.from)).toString()).toBe("mutated");
    expect(
      await readFile(
        join(
          staged.staging,
          staged.files.find((p) => p.endsWith(".wav")) ?? "missing",
        ),
      ),
    ).toEqual(s.bytes);
    const narration = JSON.parse(
      await readFile(join(staged.staging, "narration.json"), "utf8"),
    );
    expect(narration.blocks[0].text).toBe(s.timing.text);
    expect(narration.blocks[0].prepared.audioSha256).toBe(s.timing.audioSha256);
  });
  it("captures unchanged bytes, does not mutate project, allows pending→reviewed scoped replacement and undo", async () => {
    const s = await setup();
    const original = await readFile(join(s.root, "narration.json"));
    const staged = checked(
      await stagePreparedAudio({
        root: s.root,
        from: s.from,
        timing: s.timingPath,
        block: "speech",
      }),
    );
    dirs.push(staged.staging);
    expect(await readFile(join(s.root, "narration.json"))).toEqual(original);
    expect(staged.audioDurationMs).toBe(1000);
    expect(
      await readFile(
        join(
          staged.staging,
          staged.files.find((p) => p.endsWith(".wav")) ?? "missing",
        ),
      ),
    ).toEqual(s.bytes);
    checked(
      await editProject({
        root: s.root,
        from: staged.staging,
        expect: staged.sourceRevision,
        summary: "Synthetic pending import",
      }),
    );
    const loaded = checked(await loadPlanProject(s.root));
    const syntheticApproval = {
      sourceRevision: staged.sourceRevision,
      assemblyKey: "a".repeat(64),
      scope: { type: "project" as const },
      previewBuildId: "synthetic-test-preview",
      autonomy: null,
      approvedAt: "2026-10-14T00:00:00Z",
    };
    await recordApproval(s.root, {
      ...syntheticApproval,
      sourceRevision: hashValue(loaded.source),
    });
    const asset = loaded.source.assets.assets.find((a) =>
      a.id.startsWith("prepared-"),
    );
    expect(
      asset && "generation" in asset ? asset.generation : undefined,
    ).toBeUndefined();
    await writeJson(s.parent, "timing.json", {
      ...s.timing,
      verification: {
        state: "verified",
        method: "listening",
        reviewer: "Synthetic reviewer",
        verifiedAt: "2026-10-14T00:00:00Z",
      },
    });
    const reviewed = checked(
      await stagePreparedAudio({
        root: s.root,
        from: s.from,
        timing: s.timingPath,
        block: "speech",
      }),
    );
    dirs.push(reviewed.staging);
    checked(
      await editProject({
        root: s.root,
        from: reviewed.staging,
        expect: reviewed.sourceRevision,
        summary: "Synthetic listening receipt",
      }),
    );
    const final = checked(await loadPlanProject(s.root));
    expect(await readApprovals(s.root, hashValue(final.source))).toEqual([]);
    const bound = final.source.assets.assets.find((a) =>
      a.id.startsWith("prepared-"),
    );
    expect(
      bound && "generation" in bound ? bound.generation : undefined,
    ).toEqual({ textSha256: narrationTextHash(s.timing.text) });
    checked(await undoProject({ root: s.root }));
    expect(
      await readApprovals(
        s.root,
        hashValue(checked(await loadPlanProject(s.root)).source),
      ),
    ).toHaveLength(1);
    expect(
      checked(await loadPlanProject(s.root)).source.narration?.blocks[0],
    ).toMatchObject({ prepared: { verification: { state: "pending" } } });
  });
  it.each(["hash", "text", "bounds", "words", "format", "mode"])(
    "refuses invalid %s without project mutation",
    async (kind) => {
      const s = await setup(),
        before = await readFile(join(s.root, "narration.json"));
      const timing: Record<string, unknown> = { ...s.timing };
      if (kind === "hash") timing.audioSha256 = "a".repeat(64);
      if (kind === "text") timing.text = "Other speech.";
      if (kind === "bounds")
        timing.phrases = [
          { id: "p", text: s.timing.text, startMs: 0, endMs: 1001 },
        ];
      if (kind === "words")
        timing.phrases = [
          {
            id: "p",
            text: s.timing.text,
            startMs: 0,
            endMs: 1000,
            words: [{ id: "w", text: "bad", startMs: 900, endMs: 1100 }],
          },
        ];
      if (kind === "mode") {
        const p = JSON.parse(
          await readFile(join(s.root, "naraframe.json"), "utf8"),
        );
        await writeJson(s.root, "naraframe.json", {
          ...p,
          audioMode: "silent",
        });
      }
      await writeJson(s.parent, "timing.json", timing);
      const r = await stagePreparedAudio({
        root: s.root,
        from: kind === "format" ? `${s.from}.ogg` : s.from,
        timing: s.timingPath,
        block: "speech",
      });
      expect(r.ok, kind).toBe(false);
      expect(await readFile(join(s.root, "narration.json"))).toEqual(before);
    },
  );
  it("pins the same series twice and records complete scalar overrides", async () => {
    const catalog = checked(
      await inspectLibrary(resolve("library/series/study-notes/catalog.json")),
    );
    expect(catalog.catalog.id).toBe("study-notes");
    const params = JSON.parse(
      await readFile(
        resolve("library/series/study-notes/episode.json"),
        "utf8",
      ),
    );
    for (let i = 0; i < 2; i++) {
      const s = await setup();
      await writeJson(s.root, "narration.json", {
        schemaVersion: 1,
        order: ["question"],
        blocks: [{ id: "question", text: "Synthetic speech." }],
      });
      const imported = checked(
        await stageLibrary({
          root: s.root,
          from: resolve("library/series/study-notes/catalog.json"),
          pattern: "identity",
          version: "1.0.0",
          instance: "series",
          scene: "identity",
          params,
        }),
      );
      dirs.push(imported.staging);
      checked(
        await editProject({
          root: s.root,
          from: imported.staging,
          expect: imported.sourceRevision,
          summary: "Series import",
        }),
      );
      const override = {
        ...params,
        "intro-opacity": 0,
        "signoff-copy": "Custom ending",
        "duration-ms": 7251,
        rundown: `0${i + 1} / explicit`,
      };
      const updated = checked(
        await stageLibrary({
          root: s.root,
          instance: "series",
          params: override,
        }),
      );
      dirs.push(updated.staging);
      expect(updated.receipt.values).toEqual(override);
      expect(updated.receipt.catalog.sha256).toBe(
        imported.receipt.catalog.sha256,
      );
      checked(
        await editProject({
          root: s.root,
          from: updated.staging,
          expect: updated.sourceRevision,
          summary: "Series override",
        }),
      );
      checked(await undoProject({ root: s.root }));
      expect(
        checked(await loadPlanProject(s.root)).source.project
          .libraryImports?.[0]?.values,
      ).toEqual(params);
    }
  });
});
