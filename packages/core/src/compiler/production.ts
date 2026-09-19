import type { Issue } from "../model/issue.js";
import type { CompiledDraft } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import { referencedAssetIds } from "./keys.js";

const problem = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
  entityId?: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion,
  ...(entityId ? { entityId } : {}),
});

/**
 * What a final export needs beyond a valid plan: every used asset is ready,
 * narration exists and is complete, and every spoken clip is proven to be the
 * current one for its text. A plan-stage warning for missing proof becomes an
 * error here, because a final cannot rely on audio that might be stale.
 */
export const checkProductionReadiness = (
  source: PlanSource,
  compiled: CompiledDraft,
  compileIssues: readonly Issue[] = [],
): Issue[] => {
  const issues: Issue[] = [];

  if (!source.narration || !compiled.narration) {
    issues.push(
      problem(
        "NARRATION_REQUIRED",
        "narration.json",
        "/",
        "A final export needs narration; this project has none.",
        "Add narration.json with ready audio blocks, or keep working with draft previews.",
      ),
    );
  }

  const used = referencedAssetIds([
    compiled.scenes.map((scene) => [scene.visual, scene.layers]),
  ]);
  for (const id of [...used].sort()) {
    if (compiled.assets[id]?.kind === "placeholder") {
      issues.push(
        problem(
          "ASSET_NOT_READY",
          "assets/manifest.json",
          "/assets",
          `Asset ${id} is still planned but a scene uses it.`,
          "Provide the file and mark the asset ready, or remove it from the scene.",
          id,
        ),
      );
    }
  }

  for (const issue of compileIssues) {
    if (issue.code === "VOICE_BINDING_MISSING") {
      issues.push({ ...issue, severity: "error" });
    }
  }

  return issues;
};
