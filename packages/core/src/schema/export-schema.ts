import { z } from "zod";
import {
  type Issue,
  issuesFromZodError,
  type Result,
  sortIssues,
} from "../model/issue.js";
import { type AssetManifest, AssetManifestSchema } from "./asset.js";
import { type Captions, CaptionsSchema } from "./captions.js";
import { CompiledDraftSchema } from "./compiled.js";
import { type Narration, NarrationSchema } from "./narration.js";
import { type ProfileLock, ProfileLockSchema } from "./profile.js";
import { type ProjectConfig, ProjectConfigSchema } from "./project.js";
import { type Scenes, ScenesSchema } from "./scene.js";

export interface PlanSource {
  project: ProjectConfig;
  profile: ProfileLock;
  scenes: Scenes;
  assets: AssetManifest;
  narration?: Narration;
  captions?: Captions;
}

const artifacts = {
  project: "naraframe.json",
  profile: "profile.lock.json",
  scenes: "scenes.json",
  assets: "assets/manifest.json",
} as const;

const schemaEntries = [
  ["ProjectConfig", ProjectConfigSchema],
  ["ProfileLock", ProfileLockSchema],
  ["Scenes", ScenesSchema],
  ["AssetManifest", AssetManifestSchema],
  ["Narration", NarrationSchema],
  ["Captions", CaptionsSchema],
  ["CompiledDraft", CompiledDraftSchema],
] as const;

export const exportSchemas = (): Record<string, unknown> =>
  Object.fromEntries(
    schemaEntries.map(([name, schema]) => [
      name,
      z.toJSONSchema(schema, { target: "draft-2020-12" }),
    ]),
  );

const planContainer = (input: unknown): Record<string, unknown> =>
  typeof input === "object" && input !== null
    ? (input as Record<string, unknown>)
    : {};

const customIssue = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  severity: Issue["severity"] = "error",
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion: "Correct the reported source value and validate again.",
});

