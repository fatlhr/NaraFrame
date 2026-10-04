import type { Issue } from "../model/issue.js";
import type { CompiledDraft } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";
import {
  checkAudioModeConflicts,
  checkFinalAudioMode,
  resolveAudioMode,
} from "./audio-mode.js";
import { referencedAssetIds } from "./keys.js";

const problem = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
  entityId?: string,
  severity: Issue["severity"] = "error",
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion,
  ...(entityId ? { entityId } : {}),
});

export interface ProductionScope {
  /** Only this scene and what it depends on must be ready. */
  sceneId?: string;
  /**
   * A final export needs everything its audio mode requires; a production
   * preview only needs a conflict-free source.
   */
  finalExport?: boolean;
}

/** Everything one scene needs from outside itself. */
export interface SceneClosure {
  sceneId: string;
  blockId: string | null;
  audioAssetId: string | null;
  assetIds: string[];
  /** The previous scene whose transition plays inside this one, if any. */
  transitionHandleFrom: string | null;
}

export const computeSceneClosure = (
  source: PlanSource,
  sceneId: string,
): SceneClosure | null => {
  const index = source.scenes.scenes.findIndex((scene) => scene.id === sceneId);
  const scene = source.scenes.scenes[index];
  if (!scene) return null;
  const block = source.narration?.blocks.find(
    (candidate) => candidate.id === scene.narration?.blockId,
  );
  const previous = source.scenes.scenes[index - 1];
  return {
    sceneId,
    blockId: block?.id ?? null,
    audioAssetId: block && "audioAssetId" in block ? block.audioAssetId : null,
    assetIds: [...referencedAssetIds([scene.visual])].sort(),
    transitionHandleFrom:
      previous && previous.transition.type !== "cut" ? previous.id : null,
  };
};

/**
 * Gaps in scenes that are not part of a scoped preview. They are reported so
 * nobody thinks the whole project is ready, but they never block the preview.
 */
export const outOfScopeGaps = (
  source: PlanSource,
  sceneId: string,
): Issue[] => {
  const issues: Issue[] = [];
  const planned = new Set(
    source.assets.assets
      .filter((asset) => asset.status === "planned")
      .map((asset) => asset.id),
  );
  source.scenes.scenes.forEach((scene, index) => {
    if (scene.id === sceneId) return;
    for (const id of referencedAssetIds([scene.visual])) {
      if (planned.has(id)) {
        issues.push(
          problem(
            "OUT_OF_SCOPE_ASSET_NOT_READY",
            "assets/manifest.json",
            `/scenes/${index}`,
            `Scene ${scene.id} still uses planned asset ${id}. It does not affect this preview, but a final export will need it.`,
            "Provide the file and mark the asset ready before exporting.",
            scene.id,
            "info",
          ),
        );
      }
    }
    const block = source.narration?.blocks.find(
      (candidate) => candidate.id === scene.narration?.blockId,
    );
    if (block && !("audioAssetId" in block)) {
      issues.push(
        problem(
          "OUT_OF_SCOPE_BLOCK_NOT_READY",
          "narration.json",
          `/scenes/${index}`,
          `Scene ${scene.id} belongs to block ${block.id}, which has no audio yet. It does not affect this preview.`,
          "Record the block before exporting.",
          scene.id,
          "info",
        ),
      );
    }
  });
  return issues;
};

/**
 * What a production preview or a final export needs beyond a valid plan:
 * every used asset is ready, narration is complete where required, and every
 * spoken clip is proven to be the current one for its text. A plan-stage
 * warning for missing proof becomes an error here. With a `sceneId` the check
 * covers that scene and its dependencies, and reports the rest separately.
 */
export const checkProductionReadiness = (
  source: PlanSource,
  compiled: CompiledDraft,
  compileIssues: readonly Issue[] = [],
  scope: ProductionScope = {},
): Issue[] => {
  const issues: Issue[] = [];
  const finalExport = scope.finalExport ?? true;
  const closure = scope.sceneId
    ? computeSceneClosure(source, scope.sceneId)
    : null;

  const audioMode = resolveAudioMode(source);
  issues.push(...checkAudioModeConflicts(source, audioMode));
  if (finalExport) {
    issues.push(
      ...checkFinalAudioMode(
        source,
        audioMode,
        compiled.narration !== undefined,
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
    if (
      issue.code !== "VOICE_BINDING_MISSING" &&
      issue.code !== "VOICE_STYLE_MISMATCH"
    )
      continue;
    const inScope = !closure || issue.entityId === closure.blockId;
    issues.push({ ...issue, severity: inScope ? "error" : "info" });
  }

  // Brand identity that does not hold under the pinned profile is fine in a
  // draft, but a final export must not ship another brand's logo or CTA.
  if (finalExport) {
    for (const issue of compileIssues) {
      if (
        issue.code === "BRAND_TEXT_MISMATCH" ||
        issue.code === "BRAND_FIELD_MISSING" ||
        issue.code === "BRAND_ASSET_MISMATCH" ||
        issue.code === "ASSET_BINDING_UNKNOWN"
      ) {
        issues.push({ ...issue, severity: "error" });
      }
    }
  }

  for (const issue of compileIssues) {
    if (issue.code === "SOUNDTRACK_ASSET_PLANNED") {
      issues.push({ ...issue, severity: "error" });
    }
  }

  if (closure) issues.push(...outOfScopeGaps(source, closure.sceneId));
  return issues;
};
