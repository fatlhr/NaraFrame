import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { Issue, Result } from "../model/issue.js";

interface SafeFileContext {
  artifact: string;
  path: string;
}

const isContained = (root: string, candidate: string): boolean => {
  const relativePath = relative(root, candidate);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
};

const assetIssue = (
  code: "ASSET_FILE_MISSING" | "ASSET_PATH_UNSAFE",
  context: SafeFileContext,
  message: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: context.artifact,
  path: context.path,
  message,
  suggestion:
    code === "ASSET_PATH_UNSAFE"
      ? "Use a regular file contained inside the declared root."
      : "Add the declared file and retry.",
});

export const resolveSafeExistingFile = async (
  root: string,
  relativePath: string,
  context: SafeFileContext,
): Promise<Result<string>> => {
  const rootPath = resolve(root);
  const candidatePath = resolve(rootPath, relativePath);

  if (!isContained(rootPath, candidatePath)) {
    return {
      ok: false,
      issues: [
        assetIssue(
          "ASSET_PATH_UNSAFE",
          context,
          "Asset path escapes its declared root.",
        ),
      ],
    };
  }

  try {
    const [realRoot, realCandidate, candidateStat] = await Promise.all([
      realpath(rootPath),
      realpath(candidatePath),
      stat(candidatePath),
    ]);

    if (!isContained(realRoot, realCandidate)) {
      return {
        ok: false,
        issues: [
          assetIssue(
            "ASSET_PATH_UNSAFE",
            context,
            "Asset symlink resolves outside its declared root.",
          ),
        ],
      };
    }

    if (!candidateStat.isFile()) {
      return {
        ok: false,
        issues: [
          assetIssue(
            "ASSET_FILE_MISSING",
            context,
            "Asset path does not resolve to a regular file.",
          ),
        ],
      };
    }

    return { ok: true, value: realCandidate, issues: [] };
  } catch {
    return {
      ok: false,
      issues: [
        assetIssue(
          "ASSET_FILE_MISSING",
          context,
          "Asset file does not exist or cannot be read.",
        ),
      ],
    };
  }
};
