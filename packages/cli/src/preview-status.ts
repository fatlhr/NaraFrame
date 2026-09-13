import { createHash } from "node:crypto";
import { lstat, readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import type { CompiledDraft, Issue } from "@naraframe/core";

const artifactNames = [
  "preview.mp4",
  "contact-sheet.png",
  "frames.json",
  "report.json",
] as const;

export interface CurrentPreviewStatus {
  state: "absent" | "current" | "stale";
  buildId: string | null;
  sourceRevision: string | null;
  fingerprint: string | null;
  scope: Record<string, unknown> | null;
  artifacts: Record<string, string>;
  data: Record<string, unknown>;
  issues: Issue[];
}

const systemMetadataIssue = (
  code: string,
  artifact: string,
  path: string,
  message: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "system",
  artifact,
  path,
  message,
  suggestion:
    "Preserve project source files, move the invalid generated preview metadata aside, and create a new draft preview.",
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isContained = (root: string, candidate: string): boolean => {
  const result = relative(root, candidate);
  return (
    result === "" ||
    (!result.startsWith(`..${sep}`) && result !== ".." && !isAbsolute(result))
  );
};

const sha256File = async (path: string): Promise<string> =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

const readObject = async (path: string): Promise<Record<string, unknown>> => {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isObject(value)) {
    throw new Error("Expected one JSON object.");
  }
  return value;
};

const safeGeneratedFile = async (
  projectRoot: string,
  path: string,
): Promise<string> => {
  const details = await lstat(path);
  if (details.isSymbolicLink() || !details.isFile()) {
    throw new Error(
      "Generated metadata must be a regular file, not a symlink.",
    );
  }
  const resolved = await realpath(path);
  if (!isContained(projectRoot, resolved)) {
    throw new Error("Generated metadata escaped the project root.");
  }
  return resolved;
};

const absent = (): CurrentPreviewStatus => ({
  state: "absent",
  buildId: null,
  sourceRevision: null,
  fingerprint: null,
  scope: null,
  artifacts: {},
  data: { previewState: "absent" },
  issues: [],
});

export const readCurrentPreviewStatus = async (
  projectRoot: string,
  draft: CompiledDraft,
): Promise<CurrentPreviewStatus> => {
  const root = await realpath(resolve(projectRoot));
  const pointerPath = join(root, "preview", "current.json");
  try {
    await lstat(pointerPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return absent();
    }
    throw error;
  }

  try {
    const safePointer = await safeGeneratedFile(root, pointerPath);
    const pointer = await readObject(safePointer);
    const buildId = pointer.buildId;
    const manifestRelative = pointer.manifest;
    const declaredManifestHash = pointer.manifestSha256;
    if (
      pointer.schemaVersion !== 1 ||
      typeof buildId !== "string" ||
      !/^[a-f0-9]{12}-[a-f0-9-]+$/.test(buildId) ||
      manifestRelative !== `builds/${buildId}/manifest.json` ||
      typeof declaredManifestHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(declaredManifestHash)
    ) {
      throw new Error("Current preview pointer has an invalid shape.");
    }

    const manifestPath = join(root, "preview", manifestRelative);
    const safeManifest = await safeGeneratedFile(root, manifestPath);
    if ((await sha256File(safeManifest)) !== declaredManifestHash) {
      throw new Error(
        "Current preview manifest hash does not match its pointer.",
      );
    }
    const manifest = await readObject(safeManifest);
    if (
      manifest.schemaVersion !== 1 ||
      manifest.buildId !== buildId ||
      typeof manifest.sourceRevision !== "string" ||
      !/^[a-f0-9]{64}$/.test(manifest.sourceRevision) ||
      typeof manifest.assemblyKey !== "string" ||
      !/^[a-f0-9]{64}$/.test(manifest.assemblyKey) ||
      manifest.mode !== "draft" ||
      !isObject(manifest.scope) ||
      !isObject(manifest.artifacts)
    ) {
      throw new Error("Current preview manifest has an invalid shape.");
    }

    const buildDirectory = join(root, "preview", "builds", buildId);
    const artifacts: Record<string, string> = {
      current: safePointer,
      manifestJson: safeManifest,
    };
    for (const name of artifactNames) {
      const record = manifest.artifacts[name];
      if (
        !isObject(record) ||
        record.path !== name ||
        typeof record.bytes !== "number" ||
        record.bytes <= 0 ||
        typeof record.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(record.sha256)
      ) {
        throw new Error(
          `Current preview manifest has no valid ${name} record.`,
        );
      }
      const artifactPath = await safeGeneratedFile(
        root,
        join(buildDirectory, name),
      );
      const details = await stat(artifactPath);
      if (
        details.size !== record.bytes ||
        (await sha256File(artifactPath)) !== record.sha256
      ) {
        throw new Error(
          `Current preview artifact ${name} failed its size or hash check.`,
        );
      }
      artifacts[
        name.replace(/[-.]([a-z])/g, (_, value: string) => value.toUpperCase())
      ] = artifactPath;
    }

    const state =
      manifest.sourceRevision === draft.sourceRevision ? "current" : "stale";
    const issues: Issue[] =
      state === "stale"
        ? [
            {
              code: "PREVIEW_STALE",
              severity: "warning",
              responsible: "user",
              artifact: "preview/current.json",
              path: "/buildId",
              message:
                "The current preview was built from an older source revision.",
              suggestion:
                "Run naraframe preview --draft --json to publish a current preview.",
            },
          ]
        : [];
    return {
      state,
      buildId,
      sourceRevision: manifest.sourceRevision,
      fingerprint: manifest.assemblyKey,
      scope: manifest.scope,
      artifacts,
      data: {
        previewState: state,
        currentPointer: safePointer,
        manifestSha256: declaredManifestHash,
        timelineScope: manifest.timelineScope ?? null,
        label: manifest.label ?? null,
      },
      issues,
    };
  } catch {
    return {
      ...absent(),
      state: "absent",
      issues: [
        systemMetadataIssue(
          "PREVIEW_METADATA_INVALID",
          "preview/current.json",
          "/",
          "The current preview pointer, manifest, or artifact integrity is invalid.",
        ),
      ],
    };
  }
};
