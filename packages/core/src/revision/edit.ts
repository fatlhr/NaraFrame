import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadPlanProject } from "../io/load-project.js";
import type { Issue, Result } from "../model/issue.js";
import { syncWorkingCopy, writeSnapshot } from "./capture.js";
import { withProjectLock } from "./lock.js";
import {
  absolute,
  copyAtomic,
  EXCLUDED_TOP_LEVEL,
  issueFor,
  linkTree,
  listFiles,
  pathExists,
  readCurrentRevisionId,
  removeIfExists,
  writeCurrentRevision,
} from "./store.js";

export interface EditOptions {
  root: string;
  /**
   * Directory holding replacement files, laid out like the project. Optional
   * when `remove` names at least one file.
   */
  from?: string;
  /**
   * Optional source files to delete in this revision (`narration.json`,
   * `captions.json`). The snapshot records their absence, so `undo` restores
   * them.
   */
  remove?: readonly string[];
  /** The revision the caller read before preparing this edit. */
  expect: string;
  summary: string;
  now?: () => string;
}

export interface EditResult {
  revisionId: string;
  parentId: string;
  files: string[];
  /** Optional source files this revision deleted. */
  removed: string[];
  captured: boolean;
}

/** The only source files an edit may delete: the optional ones. */
const REMOVABLE_FILES: readonly string[] = ["narration.json", "captions.json"];

const isSafe = (path: string): boolean => {
  const segments = path.split("/");
  return (
    !path.startsWith("/") &&
    !path.includes("\\") &&
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) &&
    !EXCLUDED_TOP_LEVEL.has(segments[0] ?? "")
  );
};

/** Refuses removals of required, unknown, absent or also-staged files. */
const refuseRemovals = async (
  root: string,
  removals: readonly string[],
  staged: readonly string[],
): Promise<Issue | null> => {
  const notAllowed = removals.filter((path) => !REMOVABLE_FILES.includes(path));
  if (notAllowed.length > 0) {
    return issueFor(
      "REMOVE_NOT_ALLOWED",
      `Only optional source files can be removed (${REMOVABLE_FILES.join(", ")}); refused: ${notAllowed.join(", ")}.`,
      "Required sources are replaced by staging a new version, never removed.",
    );
  }
  const alsoStaged = removals.filter((path) => staged.includes(path));
  if (alsoStaged.length > 0) {
    return issueFor(
      "REMOVE_AND_STAGED",
      `The same file is staged and removed: ${alsoStaged.join(", ")}.`,
      "Either stage a replacement or remove the file, not both.",
    );
  }
  const absent: string[] = [];
  for (const path of removals) {
    if (!(await pathExists(absolute(root, path)))) absent.push(path);
  }
  if (absent.length > 0) {
    return issueFor(
      "REMOVE_TARGET_ABSENT",
      `The project has no such file to remove: ${absent.join(", ")}.`,
      "Check the project's source files; nothing was changed.",
    );
  }
  return null;
};

/**
 * Applies a staged set of files as one revision: validate, snapshot, update
 * the working copy, then switch `revisions/current.json`. Any earlier failure
 * leaves the accepted snapshot and the working copy exactly as they were.
 */
export const editProject = async (
  options: EditOptions,
): Promise<Result<EditResult>> => {
  const root = resolve(options.root);
  const from = options.from === undefined ? null : resolve(options.from);
  const stagedFile = (path: string): string => absolute(from ?? "", path);
  const removals = [...new Set(options.remove ?? [])].sort();

  return withProjectLock(root, async (): Promise<Result<EditResult>> => {
    const synced = await syncWorkingCopy(root, options.now);
    if (!synced.ok) return synced;

    const current = await readCurrentRevisionId(root);
    if (current === null || current !== options.expect) {
      return {
        ok: false,
        issues: [
          issueFor(
            "REVISION_CONFLICT",
            `Expected revision ${options.expect} but the project is at ${current ?? "no revision"}${synced.value.status === "captured" ? " (direct edits were just captured)" : ""}.`,
            "Read the current revision with status, re-apply your change on top of it, and retry.",
          ),
        ],
      };
    }

    if (from === null && removals.length === 0) {
      return {
        ok: false,
        issues: [
          issueFor(
            "STAGING_EMPTY",
            "Nothing to apply: no staging directory and no files to remove.",
            "Provide a staging directory with the changed source files, or name an optional file to remove.",
          ),
        ],
      };
    }
    if (from !== null && !(await pathExists(from))) {
      return {
        ok: false,
        issues: [
          issueFor(
            "STAGING_MISSING",
            "The staging directory does not exist.",
            "Create it and put the replacement files inside.",
          ),
        ],
      };
    }
    const staged = from === null ? [] : (await listFiles(from)).sort();
    if (staged.length === 0 && removals.length === 0) {
      return {
        ok: false,
        issues: [
          issueFor(
            "STAGING_EMPTY",
            "The staging directory contains no files.",
            "Place the changed source files in it, laid out like the project.",
          ),
        ],
      };
    }
    const unsafe = staged.filter((path) => !isSafe(path));
    if (unsafe.length > 0) {
      return {
        ok: false,
        issues: [
          issueFor(
            "STAGING_PATH_UNSAFE",
            `Staged paths must be project-relative and not inside generated folders: ${unsafe.join(", ")}.`,
            "Remove those files from the staging directory.",
          ),
        ],
      };
    }

    const refused = await refuseRemovals(root, removals, staged);
    if (refused) return { ok: false, issues: [refused] };

    const candidate = join(
      root,
      ".naraframe",
      "attempts",
      `edit-${randomUUID()}`,
    );
    try {
      await mkdir(candidate, { recursive: true });
      await linkTree(root, candidate);
      for (const path of staged) {
        await removeIfExists(absolute(candidate, path));
        await copyAtomic(stagedFile(path), absolute(candidate, path));
      }
      // Hard links share data with the working copy: unlinking only drops the
      // candidate's name for the file.
      for (const path of removals) {
        await removeIfExists(absolute(candidate, path));
      }

      const loaded = await loadPlanProject(candidate);
      if (!loaded.ok) {
        return {
          ok: false,
          issues: [
            issueFor(
              "STAGED_SOURCE_INVALID",
              "The staged files do not validate, so nothing was changed.",
              "Fix the reported problems and stage again.",
            ),
            ...loaded.issues,
          ],
        };
      }

      const snapshot = await writeSnapshot({
        storeRoot: root,
        viewRoot: candidate,
        source: loaded.value.source,
        parentId: current,
        summary: options.summary,
        kind: "edit",
        ...(options.now ? { now: options.now } : {}),
      });

      if (snapshot.id === current) {
        return {
          ok: false,
          issues: [
            issueFor(
              "EDIT_NO_CHANGE",
              "The staged files produce the source that is already current.",
              "Nothing to do.",
              "warning",
            ),
          ],
        };
      }

      for (const path of staged) {
        await copyAtomic(stagedFile(path), absolute(root, path));
      }
      for (const path of removals) {
        await removeIfExists(absolute(root, path));
      }
      await writeCurrentRevision(root, snapshot.id);

      return {
        ok: true,
        value: {
          revisionId: snapshot.id,
          parentId: current,
          files: staged,
          removed: removals,
          captured: synced.value.status === "captured",
        },
        issues: [],
      };
    } finally {
      await rm(candidate, { recursive: true, force: true });
    }
  });
};
