import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { type SanitizedSvg, sanitizeSvg } from "../asset/svg-sanitize.js";
import { type Issue, type Result, sortIssues } from "../model/issue.js";
import { sha256File, sha256Text } from "../project/hash.js";
import { resolveSafeExistingFile } from "../project/safe-path.js";
import { loadRecipes } from "../recipe/load-recipes.js";
import {
  type PlanSource,
  validatePlanSource,
} from "../schema/export-schema.js";

const sourceFiles = {
  project: "naraframe.json",
  profile: "profile.lock.json",
  scenes: "scenes.json",
  assets: "assets/manifest.json",
} as const;

const ioIssue = (
  code: "SOURCE_MISSING" | "SOURCE_JSON_INVALID",
  artifact: string,
  message: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact,
  path: "/",
  message,
  suggestion:
    code === "SOURCE_MISSING"
      ? `Create ${artifact} in the project directory and retry.`
      : `Correct the JSON syntax in ${artifact} and retry.`,
});

const readJson = async (
  projectRoot: string,
  artifact: string,
): Promise<Result<unknown>> => {
  const absolutePath = resolve(projectRoot, artifact);

  try {
    const source = await readFile(absolutePath, "utf8");
    try {
      return { ok: true, value: JSON.parse(source), issues: [] };
    } catch (error) {
      return {
        ok: false,
        issues: [
          ioIssue(
            "SOURCE_JSON_INVALID",
            artifact,
            error instanceof Error ? error.message : "Invalid JSON source.",
          ),
        ],
      };
    }
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    return {
      ok: false,
      issues: [
        ioIssue(
          "SOURCE_MISSING",
          artifact,
          errorCode === "ENOENT"
            ? `Required source file ${artifact} does not exist.`
            : `Could not read ${artifact}.`,
        ),
      ],
    };
  }
};

export interface LoadedPlanProject {
  root: string;
  source: PlanSource;
}

const hashMismatchIssue = (
  code: "ASSET_HASH_MISMATCH" | "PROFILE_DIRECTION_HASH_MISMATCH",
  artifact: string,
  path: string,
  message: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact,
  path,
  message,
  suggestion: "Restore the locked file or update its hash intentionally.",
});

const verifyLockedFiles = async (
  root: string,
  source: PlanSource,
): Promise<Issue[]> => {
  const checks = [
    ...source.profile.assets.map((asset, index) => ({
      artifact: sourceFiles.profile,
      path: `/assets/${index}`,
      id: asset.id,
      filePath: asset.path,
      sha256: asset.sha256,
    })),
    ...source.assets.assets.flatMap((asset, index) =>
      asset.status === "ready"
        ? [
            {
              artifact: sourceFiles.assets,
              path: `/assets/${index}`,
              id: asset.id,
              filePath: asset.path,
              sha256: asset.sha256,
            },
          ]
        : [],
    ),
  ];
  const issues: Issue[] = [];

  for (const check of checks) {
    const resolved = await resolveSafeExistingFile(root, check.filePath, {
      artifact: check.artifact,
      path: `${check.path}/path`,
    });
    if (!resolved.ok) {
      issues.push(...resolved.issues);
      continue;
    }

    const actualHash = await sha256File(resolved.value);
    if (actualHash !== check.sha256) {
      issues.push(
        hashMismatchIssue(
          "ASSET_HASH_MISMATCH",
          check.artifact,
          `${check.path}/sha256`,
          `Locked hash for asset ${check.id} does not match its file.`,
        ),
      );
    }
  }

  if (
    sha256Text(source.profile.direction.text) !==
    source.profile.direction.sha256
  ) {
    issues.push(
      hashMismatchIssue(
        "PROFILE_DIRECTION_HASH_MISMATCH",
        sourceFiles.profile,
        "/direction/sha256",
        "Locked profile direction hash does not match its text.",
      ),
    );
  }

  return sortIssues(issues);
};

