import { lstat, readdir, readFile, realpath, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface CacheEntry {
  path: string;
  bytes: number;
  reason: string;
}

export interface CacheCleanResult {
  dryRun: boolean;
  removed: CacheEntry[];
  /** Preview builds that were kept, with the reason each one is retained. */
  keptBuilds: Array<{ buildId: string; reason: string }>;
  reclaimedBytes: number;
}

const sizeOf = async (path: string): Promise<number> => {
  const details = await lstat(path);
  if (!details.isDirectory()) return details.size;
  let total = 0;
  for (const name of await readdir(path))
    total += await sizeOf(join(path, name));
  return total;
};

const readJson = async (path: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
};

const jsonFiles = async (directory: string): Promise<string[]> => {
  try {
    return (await readdir(directory))
      .filter((name) => name.endsWith(".json"))
      .map((name) => join(directory, name));
  } catch {
    return [];
  }
};

/** Builds that must survive: the current pointer, selections, and approvals. */
const retainedBuilds = async (root: string): Promise<Map<string, string>> => {
  const kept = new Map<string, string>();
  const pointer = (await readJson(join(root, "preview", "current.json"))) as {
    buildId?: string;
  } | null;
  if (pointer?.buildId) kept.set(pointer.buildId, "current preview");

  for (const file of await jsonFiles(join(root, "revisions", "selection"))) {
    const selection = (await readJson(file)) as { buildId?: string } | null;
    if (selection?.buildId) {
      kept.set(selection.buildId, "selected for a revision");
    }
  }
  for (const file of await jsonFiles(join(root, "revisions", "approvals"))) {
    const log = (await readJson(file)) as {
      approvals?: Array<{ previewBuildId?: string | null }>;
    } | null;
    for (const approval of log?.approvals ?? []) {
      if (approval.previewBuildId) {
        kept.set(approval.previewBuildId, "reviewed for an approval");
      }
    }
  }
  return kept;
};

/**
 * Removes only what can be recomputed: leftover attempt directories, the
 * diagnostic compiled.json, and preview builds nothing points to. Source
 * files and media, revision history, approvals, receipts (production.json),
 * selected or approved builds, and every final export are never touched.
 */
export const cleanCache = async (
  projectRoot: string,
  options: { dryRun: boolean },
): Promise<CacheCleanResult> => {
  const root = await realpath(resolve(projectRoot));
  const removed: CacheEntry[] = [];
  const keptBuilds: CacheCleanResult["keptBuilds"] = [];

  const remove = async (path: string, reason: string): Promise<void> => {
    const bytes = await sizeOf(path);
    if (!options.dryRun) await rm(path, { recursive: true, force: true });
    removed.push({ path: path.slice(root.length + 1), bytes, reason });
  };

  const safeChildren = async (directory: string): Promise<string[]> => {
    try {
      const details = await lstat(directory);
      if (details.isSymbolicLink() || !details.isDirectory()) return [];
      const resolved = await realpath(directory);
      if (!resolved.startsWith(`${root}/`)) return [];
      const names: string[] = [];
      for (const name of await readdir(directory)) {
        const child = await lstat(join(directory, name));
        if (child.isDirectory() && !child.isSymbolicLink()) names.push(name);
      }
      return names;
    } catch {
      return [];
    }
  };

  for (const name of await safeChildren(join(root, ".naraframe", "attempts"))) {
    await remove(
      join(root, ".naraframe", "attempts", name),
      "leftover attempt",
    );
  }
  try {
    await stat(join(root, ".naraframe", "compiled.json"));
    await remove(join(root, ".naraframe", "compiled.json"), "diagnostic copy");
  } catch {
    // none
  }

  const retained = await retainedBuilds(root);
  for (const name of await safeChildren(join(root, "preview", "builds"))) {
    const reason = retained.get(name);
    if (reason) {
      keptBuilds.push({ buildId: name, reason });
    } else {
      await remove(
        join(root, "preview", "builds", name),
        "unselected preview build",
      );
    }
  }

  return {
    dryRun: options.dryRun,
    removed,
    keptBuilds,
    reclaimedBytes: removed.reduce((sum, entry) => sum + entry.bytes, 0),
  };
};
