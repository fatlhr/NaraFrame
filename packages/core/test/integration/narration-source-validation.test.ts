import { AssetManifestSchema, validatePlanSource } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import {
  audioAsset,
  narratedScene,
  narratedSource,
} from "./narrated-source.js";

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

describe("validatePlanSource with narration", () => {
  it("accepts a consistent narrated project", () => {
    const result = validatePlanSource(narratedSource());
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.narration?.order).toEqual(["context", "mechanism"]);
  });

  it("accepts a project with no narration at all", () => {
    const { narration: _omit, ...withoutNarration } = narratedSource({
      scenes: [narratedScene("s1")],
    });
    const result = validatePlanSource(withoutNarration);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.narration).toBeUndefined();
  });

  it("rejects a block whose audio asset is not in the manifest", () => {
    const source = narratedSource();
    const result = validatePlanSource({
      ...source,
      assets: {
        ...source.assets,
        assets: source.assets.assets.filter((a) => a.id !== "voice-context"),
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const issue = result.issues.find((i) => i.code === "ASSET_UNDECLARED");
    expect(issue).toMatchObject({
      artifact: "narration.json",
      path: "/blocks/0/audioAssetId",
    });
  });

  it("rejects a scene that names an unknown block or phrase", () => {
    const badBlock = validatePlanSource(
      narratedSource({ scenes: [narratedScene("s1", { blockId: "ghost" })] }),
    );
    expect(badBlock.ok).toBe(false);
    if (!badBlock.ok)
      expect(codes(badBlock.issues)).toContain("NARRATION_BLOCK_UNKNOWN");

    const badPhrase = validatePlanSource(
      narratedSource({
        scenes: [narratedScene("s1", { blockId: "context", phraseId: "zz" })],
      }),
    );
    expect(badPhrase.ok).toBe(false);
    if (!badPhrase.ok)
      expect(codes(badPhrase.issues)).toContain("NARRATION_PHRASE_UNKNOWN");
  });

  it("reports schema problems in narration.json under that artifact", () => {
    const source = narratedSource();
    const result = validatePlanSource({
      ...source,
      narration: { ...source.narration, order: ["context"] },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.artifact === "narration.json")).toBe(
      true,
    );
  });
});

describe("AssetManifestSchema audio assets", () => {
  const manifest = (assets: unknown[]) =>
    AssetManifestSchema.safeParse({ schemaVersion: 1, assets });

  it("accepts ready and planned mp3/wav/m4a assets", () => {
    expect(manifest([audioAsset("v1", "a".repeat(64))]).success).toBe(true);
    expect(
      manifest([
        {
          id: "v2",
          status: "planned",
          kind: "wav",
          purpose: "later",
          intendedOrigin: "generated",
        },
      ]).success,
    ).toBe(true);
  });

  it("rejects an audio asset whose path has the wrong extension or escapes the project", () => {
    const base = audioAsset("v1", "a".repeat(64));
    expect(manifest([{ ...base, path: "audio/narration/x.png" }]).success).toBe(
      false,
    );
    expect(manifest([{ ...base, path: "../outside.mp3" }]).success).toBe(false);
  });

  it("rejects a png asset pointing at an audio file", () => {
    const base = audioAsset("v1", "a".repeat(64));
    expect(manifest([{ ...base, kind: "png" }]).success).toBe(false);
  });

  it("rejects duplicate asset ids across kinds", () => {
    const a = audioAsset("same", "a".repeat(64));
    expect(
      manifest([a, { ...a, kind: "wav", path: "audio/x.wav" }]).success,
    ).toBe(false);
  });
});