/**
 * Reads and checks every vector asset. The id prefix is the asset's own hash,
 * so the same artwork always yields the same markup — render keys depend on
 * it — and two illustrations on one scene cannot claim each other's gradients.
 */
const resolveVectors = async (
  root: string,
  source: PlanSource,
): Promise<Result<Record<string, SanitizedSvg>>> => {
  const vectors: Record<string, SanitizedSvg> = {};
  const issues: Issue[] = [];

  for (const [index, asset] of source.assets.assets.entries()) {
    if (asset.status !== "ready" || asset.kind !== "svg") continue;
    const resolved = await resolveSafeExistingFile(root, asset.path, {
      artifact: sourceFiles.assets,
      path: `/assets/${index}/path`,
    });
    if (!resolved.ok) {
      issues.push(...resolved.issues);
      continue;
    }
    const markup = await readFile(resolved.value, "utf8");
    const sanitized = sanitizeSvg(markup, `${asset.sha256.slice(0, 12)}-`);
    if (!sanitized.ok) {
      issues.push(
        ...sanitized.issues.map((issue) => ({
          ...issue,
          artifact: sourceFiles.assets,
          path: `/assets/${index}/path`,
          entityId: asset.id,
          message: `Vector asset ${asset.id}: ${issue.message}`,
        })),
      );
      continue;
    }
    vectors[asset.id] = sanitized.value;
  }

  return issues.length > 0
    ? { ok: false, issues: sortIssues(issues) }
    : { ok: true, value: vectors, issues: [] };
};

export const loadPlanProject = async (
  projectRoot: string,
): Promise<Result<LoadedPlanProject>> => {
  const root = resolve(projectRoot);
  const optionalJson = (artifact: string) =>
    readJson(root, artifact).then((result) =>
      result.ok
        ? result
        : result.issues[0]?.code === "SOURCE_MISSING"
          ? { ok: true as const, value: undefined, issues: [] as Issue[] }
          : result,
    );
  const [project, profile, scenes, assets, narration, captions] =
    await Promise.all([
      readJson(root, sourceFiles.project),
      readJson(root, sourceFiles.profile),
      readJson(root, sourceFiles.scenes),
      readJson(root, sourceFiles.assets),
      optionalJson("narration.json"),
      optionalJson("captions.json"),
    ]);
  const issues = [
    project,
    profile,
    scenes,
    assets,
    narration,
    captions,
  ].flatMap((result) => (result.ok ? [] : result.issues));

  if (
    !project.ok ||
    !profile.ok ||
    !scenes.ok ||
    !assets.ok ||
    !narration.ok ||
    !captions.ok
  ) {
    return { ok: false, issues };
  }

  const validated = validatePlanSource({
    project: project.value,
    profile: profile.value,
    scenes: scenes.value,
    assets: assets.value,
    ...(narration.value !== undefined ? { narration: narration.value } : {}),
    ...(captions.value !== undefined ? { captions: captions.value } : {}),
  });

  if (!validated.ok) {
    return validated;
  }

  const lockedFileIssues = await verifyLockedFiles(root, validated.value);
  if (lockedFileIssues.length > 0) {
    return {
      ok: false,
      issues: sortIssues([...validated.issues, ...lockedFileIssues]),
    };
  }

  const vectors = await resolveVectors(root, validated.value);
  if (!vectors.ok) {
    return {
      ok: false,
      issues: sortIssues([...validated.issues, ...vectors.issues]),
    };
  }

  const recipes = await loadRecipes(root, validated.value);
  if (!recipes.ok) {
    return {
      ok: false,
      issues: sortIssues([...validated.issues, ...recipes.issues]),
    };
  }

  return {
    ok: true,
    value: {
      root,
      source: {
        ...(Object.keys(vectors.value).length > 0
          ? { ...validated.value, vectors: vectors.value }
          : validated.value),
        ...recipes.value,
      },
    },
    issues: validated.issues,
  };
};
