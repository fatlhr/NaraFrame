import { join } from "node:path";
import { loadPlanProject } from "../io/load-project.js";
import type { Issue, Result } from "../model/issue.js";
import { hashValue } from "../project/hash.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { RevisionMeta } from "./schema.js";
import {
  absolute,
  issueFor,
  pathExists,
  readCurrentRevisionId,
  readRevisionMeta,
  SOURCE_FILES,
  storeObject,
  writeCurrentRevision,
  writeRevisionMeta,
} from "./store.js";

export type SyncStatus = "baseline" | "clean" | "captured" | "switched";

export interface SyncResult {
  status: SyncStatus;
  revisionId: string;
}

/** Media a snapshot must keep: ready assets and profile assets by path. */
const mediaPaths = (source: PlanSource): string[] => [
  ...source.assets.assets.flatMap((asset) =>
    asset.status === "ready" ? [asset.path] : [],
  ),
  ...source.profile.assets.map((asset) => asset.path),
];

/**
 * Writes an immutable snapshot of the project view at `viewRoot` (already
 * validated as `source`). Idempotent: identical source yields the same id.
 */
export const writeSnapshot = async (options: {
  storeRoot: string;
  viewRoot: string;
  source: PlanSource;
  parentId: string | null;
  summary: string;
  kind: RevisionMeta["kind"];
  now?: () => string;
}): Promise<{ id: string; created: boolean }> => {
  const id = hashValue(options.source);
  if (await readRevisionMeta(options.storeRoot, id)) {
    return { id, created: false };
  }

  const sources: RevisionMeta["sources"] = [];
  for (const path of SOURCE_FILES) {
    const file = absolute(options.viewRoot, path);
    if (await pathExists(file)) {
      sources.push({
        path,
        sha256: await storeObject(options.storeRoot, file),
      });
    }
  }
  const media: RevisionMeta["media"] = [];
  for (const path of [...new Set(mediaPaths(options.source))].sort()) {
    media.push({
      path,
      sha256: await storeObject(
        options.storeRoot,
        absolute(options.viewRoot, path),
      ),
    });
  }

  await writeRevisionMeta(options.storeRoot, {
    schemaVersion: 1,
    id,
    parentId: options.parentId,
    summary: options.summary,
    kind: options.kind,
    createdAt: (options.now ?? (() => new Date().toISOString()))(),
    sources,
    media,
  });
  return { id, created: true };
};

/**
 * Brings revision history in line with the working copy. Valid manual edits
 * are captured; an invalid working copy is reported and left untouched, so a
 * stale snapshot is never treated as if the edit had succeeded.
 * Callers must hold the project lock.
 */
export const syncWorkingCopy = async (
  root: string,
  now?: () => string,
): Promise<Result<SyncResult>> => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) {
    const issues: Issue[] = [
      issueFor(
        "WORKING_COPY_INVALID",
        "The working copy does not validate, so it was not captured as a revision.",
        "Fix the reported source problems; the last accepted revision is unchanged.",
      ),
      ...loaded.issues,
    ];
    return { ok: false, issues };
  }

  const id = hashValue(loaded.value.source);
  const current = await readCurrentRevisionId(root);

  if (current === null) {
    await writeSnapshot({
      storeRoot: root,
      viewRoot: root,
      source: loaded.value.source,
      parentId: null,
      summary: "Baseline of the existing project",
      kind: "baseline",
      ...(now ? { now } : {}),
    });
    await writeCurrentRevision(root, id);
    return {
      ok: true,
      value: { status: "baseline", revisionId: id },
      issues: [],
    };
  }
  if (current === id) {
    return { ok: true, value: { status: "clean", revisionId: id }, issues: [] };
  }
  if (await readRevisionMeta(root, id)) {
    await writeCurrentRevision(root, id);
    return {
      ok: true,
      value: { status: "switched", revisionId: id },
      issues: [],
    };
  }

  await writeSnapshot({
    storeRoot: root,
    viewRoot: root,
    source: loaded.value.source,
    parentId: current,
    summary: "Captured direct edits to the working copy",
    kind: "manual-capture",
    ...(now ? { now } : {}),
  });
  await writeCurrentRevision(root, id);
  return {
    ok: true,
    value: { status: "captured", revisionId: id },
    issues: [],
  };
};

export const revisionDirectory = (root: string, id: string): string =>
  join(root, "revisions", id);
