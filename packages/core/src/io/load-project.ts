import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Issue, Result } from "../model/issue.js";
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

export const loadPlanProject = async (
  projectRoot: string,
): Promise<Result<LoadedPlanProject>> => {
  const root = resolve(projectRoot);
  const [project, profile, scenes, assets] = await Promise.all([
    readJson(root, sourceFiles.project),
    readJson(root, sourceFiles.profile),
    readJson(root, sourceFiles.scenes),
    readJson(root, sourceFiles.assets),
  ]);
  const issues = [project, profile, scenes, assets].flatMap((result) =>
    result.ok ? [] : result.issues,
  );

  if (!project.ok || !profile.ok || !scenes.ok || !assets.ok) {
    return { ok: false, issues };
  }

  const validated = validatePlanSource({
    project: project.value,
    profile: profile.value,
    scenes: scenes.value,
    assets: assets.value,
  });

  if (!validated.ok) {
    return validated;
  }

  return {
    ok: true,
    value: { root, source: validated.value },
    issues: validated.issues,
  };
};
