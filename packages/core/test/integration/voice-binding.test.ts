import type { PlanSource } from "@naraframe/core";
import {
  AssetManifestSchema,
  checkVoiceBindings,
  compileDraft,
  narrationTextHash,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const CONTEXT_TEXT = "Krakatau memiliki sejarah. Erupsinya panjang.";

const bind = (
  source: PlanSource,
  assetId: string,
  generation: { textSha256: string; voiceStyleSignature?: string },
): PlanSource => ({
  ...source,
  assets: {
    ...source.assets,
    assets: source.assets.assets.map((asset) =>
      asset.id === assetId && asset.status === "ready" && asset.kind !== "png"
        ? { ...asset, generation }
        : asset,
    ),
  },
});

const bothBound = (source = narratedSource()): PlanSource =>
  bind(
    bind(source, "voice-context", {
      textSha256: narrationTextHash(CONTEXT_TEXT),
    }),
    "voice-mechanism",
    { textSha256: narrationTextHash("Tekanan magma meningkat.") },
  );

describe("checkVoiceBindings", () => {
  it("warns when a clip records no source text and offers the hash to bind", () => {
    const issues = checkVoiceBindings(narratedSource());
    const missing = issues.filter(
      (issue) => issue.code === "VOICE_BINDING_MISSING",
    );
    expect(missing).toHaveLength(2);
    expect(missing[0]).toMatchObject({
      severity: "warning",
      entityId: "context",
    });
    expect(missing[0]?.suggestion).toContain(narrationTextHash(CONTEXT_TEXT));
  });

  it("is clean when every clip is bound to its current text", () => {
    expect(checkVoiceBindings(bothBound())).toEqual([]);
  });

  it("errors with STALE_VOICE when the block text no longer matches the audio", () => {
    const source = bothBound();
    const blocks = source.narration?.blocks.map((block) =>
      block.id === "context"
        ? { ...block, text: "Teks yang sudah diubah." }
        : block,
    );
    const edited = {
      ...source,
      narration: { ...source.narration, blocks },
    } as PlanSource;
    const issues = checkVoiceBindings(edited);
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "STALE_VOICE",
        severity: "error",
        entityId: "context",
        path: "/blocks/0/text",
      }),
    );
    expect(issues.filter((issue) => issue.entityId === "mechanism")).toEqual(
      [],
    );
  });

  it("ignores whitespace-only edits", () => {
    expect(narrationTextHash("  Halo   dunia \n")).toBe(
      narrationTextHash("Halo dunia"),
    );
    expect(narrationTextHash("Halo dunia")).not.toBe(
      narrationTextHash("Halo dunia."),
    );
  });

  it("errors when the clip's voice style differs from the profile's", () => {
    const source = bind(bothBound(), "voice-context", {
      textSha256: narrationTextHash(CONTEXT_TEXT),
      voiceStyleSignature: "some-other-voice",
    });
    const issues = checkVoiceBindings(source);
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "VOICE_STYLE_MISMATCH",
        entityId: "context",
      }),
    );
  });

  it("accepts a matching voice style", () => {
    const source = bind(bothBound(), "voice-context", {
      textSha256: narrationTextHash(CONTEXT_TEXT),
      voiceStyleSignature: "probe",
    });
    expect(checkVoiceBindings(source)).toEqual([]);
  });

  it("accepts a replacement clip once it is bound to the new text", () => {
    const source = narratedSource({
      contextAsset: { id: "voice-context-v2", sha256: "c".repeat(64) },
    });
    const blocks = source.narration?.blocks.map((block) =>
      block.id === "context"
        ? { ...block, text: "Teks baru untuk klip baru." }
        : block,
    );
    const revised = bind(
      { ...source, narration: { ...source.narration, blocks } } as PlanSource,
      "voice-context-v2",
      { textSha256: narrationTextHash("Teks baru untuk klip baru.") },
    );
    expect(
      checkVoiceBindings(revised).filter((i) => i.severity === "error"),
    ).toEqual([]);
  });
});

describe("compileDraft with voice bindings", () => {
  it("refuses to compile a stale voice but only warns about an unbound one", () => {
    const unbound = compileDraft(narratedSource());
    expect(unbound.ok).toBe(true);
    if (unbound.ok) {
      expect(unbound.issues.map((i) => i.code)).toContain(
        "VOICE_BINDING_MISSING",
      );
    }

    const source = bothBound();
    const blocks = source.narration?.blocks.map((block) =>
      block.id === "mechanism"
        ? { ...block, text: "Tekanan magma menurun." }
        : block,
    );
    const stale = compileDraft({
      ...source,
      narration: { ...source.narration, blocks },
    } as PlanSource);
    expect(stale.ok).toBe(false);
    if (!stale.ok)
      expect(stale.issues.map((i) => i.code)).toContain("STALE_VOICE");
  });
});

describe("audio asset generation binding schema", () => {
  const asset = (extra: Record<string, unknown>) => ({
    id: "voice-x",
    status: "ready",
    kind: "mp3",
    path: "audio/x.mp3",
    sha256: "a".repeat(64),
    origin: { type: "generated" },
    ...extra,
  });
  const parse = (extra: Record<string, unknown>) =>
    AssetManifestSchema.safeParse({ schemaVersion: 1, assets: [asset(extra)] });

  it("accepts a well-formed binding and rejects a malformed hash or unknown field", () => {
    expect(parse({ generation: { textSha256: "b".repeat(64) } }).success).toBe(
      true,
    );
    expect(parse({ generation: { textSha256: "not-a-hash" } }).success).toBe(
      false,
    );
    expect(
      parse({ generation: { textSha256: "b".repeat(64), provider: "x" } })
        .success,
    ).toBe(false);
  });

  it("does not allow a png asset to claim a spoken-text binding", () => {
    const png = {
      id: "img",
      status: "ready",
      kind: "png",
      path: "assets/a.png",
      sha256: "a".repeat(64),
      origin: { type: "generated" },
      generation: { textSha256: "b".repeat(64) },
    };
    expect(
      AssetManifestSchema.safeParse({ schemaVersion: 1, assets: [png] })
        .success,
    ).toBe(false);
  });
});
