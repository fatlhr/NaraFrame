import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlanSource, ProductionLedger } from "@naraframe/core";
import {
  computeReuse,
  editProject,
  generationKeyForBlock,
  loadPlanProject,
  requestReservation,
  settleReceipt,
  syncWorkingCopy,
  withProjectLock,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { audioAsset, narratedSource } from "./narrated-source.js";

const sha = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
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

const writeJson = (path: string, value: unknown) =>
  writeFile(path, JSON.stringify(value, null, 2));

/** Writes a narrated project whose audio files hash to what the manifest says. */
const writeProject = async (
  root: string,
  audio: { context: string; mechanism: string },
  overrides: Parameters<typeof narratedSource>[0] = {},
): Promise<PlanSource> => {
  const contextSha = sha(audio.context);
  const mechanismSha = sha(audio.mechanism);
  const base = narratedSource({
    ...overrides,
    contextAsset: { id: "voice-context", sha256: contextSha },
  });
  const source: PlanSource = {
    ...base,
    profile: {
      ...base.profile,
      direction: { text: "Probe direction.", sha256: sha("Probe direction.") },
    },
    assets: {
      ...base.assets,
      assets: [
        audioAsset("voice-context", contextSha),
        audioAsset("voice-mechanism", mechanismSha),
      ] as PlanSource["assets"]["assets"],
    },
  };
  await mkdir(join(root, "assets"), { recursive: true });
  await mkdir(join(root, "audio", "narration"), { recursive: true });
  await writeFile(
    join(root, "audio", "narration", `${contextSha}.mp3`),
    audio.context,
  );
  await writeFile(
    join(root, "audio", "narration", `${mechanismSha}.mp3`),
    audio.mechanism,
  );
  await writeJson(join(root, "naraframe.json"), source.project);
  await writeJson(join(root, "profile.lock.json"), source.profile);
  await writeJson(join(root, "scenes.json"), source.scenes);
  await writeJson(join(root, "assets", "manifest.json"), source.assets);
  await writeJson(join(root, "narration.json"), source.narration);
  return source;
};

const baseline = async (root: string): Promise<string> => {
  const result = await withProjectLock(root, () => syncWorkingCopy(root));
  if (!result.ok)
    throw new Error(
      `sync failed: ${result.issues.map((i) => `${i.code} ${i.message}`)}`,
    );
  return result.value.revisionId;
};

/** Replaces the context voice: new clip, new asset id, new text. */
const replaceContextVoice = async (
  root: string,
  expect: string,
  bytes: string,
) => {
  const newSha = sha(bytes);
  const next = narratedSource({
    contextAsset: { id: "voice-context-v2", sha256: newSha },
  });
  const stage = await tmp("naraframe-stage-");
  await mkdir(join(stage, "audio", "narration"), { recursive: true });
  await writeFile(join(stage, "audio", "narration", `${newSha}.mp3`), bytes);
  const current = (await loadPlanProject(root)).value?.source;
  const manifest = {
    ...current?.assets,
    assets: [
      ...(current?.assets.assets ?? []),
      audioAsset("voice-context-v2", newSha),
    ],
  };
  await mkdir(join(stage, "assets"), { recursive: true });
  await writeJson(join(stage, "assets", "manifest.json"), manifest);
  const blocks = next.narration?.blocks.map((block) =>
    block.id === "context"
      ? { ...block, text: "Kalimat pembuka yang baru. Dibaca ulang." }
      : block,
  );
  await writeJson(join(stage, "narration.json"), { ...next.narration, blocks });
  return editProject({
    root,
    from: stage,
    expect,
    summary: "Replace the context voice",
  });
};

const ledgerWith = (
  source: PlanSource,
  costs: Record<string, { amount: number; status?: "succeeded" | "unknown" }>,
): ProductionLedger => {
  let ledger: ProductionLedger = {
    schemaVersion: 1,
    budget: { amount: 100000, currency: "IDR" },
    receipts: [],
  };
  const auth = { grantedBy: "test", grantedAt: "2026-09-20T00:00:00.000Z" };
  for (const [blockId, cost] of Object.entries(costs)) {
    const block = source.narration?.blocks.find(
      (candidate) => candidate.id === blockId,
    );
    if (!block) throw new Error(`no block ${blockId}`);
    const reserved = requestReservation(ledger, {
      operationId: `op-${blockId}`,
      requestKey: generationKeyForBlock(source, block),
      operation: "tts.synthesize",
      provider: "test",
      authorization: auth,
      estimate: { amount: cost.amount, currency: "IDR" },
    });
    if (!reserved.ok) throw new Error("reserve failed");
    ledger = { ...ledger, receipts: [...ledger.receipts, reserved.value] };
    const settled = settleReceipt(
      ledger,
      `op-${blockId}`,
      cost.status === "unknown"
        ? { status: "unknown" }
        : {
            status: "succeeded",
            actual: { amount: cost.amount, currency: "IDR" },
          },
    );
    if (!settled.ok) throw new Error("settle failed");
    ledger = { ...ledger, receipts: [...ledger.receipts, settled.value] };
  }
  return ledger;
};

describe("computeReuse", () => {
  it("returns null for the baseline revision, which has nothing to compare against", async () => {
    const root = await tmp("naraframe-reuse-");
    await writeProject(root, { context: "voice A", mechanism: "voice B" });
    const result = await computeReuse(root, await baseline(root));
    expect(result).toMatchObject({ ok: true, value: null });
  });

  it("reports an unknown revision as an error", async () => {
    const root = await tmp("naraframe-reuse-");
    await writeProject(root, { context: "voice A", mechanism: "voice B" });
    await baseline(root);
    const result = await computeReuse(root, "f".repeat(64));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("REVISION_UNKNOWN");
  });

  it("measures what survived when one voice clip is replaced", async () => {
    const root = await tmp("naraframe-reuse-");
    await writeProject(root, { context: "voice A", mechanism: "voice B" });
    const base = await baseline(root);
    const edited = await replaceContextVoice(root, base, "voice A2");
    expect(edited.ok, JSON.stringify(!edited.ok && edited.issues)).toBe(true);
    if (!edited.ok) return;

    const reuse = await computeReuse(root, edited.value.revisionId);
    expect(reuse.ok).toBe(true);
    if (!reuse.ok || !reuse.value) return;
    expect(reuse.value.parentId).toBe(base);
    // Voice: the mechanism clip survived; the context clip was replaced.
    expect(reuse.value.voice).toMatchObject({
      total: 2,
      unchanged: 1,
      changed: 1,
      added: 0,
    });
    expect(reuse.value.voice.ratio).toBe(0.5);
    // Scenes: s1 and s2 belong to the replaced block; s3 (mechanism) survives even though it moved.
    expect(reuse.value.scenes).toMatchObject({
      total: 3,
      unchanged: 1,
      changed: 2,
    });
    expect(reuse.value.images).toMatchObject({ total: 0, ratio: null });
    expect(reuse.value.overallRatio).toBeCloseTo(2 / 5, 5);
  });

  it("compares cost against a full regeneration using only recorded receipts", async () => {
    const root = await tmp("naraframe-reuse-");
    await writeProject(root, {
      context: "voice A",
      mechanism: "voice B",
    });
    const base = await baseline(root);
    const edited = await replaceContextVoice(root, base, "voice A2");
    if (!edited.ok) throw new Error("edit failed");
    const revised = (await loadPlanProject(root)).value?.source;
    if (!revised) throw new Error("load failed");

    const ledger = ledgerWith(revised, {
      context: { amount: 40 },
      mechanism: { amount: 60 },
    });
    // Receipts are keyed by generation key, so the original context spend is not double counted.
    expect(ledger.receipts).toHaveLength(4);
    await writeJson(join(root, "production.json"), ledger);

    const reuse = await computeReuse(root, edited.value.revisionId);
    if (!reuse.ok || !reuse.value) throw new Error("no reuse");
    expect(reuse.value.cost).toMatchObject({
      currency: "IDR",
      revision: { actual: 40, blocks: 1, unknown: 0, untracked: 0 },
      fullRegeneration: { actual: 100, blocks: 2, unknown: 0, untracked: 0 },
      comparable: true,
      fractionOfFullRegeneration: 0.4,
    });
  });

  it("keeps unknown and untracked spend visible and refuses to invent a ratio", async () => {
    const root = await tmp("naraframe-reuse-");
    await writeProject(root, { context: "voice A", mechanism: "voice B" });
    const base = await baseline(root);
    const edited = await replaceContextVoice(root, base, "voice A2");
    if (!edited.ok) throw new Error("edit failed");
    const revised = (await loadPlanProject(root)).value?.source;
    if (!revised) throw new Error("load failed");

    // No production.json at all: nothing is tracked.
    const untracked = await computeReuse(root, edited.value.revisionId);
    if (!untracked.ok || !untracked.value) throw new Error("no reuse");
    expect(untracked.value.cost.comparable).toBe(false);
    expect(untracked.value.cost.fractionOfFullRegeneration).toBeNull();
    expect(untracked.value.cost.fullRegeneration).toMatchObject({
      untracked: 2,
      actual: 0,
    });
    expect(untracked.value.notes.join(" ")).toContain("No production.json");

    // A timed-out request stays unknown, and a block with no receipt stays untracked.
    await writeJson(
      join(root, "production.json"),
      ledgerWith(revised, { context: { amount: 40, status: "unknown" } }),
    );
    const partial = await computeReuse(root, edited.value.revisionId);
    if (!partial.ok || !partial.value) throw new Error("no reuse");
    expect(partial.value.cost.revision).toMatchObject({
      unknown: 1,
      untracked: 0,
      actual: 0,
    });
    expect(partial.value.cost.fullRegeneration).toMatchObject({
      unknown: 1,
      untracked: 1,
    });
    expect(partial.value.cost.comparable).toBe(false);
    expect(partial.value.cost.fractionOfFullRegeneration).toBeNull();
  });
});
