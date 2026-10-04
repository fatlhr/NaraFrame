import { referencedAssetIds } from "../compiler/keys.js";
import type { Issue } from "../model/issue.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { ProfileLock } from "../schema/profile.js";

type TextBinding = "brand.name" | "brand.cta.label" | "brand.cta.url";

const brandValue = (
  profile: Pick<ProfileLock, "brand">,
  binding: TextBinding,
): string | undefined =>
  binding === "brand.name"
    ? profile.brand?.name
    : binding === "brand.cta.label"
      ? profile.brand?.cta?.label
      : profile.brand?.cta?.url;

interface BoundText {
  sceneId: string;
  layerId: string;
  binding: TextBinding;
  text: string;
  path: string;
}

const boundTexts = (source: PlanSource): BoundText[] =>
  source.scenes.scenes.flatMap((scene, sceneIndex) =>
    scene.visual.type === "composition"
      ? scene.visual.layers.flatMap((layer, layerIndex) =>
          layer.type === "text" && layer.binding
            ? [
                {
                  sceneId: scene.id,
                  layerId: layer.id,
                  binding: layer.binding,
                  text: layer.text,
                  path: `/scenes/${sceneIndex}/visual/layers/${layerIndex}`,
                },
              ]
            : [],
        )
      : [],
  );

const usedAssets = (source: PlanSource) => {
  const used = referencedAssetIds(
    source.scenes.scenes.map((scene) => scene.visual),
  );
  return source.assets.assets.flatMap((asset) =>
    used.has(asset.id) &&
    asset.status === "ready" &&
    (asset.kind === "png" || asset.kind === "svg")
      ? [asset]
      : [],
  );
};

const bindingIssue = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
  entityId: string,
): Issue => ({
  code,
  severity: "warning",
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion,
  entityId,
});

/**
 * Brand bindings that do not hold under the pinned profile: bound text that
 * differs from the profile value, images bound to another brand, and, for a
 * brand-managed profile, used images whose binding is unknown. Warnings for
 * drafts; production readiness turns them into errors.
 */
export const checkBrandBindings = (source: PlanSource): Issue[] => {
  const issues: Issue[] = [];
  const profile = source.profile;
  for (const bound of boundTexts(source)) {
    const value = brandValue(profile, bound.binding);
    if (value === undefined) {
      issues.push(
        bindingIssue(
          "BRAND_FIELD_MISSING",
          "scenes.json",
          bound.path,
          `Text ${bound.layerId} is bound to ${bound.binding}, which profile ${profile.id} does not define.`,
          `Add ${bound.binding} to the profile's brand block, or remove the binding.`,
          bound.layerId,
        ),
      );
    } else if (value !== bound.text) {
      issues.push(
        bindingIssue(
          "BRAND_TEXT_MISMATCH",
          "scenes.json",
          `${bound.path}/text`,
          `Text ${bound.layerId} is bound to ${bound.binding} but reads "${bound.text}"; profile ${profile.id} says "${value}".`,
          "Update the text to the profile value through an edit, after checking the copy still fits and is true for this brand.",
          bound.layerId,
        ),
      );
    }
  }
  const used = new Set(usedAssets(source).map((asset) => asset.id));
  source.assets.assets.forEach((asset, index) => {
    if (!used.has(asset.id)) return;
    const binding = "binding" in asset ? asset.binding : undefined;
    if (binding && binding !== "neutral" && binding.brand !== profile.id) {
      issues.push(
        bindingIssue(
          "BRAND_ASSET_MISMATCH",
          "assets/manifest.json",
          `/assets/${index}/binding`,
          `Asset ${asset.id} belongs to brand ${binding.brand}, but this project now uses profile ${profile.id}.`,
          "Replace it with this brand's asset for the same role, or remove it from the scene.",
          asset.id,
        ),
      );
    } else if (!binding && profile.brand) {
      issues.push(
        bindingIssue(
          "ASSET_BINDING_UNKNOWN",
          "assets/manifest.json",
          `/assets/${index}`,
          `Asset ${asset.id} has no brand binding; profile ${profile.id} manages brand identity, so an unknown image is not assumed compatible.`,
          `Mark it "neutral" if any brand may use it, or bind it to {"brand": "${profile.id}"} with its role.`,
          asset.id,
        ),
      );
    }
  });
  return issues;
};

export interface BrandBindingPlan {
  /** Bound to the current brand; the target profile has an asset for its role. */
  branded: Array<{ assetId: string; role: string | null; replacement: string }>;
  /** Bound to the current brand with no target asset for its role. */
  incompatible: Array<{ assetId: string; role: string | null }>;
  neutral: string[];
  /** No binding: never assumed compatible. */
  unknown: string[];
  text: Array<{
    sceneId: string;
    layerId: string;
    binding: TextBinding;
    current: string;
    target: string | null;
  }>;
  /** Scenes that carry a factual claim; a brand switch never validates them. */
  claims: string[];
}

/** How the project's brand-bound content fares under another profile. */
export const planBrandBindings = (
  source: PlanSource,
  target: ProfileLock,
): BrandBindingPlan => {
  const plan: BrandBindingPlan = {
    branded: [],
    incompatible: [],
    neutral: [],
    unknown: [],
    text: [],
    claims: [],
  };
  for (const asset of usedAssets(source)) {
    const binding = asset.binding;
    if (binding === "neutral") {
      plan.neutral.push(asset.id);
    } else if (!binding) {
      plan.unknown.push(asset.id);
    } else if (binding.brand === target.id) {
      plan.neutral.push(asset.id);
    } else {
      const replacement = target.assets.find(
        (candidate) => binding.role && candidate.role === binding.role,
      );
      if (replacement) {
        plan.branded.push({
          assetId: asset.id,
          role: binding.role ?? null,
          replacement: replacement.id,
        });
      } else {
        plan.incompatible.push({
          assetId: asset.id,
          role: binding.role ?? null,
        });
      }
    }
  }
  for (const bound of boundTexts(source)) {
    plan.text.push({
      sceneId: bound.sceneId,
      layerId: bound.layerId,
      binding: bound.binding,
      current: bound.text,
      target: brandValue(target, bound.binding) ?? null,
    });
  }
  plan.claims = source.scenes.scenes
    .filter((scene) => scene.carriesFactualClaim)
    .map((scene) => scene.id);
  return plan;
};

/** What a project's brand identity resolves to, for reports and review. */
export const brandSummary = (source: PlanSource) => ({
  profile: { id: source.profile.id, version: source.profile.version },
  name: source.profile.brand?.name ?? null,
  audience: source.profile.brand?.audience ?? null,
  cta: source.profile.brand?.cta ?? null,
  roles: source.profile.assets.flatMap((asset) =>
    asset.role ? [{ assetId: asset.id, role: asset.role }] : [],
  ),
  assets: usedAssets(source).map((asset) => ({
    assetId: asset.id,
    binding: asset.binding ?? "unknown",
  })),
  text: boundTexts(source).map((bound) => ({
    layerId: bound.layerId,
    binding: bound.binding,
    text: bound.text,
  })),
});
