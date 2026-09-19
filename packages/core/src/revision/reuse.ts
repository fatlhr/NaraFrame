import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compileDraft } from "../compiler/compile-draft.js";
import {
  computeSceneRenderKeys,
  generationKeyForBlock,
} from "../compiler/keys.js";
import { loadPlanProject } from "../io/load-project.js";
import type { Result } from "../model/issue.js";
import { latestReceiptsByOperation } from "../production/ledger.js";
import { readProductionLedger } from "../production/ledger-io.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { ProductionLedger } from "../schema/production.js";
import { materializeRevision } from "./materialize.js";
import { issueFor, readRevisionMeta } from "./store.js";

export interface ReuseCounts {
  total: number;
  unchanged: number;
  changed: number;
  added: number;
  removed: number;
  /** unchanged / total, or null when the revision has none of this kind. */
  ratio: number | null;
}

export interface CostSide {
  /** Recorded actual spend for the blocks counted here. */
  actual: number;
  blocks: number;
  /** Receipt exists but its actual cost is not known. */
  unknown: number;
  /** No receipt at all (prepared or imported audio): cost is not tracked. */
  untracked: number;
}

export interface ReuseReport {
  revisionId: string;
  parentId: string;
  voice: ReuseCounts;
  images: ReuseCounts;
  scenes: ReuseCounts | null;
  overallRatio: number | null;
  cost: {
    currency: string | null;
    revision: CostSide;
    fullRegeneration: CostSide;
    /** True only when every block's cost is a recorded actual. */
    comparable: boolean;
    /** revision.actual / fullRegeneration.actual, only when comparable. */
    fractionOfFullRegeneration: number | null;
  };
  notes: string[];
}

const counts = (
  current: ReadonlyMap<string, string>,
  parent: ReadonlyMap<string, string>,
): ReuseCounts => {
  let unchanged = 0;
  let changed = 0;
  let added = 0;
  for (const [id, hash] of current) {
    const before = parent.get(id);
    if (before === undefined) added += 1;
    else if (before === hash) unchanged += 1;
    else changed += 1;
  }
  const removed = [...parent.keys()].filter((id) => !current.has(id)).length;
  return {
    total: current.size,
    unchanged,
    changed,
    added,
    removed,
    ratio: current.size === 0 ? null : unchanged / current.size,
  };
};

const voiceAssets = (source: PlanSource): Map<string, string> => {
  const shaById = new Map(
    source.assets.assets.flatMap((asset) =>
      asset.status === "ready" ? [[asset.id, asset.sha256] as const] : [],
    ),
  );
  const result = new Map<string, string>();
  for (const block of source.narration?.blocks ?? []) {
    if (!("audioAssetId" in block)) continue;
    const sha = shaById.get(block.audioAssetId);
    if (sha) result.set(block.id, sha);
  }
  return result;
};

const imageAssets = (source: PlanSource): Map<string, string> =>
  new Map(
    source.assets.assets.flatMap((asset) =>
      asset.status === "ready" && asset.kind === "png"
        ? [[asset.id, asset.sha256] as const]
        : [],
    ),
  );

const costOf = (
  blockIds: readonly string[],
  source: PlanSource,
  ledger: ProductionLedger | null,
): CostSide => {
  const latest = ledger ? latestReceiptsByOperation(ledger.receipts) : [];
  const side: CostSide = { actual: 0, blocks: 0, unknown: 0, untracked: 0 };
  for (const id of blockIds) {
    const block = source.narration?.blocks.find(
      (candidate) => candidate.id === id,
    );
    if (!block) continue;
    side.blocks += 1;
    const key = generationKeyForBlock(source, block);
    const receipts = latest.filter((receipt) => receipt.requestKey === key);
    const succeeded = receipts.find(
      (receipt) => receipt.status === "succeeded",
    );
    if (succeeded?.actual) side.actual += succeeded.actual.amount;
    else if (receipts.some((receipt) => receipt.status === "unknown"))
      side.unknown += 1;
    else side.untracked += 1;
  }
  return side;
};

