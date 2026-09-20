import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlanSource } from "@naraframe/core";
import {
  ApprovalSchema,
  checkProductionReadiness,
  compileDraft,
  narrationTextHash,
  readApprovals,
  recordApproval,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const codes = (issues: Array<{ code: string }>) =>
  issues.map((issue) => issue.code);

const bound = (source: PlanSource): PlanSource => ({
  ...source,
  assets: {
    ...source.assets,
    assets: source.assets.assets.map((asset) => {
      if (asset.status !== "ready" || asset.kind === "png") return asset;
      const text = source.narration?.blocks.find(
        (block) => "audioAssetId" in block && block.audioAssetId === asset.id,
      )?.text;
      return text
        ? { ...asset, generation: { textSha256: narrationTextHash(text) } }
        : asset;
    }),
  },
});

const readiness = (source: PlanSource) => {
  const final = compileDraft(source, { type: "project" }, { mode: "final" });
  if (!final.ok)
    throw new Error(`final compile failed: ${codes(final.issues)}`);
  return checkProductionReadiness(source, final.value, final.issues);
};

describe("compileDraft in final mode", () => {
  it("compiles at the design format with the FINAL label and no draft scaling", () => {
    const final = compileDraft(
      narratedSource(),
      { type: "project" },
      { mode: "final" },
    );
    const draft = compileDraft(narratedSource());
    expect(final.ok && draft.ok).toBe(true);
    if (!final.ok || !draft.ok) return;
    expect(final.value).toMatchObject({
      mode: "final",
      width: 1080,
      height: 1920,
      label: "FINAL",
    });
    expect(draft.value).toMatchObject({
      mode: "draft",
      width: 540,
      height: 960,
    });
    // Same timeline in frames, caption type at design size instead of half.
    expect(final.value.totalFrames).toBe(draft.value.totalFrames);
    expect(final.value.captions?.style.fontSize).toBe(44);
    expect(draft.value.captions?.style.fontSize).toBe(22);
    expect(final.value.assemblyKey).not.toBe(draft.value.assemblyKey);
  });

  it("refuses a scene-scoped final export", () => {
    const result = compileDraft(
      narratedSource(),
      { type: "scene", sceneId: "s1" },
      { mode: "final" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues[0]?.code).toBe("FINAL_REQUIRES_PROJECT_SCOPE");
  });

  it("keeps wav and m4a audio assets instead of mistaking them for images", () => {
    for (const kind of ["wav", "m4a"] as const) {
      const base = narratedSource();
      const source: PlanSource = {
        ...base,
        assets: {
          ...base.assets,
          assets: base.assets.assets.map((asset) =>
            asset.status === "ready" && asset.kind !== "png"
              ? {
                  ...asset,
                  kind,
                  path: asset.path.replace(/\.mp3$/, `.${kind}`),
                }
              : asset,
          ),
        },
      };
      const result = compileDraft(source);
      expect(
        result.ok,
        `${kind}: ${JSON.stringify(!result.ok && result.issues)}`,
      ).toBe(true);
      if (result.ok)
        expect(result.value.assets["voice-context"]?.kind).toBe(kind);
    }
  });
});

describe("checkProductionReadiness", () => {
  it("passes for narrated, bound audio with every used asset ready", () => {
    expect(readiness(bound(narratedSource()))).toEqual([]);
  });

  it("requires narration for a final export", () => {
    const { narration: _omit, ...silent } = narratedSource({
      scenes: [narratedScene("s1")],
    });
    expect(codes(readiness(silent as PlanSource))).toContain(
      "NARRATION_REQUIRED",
    );
  });

  it("turns a missing voice binding from a warning into an error", () => {
    const source = narratedSource();
    const draft = compileDraft(source);
    expect(
      draft.ok &&
        draft.issues.find((i) => i.code === "VOICE_BINDING_MISSING")?.severity,
    ).toBe("warning");
    const errors = readiness(source).filter(
      (issue) => issue.code === "VOICE_BINDING_MISSING",
    );
    expect(errors).toHaveLength(2);
    expect(errors.every((issue) => issue.severity === "error")).toBe(true);
  });

  it("rejects a planned asset that a scene still uses, but not one nothing uses", () => {
    const base = bound(narratedSource());
    const withPlanned: PlanSource = {
      ...base,
      assets: {
        ...base.assets,
        assets: [
          ...base.assets.assets,
          {
            id: "art",
            status: "planned",
            kind: "png",
            purpose: "Ilustrasi",
            intendedOrigin: "generated",
          },
        ],
      },
    };
    expect(readiness(withPlanned)).toEqual([]);

    const used: PlanSource = {
      ...withPlanned,
      scenes: {
        ...withPlanned.scenes,
        scenes: withPlanned.scenes.scenes.map((scene) =>
          scene.id === "s1"
            ? {
                ...scene,
                visual: { type: "media", assetId: "art", fit: "cover" },
              }
            : scene,
        ),
      },
    };
    const issues = readiness(used);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "ASSET_NOT_READY", entityId: "art" }),
    );
  });
});

describe("approvals", () => {
  const dirs: string[] = [];
  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });
  const base = {
    sourceRevision: "a".repeat(64),
    assemblyKey: "b".repeat(64),
    scope: { type: "project" as const },
    approvedAt: "2026-09-20T00:00:00.000Z",
  };

  it("requires exactly one of a reviewed preview or an explicit autonomy authorisation", () => {
    expect(
      ApprovalSchema.safeParse({
        ...base,
        previewBuildId: "p1",
        autonomy: null,
      }).success,
    ).toBe(true);
    expect(
      ApprovalSchema.safeParse({
        ...base,
        previewBuildId: null,
        autonomy: { authorizedBy: "fatih" },
      }).success,
    ).toBe(true);
    expect(
      ApprovalSchema.safeParse({
        ...base,
        previewBuildId: null,
        autonomy: null,
      }).success,
    ).toBe(false);
    expect(
      ApprovalSchema.safeParse({
        ...base,
        previewBuildId: "p1",
        autonomy: { authorizedBy: "fatih" },
      }).success,
    ).toBe(false);
  });

  it("appends approvals per source revision and never rewrites earlier ones", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-approval-"));
    dirs.push(root);
    expect(await readApprovals(root, base.sourceRevision)).toEqual([]);
    await recordApproval(root, {
      ...base,
      previewBuildId: "p1",
      autonomy: null,
    });
    await recordApproval(root, {
      ...base,
      previewBuildId: null,
      autonomy: { authorizedBy: "fatih", note: "owner said go" },
      approvedAt: "2026-09-20T01:00:00.000Z",
    });
    const log = await readApprovals(root, base.sourceRevision);
    expect(log.map((entry) => entry.previewBuildId)).toEqual(["p1", null]);
    expect(await readApprovals(root, "c".repeat(64))).toEqual([]);
  });

  it("rejects an invalid approval instead of writing it", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-approval-"));
    dirs.push(root);
    await expect(
      recordApproval(root, { ...base, previewBuildId: null, autonomy: null }),
    ).rejects.toThrow();
    expect(await readApprovals(root, base.sourceRevision)).toEqual([]);
  });
});
