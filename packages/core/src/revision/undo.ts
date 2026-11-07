import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Result } from "../model/issue.js";
import { sha256File } from "../project/hash.js";
import { resolveSafeExistingFile } from "../project/safe-path.js";
import { syncWorkingCopy } from "./capture.js";
import { withProjectLock } from "./lock.js";
import {
  absolute,
  copyAtomic,
  issueFor,
  pathExists,
  readCurrentRevisionId,
  readRevisionMeta,
  removeIfExists,
  restoreObject,
  SOURCE_FILES,
  writeCurrentRevision,
} from "./store.js";

export interface UndoResult {
  fromRevisionId: string;
  revisionId: string;
  preservedInvalidCopy: string | null;
}

/**
 * Restores the previous accepted revision. It never calls a provider, and it
 * never touches production.json, so receipts and spend are unaffected.
 */
export const undoProject = async (options: {
  root: string;
  now?: () => string;
}): Promise<Result<UndoResult>> => {
  const root = resolve(options.root);
  return withProjectLock(root, async (): Promise<Result<UndoResult>> => {
    const synced = await syncWorkingCopy(root, options.now);
    const current = await readCurrentRevisionId(root);
    const meta = current ? await readRevisionMeta(root, current) : null;
    if (!current || !meta) {
      return {
        ok: false,
        issues: [
          issueFor(
            "NOTHING_TO_UNDO",
            "There is no accepted revision to go back from.",
            "Make an edit first.",
          ),
        ],
      };
    }
    if (meta.parentId === null) {
      return {
        ok: false,
        issues: [
          issueFor(
            "NOTHING_TO_UNDO",
            "This is the first revision; there is nothing earlier to restore.",
            "Nothing to do.",
            "warning",
          ),
        ],
      };
    }
    const parent = await readRevisionMeta(root, meta.parentId);
    if (!parent) {
      return {
        ok: false,
        issues: [
          issueFor(
            "REVISION_CORRUPT",
            `Parent revision ${meta.parentId} is missing from the history.`,
            "Restore the revisions folder from a backup.",
          ),
        ],
      };
    }

    let preserved: string | null = null;
    if (!synced.ok) {
      // The target snapshot identifies recipe files even if the working
      // manifest is unreadable. Preserve changed bytes before restoring them.
      const stamp = (options.now ?? (() => new Date().toISOString()))().replace(
        /[:.]/g,
        "-",
      );
      const recovery = join(root, "revisions", "recovered");
      await mkdir(recovery, { recursive: true });
      preserved = await mkdtemp(join(recovery, `${stamp}-`));
      for (const path of SOURCE_FILES) {
        const source = absolute(root, path);
        if (await pathExists(source)) {
          await cp(source, absolute(preserved, path), { recursive: true });
        }
      }
      for (const file of parent.media) {
        if (!file.path.startsWith("recipes/")) continue;
        const source = await resolveSafeExistingFile(root, file.path, {
          artifact: file.path,
          path: "/",
        });
        if (!source.ok) {
          if (
            source.issues.some((issue) => issue.code === "ASSET_PATH_UNSAFE")
          ) {
            return source;
          }
          continue;
        }
        if ((await sha256File(source.value)) !== file.sha256) {
          await copyAtomic(source.value, absolute(preserved, file.path));
        }
      }
    }

    for (const file of parent.sources) {
      await restoreObject(root, file.sha256, absolute(root, file.path));
    }
    const kept = new Set(parent.sources.map((file) => file.path));
    for (const path of SOURCE_FILES) {
      if (!kept.has(path)) await removeIfExists(absolute(root, path));
    }
    for (const file of parent.media) {
      const target = absolute(root, file.path);
      const intact =
        (await pathExists(target)) &&
        (await sha256File(target)) === file.sha256;
      if (!intact) await restoreObject(root, file.sha256, target);
    }
    await writeCurrentRevision(root, parent.id);

    return {
      ok: true,
      value: {
        fromRevisionId: current,
        revisionId: parent.id,
        preservedInvalidCopy: preserved,
      },
      issues: [],
    };
  });
};