const sceneKeys = (source: PlanSource): Map<string, string> | null => {
  const compiled = compileDraft(source);
  if (!compiled.ok) return null;
  return new Map(
    computeSceneRenderKeys(compiled.value).map((entry) => [
      entry.sceneId,
      entry.key,
    ]),
  );
};

/**
 * How much of a revision survived from its parent, measured from artifact
 * hashes and scene render keys, and what the revision cost against a full
 * regeneration, measured from receipts. Nothing is estimated: where a cost is
 * not recorded it is reported as unknown or untracked.
 */
export const computeReuse = async (
  rootPath: string,
  revisionId: string,
): Promise<Result<ReuseReport | null>> => {
  const root = resolve(rootPath);
  const meta = await readRevisionMeta(root, revisionId);
  if (!meta) {
    return {
      ok: false,
      issues: [
        issueFor(
          "REVISION_UNKNOWN",
          `Revision ${revisionId} is not in the history.`,
          "Use a revision id reported by status.",
        ),
      ],
    };
  }
  if (meta.parentId === null) return { ok: true, value: null, issues: [] };

  const work = join(root, ".naraframe", "attempts", `reuse-${randomUUID()}`);
  try {
    const dirs = {
      current: join(work, "current"),
      parent: join(work, "parent"),
    };
    await mkdir(work, { recursive: true });
    if (
      !(await materializeRevision(root, revisionId, dirs.current)) ||
      !(await materializeRevision(root, meta.parentId, dirs.parent))
    ) {
      return {
        ok: false,
        issues: [
          issueFor(
            "REVISION_CORRUPT",
            "A revision in this comparison is missing from the history.",
            "Restore the revisions folder from a backup.",
          ),
        ],
      };
    }
    const [current, parent] = await Promise.all([
      loadPlanProject(dirs.current),
      loadPlanProject(dirs.parent),
    ]);
    if (!current.ok || !parent.ok) {
      return {
        ok: false,
        issues: [
          issueFor(
            "REVISION_CORRUPT",
            "A stored revision no longer validates.",
            "Restore the revisions folder from a backup.",
          ),
        ],
      };
    }

    const notes: string[] = [];
    const voice = counts(
      voiceAssets(current.value.source),
      voiceAssets(parent.value.source),
    );
    const images = counts(
      imageAssets(current.value.source),
      imageAssets(parent.value.source),
    );
    const currentScenes = sceneKeys(current.value.source);
    const parentScenes = sceneKeys(parent.value.source);
    const scenes =
      currentScenes && parentScenes
        ? counts(currentScenes, parentScenes)
        : null;
    if (!scenes)
      notes.push(
        "Scene reuse is not available because one revision does not compile.",
      );

    const ledgerResult = await readProductionLedger(root);
    const ledger = ledgerResult.ok ? ledgerResult.value : null;
    if (!ledgerResult.ok)
      notes.push("production.json could not be read, so costs are untracked.");
    if (!ledger)
      notes.push("No production.json: voice and image spend is untracked.");

    const changedIds = [...voiceAssets(current.value.source)].flatMap(
      ([id, sha]) =>
        voiceAssets(parent.value.source).get(id) === sha ? [] : [id],
    );
    const revision = costOf(changedIds, current.value.source, ledger);
    const fullRegeneration = costOf(
      [...voiceAssets(current.value.source).keys()],
      current.value.source,
      ledger,
    );
    const comparable =
      ledger !== null &&
      fullRegeneration.unknown === 0 &&
      fullRegeneration.untracked === 0 &&
      fullRegeneration.blocks > 0;
    const all = [voice, images, ...(scenes ? [scenes] : [])];
    const total = all.reduce((sum, item) => sum + item.total, 0);
    const unchanged = all.reduce((sum, item) => sum + item.unchanged, 0);

    return {
      ok: true,
      value: {
        revisionId,
        parentId: meta.parentId,
        voice,
        images,
        scenes,
        overallRatio: total === 0 ? null : unchanged / total,
        cost: {
          currency: ledger?.budget.currency ?? null,
          revision,
          fullRegeneration,
          comparable,
          fractionOfFullRegeneration:
            comparable && fullRegeneration.actual > 0
              ? revision.actual / fullRegeneration.actual
              : null,
        },
        notes,
      },
      issues: [],
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
};
