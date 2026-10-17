import { resolve } from "node:path";
import type { Result } from "../model/issue.js";
import type { RevisionMeta } from "./schema.js";
import { issueFor, readCurrentRevisionId, readRevisionMeta } from "./store.js";

export interface HistoryEntry {
  id: string;
  parentId: string | null;
  kind: RevisionMeta["kind"];
  summary: string;
  createdAt: string;
  /** True for the revision the project is on now (what `undo` leaves). */
  current: boolean;
}

export interface HistoryReport {
  currentId: string;
  /** Length of the whole chain, even when `entries` was cut by `limit`. */
  total: number;
  /** The current revision first, then each parent, newest to oldest. */
  entries: HistoryEntry[];
}

/**
 * The accepted revisions behind the project, from the current one backwards
 * along parent links. Read-only: it takes no lock, never captures the working
 * copy and never writes, so direct edits not yet captured are not listed, and
 * a revision `undo` stepped away from is not on the chain.
 */
export const readRevisionHistory = async (options: {
  root: string;
  limit?: number;
}): Promise<Result<HistoryReport>> => {
  const root = resolve(options.root);
  const currentId = await readCurrentRevisionId(root);
  if (!currentId) {
    return {
      ok: false,
      issues: [
        issueFor(
          "REVISION_HISTORY_MISSING",
          `${root} has no revision history.`,
          "Point history at a NaraFrame project folder. A project's history starts with its first preview or edit.",
        ),
      ],
    };
  }
  const entries: HistoryEntry[] = [];
  const seen = new Set<string>();
  let total = 0;
  let nextId: string | null = currentId;
  while (nextId !== null) {
    if (seen.has(nextId)) break;
    seen.add(nextId);
    const meta: RevisionMeta | null = await readRevisionMeta(root, nextId);
    if (!meta) {
      return {
        ok: false,
        issues: [
          issueFor(
            "REVISION_CORRUPT",
            `Revision ${nextId} is missing from the history.`,
            "Restore the revisions folder from a backup.",
          ),
        ],
      };
    }
    total += 1;
    if (options.limit === undefined || entries.length < options.limit) {
      entries.push({
        id: meta.id,
        parentId: meta.parentId,
        kind: meta.kind,
        summary: meta.summary,
        createdAt: meta.createdAt,
        current: meta.id === currentId,
      });
    }
    nextId = meta.parentId;
  }
  return { ok: true, value: { currentId, total, entries }, issues: [] };
};