const referencedAssets = (
  scenes: Scenes,
): Array<{
  assetId: string;
  path: string;
}> => {
  const references: Array<{ assetId: string; path: string }> = [];

  scenes.scenes.forEach((scene, sceneIndex) => {
    if (scene.visual.type === "media") {
      references.push({
        assetId: scene.visual.assetId,
        path: `/scenes/${sceneIndex}/visual/assetId`,
      });
    }

    if (scene.visual.type === "composition") {
      scene.visual.layers.forEach((layer, layerIndex) => {
        if (layer.type === "image") {
          references.push({
            assetId: layer.assetId,
            path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}/assetId`,
          });
        }
      });
    }
  });

  return references;
};

export const validatePlanSource = (input: unknown): Result<PlanSource> => {
  const container = planContainer(input);
  const projectResult = ProjectConfigSchema.safeParse(container.project);
  const profileResult = ProfileLockSchema.safeParse(container.profile);
  const scenesResult = ScenesSchema.safeParse(container.scenes);
  const assetsResult = AssetManifestSchema.safeParse(container.assets);
  const captionsResult =
    container.captions === undefined
      ? { success: true as const, data: undefined as Captions | undefined }
      : CaptionsSchema.safeParse(container.captions);
  const narrationResult =
    container.narration === undefined
      ? { success: true as const, data: undefined as Narration | undefined }
      : NarrationSchema.safeParse(container.narration);
  const schemaIssues = [
    ...(projectResult.success
      ? []
      : issuesFromZodError(projectResult.error, artifacts.project)),
    ...(profileResult.success
      ? []
      : issuesFromZodError(profileResult.error, artifacts.profile)),
    ...(scenesResult.success
      ? []
      : issuesFromZodError(scenesResult.error, artifacts.scenes)),
    ...(assetsResult.success
      ? []
      : issuesFromZodError(assetsResult.error, artifacts.assets)),
    ...(!captionsResult.success
      ? issuesFromZodError(
          (captionsResult as { error: z.ZodError }).error,
          "captions.json",
        )
      : []),
    ...(!narrationResult.success
      ? issuesFromZodError(
          (narrationResult as { error: z.ZodError }).error,
          "narration.json",
        )
      : []),
  ];

  if (
    !projectResult.success ||
    !profileResult.success ||
    !scenesResult.success ||
    !assetsResult.success ||
    !narrationResult.success ||
    !captionsResult.success
  ) {
    return { ok: false, issues: sortIssues(schemaIssues) };
  }

  const project = projectResult.data;
  const profile = profileResult.data;
  const scenes = scenesResult.data;
  const assets = assetsResult.data;
  const narration = narrationResult.data;
  const issues: Issue[] = [];

  if (project.profile.id !== profile.id) {
    issues.push(
      customIssue(
        "PROFILE_MISMATCH",
        artifacts.project,
        "/profile/id",
        "Project profile ID does not match the locked profile.",
      ),
    );
  }
  if (project.profile.version !== profile.version) {
    issues.push(
      customIssue(
        "PROFILE_MISMATCH",
        artifacts.project,
        "/profile/version",
        "Project profile version does not match the locked profile.",
      ),
    );
  }

  const assetIds = new Set(assets.assets.map((asset) => asset.id));
  referencedAssets(scenes).forEach((reference) => {
    if (!assetIds.has(reference.assetId)) {
      issues.push(
        customIssue(
          "ASSET_UNDECLARED",
          artifacts.scenes,
          reference.path,
          `Asset ${reference.assetId} is not declared in the asset manifest.`,
        ),
      );
    }
  });

  if (narration) {
    const blockIds = new Set(narration.blocks.map((block) => block.id));
    narration.blocks.forEach((block, blockIndex) => {
      if ("audioAssetId" in block) {
        if (!assetIds.has(block.audioAssetId)) {
          issues.push(
            customIssue(
              "ASSET_UNDECLARED",
              "narration.json",
              `/blocks/${blockIndex}/audioAssetId`,
              `Audio asset ${block.audioAssetId} is not declared in the asset manifest.`,
            ),
          );
        }
      }
    });
    scenes.scenes.forEach((scene, sceneIndex) => {
      if (!scene.narration) return;
      if (!blockIds.has(scene.narration.blockId)) {
        issues.push(
          customIssue(
            "NARRATION_BLOCK_UNKNOWN",
            "scenes.json",
            `/scenes/${sceneIndex}/narration/blockId`,
            `Scene ${scene.id} references unknown block ${scene.narration.blockId}.`,
          ),
        );
      } else if (scene.narration.phraseId) {
        const block = narration.blocks.find(
          (candidate) => candidate.id === scene.narration?.blockId,
        );
        const phrases = block && "phrases" in block ? block.phrases : undefined;
        if (
          !phrases?.some((phrase) => phrase.id === scene.narration?.phraseId)
        ) {
          issues.push(
            customIssue(
              "NARRATION_PHRASE_UNKNOWN",
              "scenes.json",
              `/scenes/${sceneIndex}/narration/phraseId`,
              `Block ${scene.narration.blockId} has no phrase ${scene.narration.phraseId}.`,
            ),
          );
        }
      }
    });
  }

  let totalDurationMs = 0;
  let safetyIssueAdded = false;
  scenes.scenes.forEach((scene, sceneIndex) => {
    totalDurationMs += scene.durationMs;
    if (!safetyIssueAdded && totalDurationMs > project.safetyMaxDurationMs) {
      issues.push(
        customIssue(
          "DURATION_LIMIT_EXCEEDED",
          artifacts.scenes,
          `/scenes/${sceneIndex}/durationMs`,
          "Project duration exceeds the 180-second safety limit.",
        ),
      );
      safetyIssueAdded = true;
    }
  });

  if (
    totalDurationMs < profile.duration.preferredMinMs ||
    totalDurationMs > profile.duration.preferredMaxMs
  ) {
    issues.push(
      customIssue(
        "DURATION_OUTSIDE_PROFILE_RECOMMENDATION",
        artifacts.scenes,
        "/scenes",
        "Project duration is outside the active profile recommendation.",
        "warning",
      ),
    );
  }

  const sortedIssues = sortIssues(issues);
  if (sortedIssues.some((issue) => issue.severity === "error")) {
    return { ok: false, issues: sortedIssues };
  }

  return {
    ok: true,
    value: {
      project,
      profile,
      scenes,
      assets,
      ...(narration ? { narration } : {}),
      ...(captionsResult.data ? { captions: captionsResult.data } : {}),
    },
    issues: sortedIssues,
  };
};
