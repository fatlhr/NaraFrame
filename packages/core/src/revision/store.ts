import { randomUUID } from "node:crypto";
import {
  copyFile,
  link,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { Issue } from "../model/issue.js";
import { sha256File } from "../project/hash.js";
import {
  CurrentRevisionSchema,
  PreviewSelectionSchema,
  type RevisionMeta,
  RevisionMetaSchema,
} from "./schema.js";

/** Source files that make up a revision. The last two are optional. */
export const SOURCE_FILES = [
  "naraframe.json",
  "profile.lock.json",
  "scenes.json",
  "assets/manifest.json",
  "narration.json",
  "captions.json",
] as const;

/** Top-level entries that are never part of a source snapshot or its media. */
export const EXCLUDED_TOP_LEVEL = new Set([
  "revisions",
  "preview",
  "output",
  ".naraframe",
  ".git",
  "node_modules",
]);

export const revisionsDirectory = (root: string): string =>
  join(root, "revisions");

const objectPath = (root: string, sha256: string): string =>
  join(revisionsDirectory(root), "objects", sha256);

export const issueFor = (
  code: string,
  message: string,
  suggestion: string,
  severity: Issue["severity"] = "error",
  responsible: Issue["responsible"] = "user",
): Issue => ({
  code,
  severity,
  responsible,
  artifact: "revisions",
  path: "/",
  message,
  suggestion,
});

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Writes through a sibling temp file so readers never see a partial file. */
export const atomicWrite = async (
  path: string,
  data: string | Buffer,
): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, data);
  await rename(temporary, path);
};

export const copyAtomic = async (
  source: string,
  destination: string,
): Promise<void> => {
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await copyFile(source, temporary);
  await rename(temporary, destination);
};

/** Stores a file once, addressed by its hash. Returns the hash. */
export const storeObject = async (
  root: string,
  filePath: string,
): Promise<string> => {
  const sha256 = await sha256File(filePath);
  const destination = objectPath(root, sha256);
  if (!(await pathExists(destination))) {
    await copyAtomic(filePath, destination);
  }
  return sha256;
};

export const restoreObject = async (
  root: string,
  sha256: string,
  destination: string,
): Promise<void> => {
  await copyAtomic(objectPath(root, sha256), destination);
};

export const readCurrentRevisionId = async (
  root: string,
): Promise<string | null> => {
  try {
    const text = await readFile(
      join(revisionsDirectory(root), "current.json"),
      "utf8",
    );
    const parsed = CurrentRevisionSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.revisionId : null;
  } catch {
    return null;
  }
};

export const writeCurrentRevision = async (
  root: string,
  revisionId: string,
): Promise<void> => {
  await atomicWrite(
    join(revisionsDirectory(root), "current.json"),
    `${JSON.stringify({ schemaVersion: 1, revisionId }, null, 2)}\n`,
  );
};

export const readRevisionMeta = async (
  root: string,
  id: string,
): Promise<RevisionMeta | null> => {
  try {
    const text = await readFile(
      join(revisionsDirectory(root), id, "revision.json"),
      "utf8",
    );
    const parsed = RevisionMetaSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const writeRevisionMeta = async (
  root: string,
  meta: RevisionMeta,
): Promise<void> => {
  await atomicWrite(
    join(revisionsDirectory(root), meta.id, "revision.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
};

export const readPreviewSelection = async (root: string, id: string) => {
  try {
    const text = await readFile(
      join(revisionsDirectory(root), "selection", `${id}.json`),
      "utf8",
    );
    const parsed = PreviewSelectionSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/**
 * Links a preview build to a revision. Kept outside the immutable snapshot so
 * the source never depends on a build derived from it.
 */
export const writePreviewSelection = async (
  root: string,
  revisionId: string,
  buildId: string,
  now: () => string = () => new Date().toISOString(),
): Promise<void> => {
  await atomicWrite(
    join(revisionsDirectory(root), "selection", `${revisionId}.json`),
    `${JSON.stringify({ schemaVersion: 1, revisionId, buildId, selectedAt: now() }, null, 2)}\n`,
  );
};

/** Mirrors a project tree using hard links, falling back to copies. */
export const linkTree = async (
  source: string,
  destination: string,
  top = true,
): Promise<void> => {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (top && EXCLUDED_TOP_LEVEL.has(entry.name)) continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      await linkTree(from, to, false);
    } else if (entry.isFile()) {
      try {
        await link(from, to);
      } catch {
        await copyFile(from, to);
      }
    }
  }
};

export const listFiles = async (
  directory: string,
  prefix = "",
): Promise<string[]> => {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      found.push(...(await listFiles(join(directory, entry.name), relative)));
    } else if (entry.isFile()) {
      found.push(relative);
    }
  }
  return found;
};

export const removeIfExists = async (path: string): Promise<void> => {
  try {
    await unlink(path);
  } catch {
    // already absent
  }
};

export const absolute = (root: string, relative: string): string =>
  resolve(root, relative);
