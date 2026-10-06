import { referencedAssetIds } from "../compiler/keys.js";
import type { Issue } from "../model/issue.js";
import { lookupParam, pointerSegment } from "../recipe/param-pointer.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { ProfileLock } from "../schema/profile.js";
import type { RecipeBindingField } from "../schema/recipe.js";

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

/** The profile value a recipe binding field names, if the profile has one. */
const profileFieldValue = (
  profile: Pick<ProfileLock, "brand" | "render">,
  field: RecipeBindingField,
): string | undefined => {
  if (field.startsWith("brand.")) {
    return brandValue(profile, field as TextBinding);
  }
  const slot = field.slice(
    "render.palette.".length,
  ) as keyof ProfileLock["render"]["palette"];
  return profile.render.palette[slot];
};

/** Colours compare without regard to hex case; text compares exactly. */
const sameValue = (field: RecipeBindingField, a: string, b: string): boolean =>
  field.startsWith("render.palette.")
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;

interface RecipeParamBinding {
  sceneId: string;
  recipe: string;
  param: string;
  field: RecipeBindingField;
  /** scenes.json location of the bound value. */
  path: string;
  state: "ok" | "missing" | "invalid-type";
  value: string | null;
}

/** Every declared identity param of every recipe scene, resolved. */
const recipeParamBindings = (source: PlanSource): RecipeParamBinding[] =>
  source.scenes.scenes.flatMap((scene, sceneIndex) => {
    if (scene.visual.type !== "recipe") return [];
    const visual = scene.visual;
    const recipe = source.recipes?.find((item) => item.id === visual.recipe);
    return (recipe?.bindings ?? []).map((binding) => {
      const found = lookupParam(visual.params, binding.param);
      const base = {
        sceneId: scene.id,
        recipe: visual.recipe,
        param: binding.param,
        field: binding.field,
        path: `/scenes/${sceneIndex}/visual/params${binding.param}`,
      };
      if (!found.found)
        return { ...base, state: "missing" as const, value: null };
      if (typeof found.value !== "string") {
        return { ...base, state: "invalid-type" as const, value: null };
      }
      return { ...base, state: "ok" as const, value: found.value };
    });
  });

/**
 * Text params a recipe scene carries that no binding covers. They are not
 * brand-checked; reporting them keeps the coverage honest. Keys are escaped,
 * so a literal key such as "brand/name" never matches the bound path
 * /brand/name.
 */
const uncheckedParams = (params: unknown, bound: Set<string>): string[] => {
  const out: string[] = [];
  const walk = (value: unknown, pointer: string): void => {
    if (bound.has(pointer)) return;
    if (typeof value === "string") {
      out.push(pointer);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${pointer}/${index}`);
      });
    } else if (value !== null && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (key !== "assetId")
          walk(nested, `${pointer}/${pointerSegment(key)}`);
      }
    }
  };
  walk(params, "");
  return out;
};

export interface RecipeCoverage {
  sceneId: string;
  recipe: string;
  /** Identity params the recipe declares and NaraFrame compares. */
  declared: number;
  /** Text params no binding covers: not brand-checked. */
  unchecked: string[];
}

const recipeCoverage = (source: PlanSource): RecipeCoverage[] =>
  source.scenes.scenes.flatMap((scene) => {
    if (scene.visual.type !== "recipe") return [];
    const visual = scene.visual;
    const recipe = source.recipes?.find((item) => item.id === visual.recipe);
    if (!recipe) return [];
    const bindings = recipe.bindings ?? [];
    return [
      {
        sceneId: scene.id,
        recipe: recipe.id,
        declared: bindings.length,
        unchecked: uncheckedParams(
          visual.params,
          new Set(bindings.map((binding) => binding.param)),
        ),
      },
    ];
  });

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
  for (const bound of recipeParamBindings(source)) {
    const where = `Recipe ${bound.recipe} in scene ${bound.sceneId} binds params ${bound.param} to ${bound.field}`;
    if (bound.state === "missing") {
      issues.push(
        bindingIssue(
          "RECIPE_BINDING_PATH_MISSING",
          "scenes.json",
          bound.path,
          `${where}, but the params have no value there.`,
          `Add the value at ${bound.param} in this scene's params, or correct the binding in recipe.json (which needs trust again).`,
          bound.sceneId,
        ),
      );
      continue;
    }
    if (bound.state === "invalid-type") {
      issues.push(
        bindingIssue(
          "RECIPE_BINDING_TYPE_INVALID",
          "scenes.json",
          bound.path,
          `${where}, but the value there is not text.`,
          `Put the ${bound.field} value at ${bound.param} as a string.`,
          bound.sceneId,
        ),
      );
      continue;
    }
    const expected = profileFieldValue(profile, bound.field);
    if (expected === undefined) {
      issues.push(
        bindingIssue(
          "BRAND_FIELD_MISSING",
          "scenes.json",
          bound.path,
          `${where}, which profile ${profile.id} does not define.`,
          `Add ${bound.field} to the profile, or remove the binding from recipe.json (which needs trust again).`,
          bound.sceneId,
        ),
      );
    } else if (
      bound.value !== null &&
      !sameValue(bound.field, bound.value, expected)
    ) {
      issues.push(
        bindingIssue(
          "RECIPE_BINDING_MISMATCH",
          "scenes.json",
          bound.path,
          `${where} and reads "${bound.value}"; profile ${profile.id} says "${expected}".`,
          "Change the param to the profile value through an edit, after checking the copy still fits and is true for this brand.",
          bound.sceneId,
        ),
      );
    }
  }
  // Coverage, not a defect: says what the recipe checks and what it does not.
  if (profile.brand || source.recipes?.some((recipe) => recipe.bindings)) {
    for (const coverage of recipeCoverage(source)) {
      const sample = coverage.unchecked.slice(0, 5).join(", ");
      issues.push({
        ...bindingIssue(
          "RECIPE_BINDING_COVERAGE",
          "scenes.json",
          `/scenes/${source.scenes.scenes.findIndex((scene) => scene.id === coverage.sceneId)}/visual/params`,
          `Recipe ${coverage.recipe} in scene ${coverage.sceneId}: ${coverage.declared} identity param(s) are compared with profile ${profile.id}; ${coverage.unchecked.length} other text param(s) are not covered by a binding and are not brand-checked${sample ? ` (${sample}${coverage.unchecked.length > 5 ? ", …" : ""})` : ""}.`,
          "Review uncovered params by eye before a brand switch. Params that carry brand identity belong in recipe.json bindings, which needs the owner's trust again.",
          coverage.sceneId,
        ),
        severity: "info",
      });
    }
  }
  return issues;
};

export interface RecipeParamPlan {
  sceneId: string;
  recipe: string;
  param: string;
  field: RecipeBindingField;
  current: string | null;
  target: string | null;
  /**
   * unchanged/changes compare current with the target profile; missing,
   * invalid-type and field-missing name a binding that cannot be checked.
   */
  state: "unchanged" | "changes" | "missing" | "invalid-type" | "field-missing";
}

export interface BrandBindingPlan {
  /** Bound to the target brand itself: brand identity that stays valid. */
  compatible: Array<{ assetId: string; role: string | null }>;
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
  /** Declared identity params in recipe scenes, current and target values. */
  recipeParams: RecipeParamPlan[];
  /** Per recipe scene: declared bindings and uncovered text params. */
  recipeCoverage: RecipeCoverage[];
}

/** How the project's brand-bound content fares under another profile. */
export const planBrandBindings = (
  source: PlanSource,
  target: ProfileLock,
  /** The target with the project's surviving overrides applied (palette). */
  targetProfile: Pick<ProfileLock, "brand" | "render"> = target,
): BrandBindingPlan => {
  const plan: BrandBindingPlan = {
    compatible: [],
    branded: [],
    incompatible: [],
    neutral: [],
    unknown: [],
    text: [],
    claims: [],
    recipeParams: [],
    recipeCoverage: recipeCoverage(source),
  };
  for (const asset of usedAssets(source)) {
    const binding = asset.binding;
    if (binding === "neutral") {
      plan.neutral.push(asset.id);
    } else if (!binding) {
      plan.unknown.push(asset.id);
    } else if (binding.brand === target.id) {
      // Brand identity that matches the target is compatible, not neutral:
      // only an explicit "neutral" binding means any brand may use it.
      plan.compatible.push({ assetId: asset.id, role: binding.role ?? null });
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
  for (const bound of recipeParamBindings(source)) {
    const target = profileFieldValue(targetProfile, bound.field) ?? null;
    const state: RecipeParamPlan["state"] =
      bound.state !== "ok"
        ? bound.state
        : target === null
          ? "field-missing"
          : bound.value !== null && sameValue(bound.field, bound.value, target)
            ? "unchanged"
            : "changes";
    plan.recipeParams.push({
      sceneId: bound.sceneId,
      recipe: bound.recipe,
      param: bound.param,
      field: bound.field,
      current: bound.value,
      target,
      state,
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
  recipes: recipeCoverage(source).map((coverage) => ({
    ...coverage,
    bindings: recipeParamBindings(source)
      .filter((bound) => bound.sceneId === coverage.sceneId)
      .map((bound) => {
        const expected = profileFieldValue(source.profile, bound.field) ?? null;
        return {
          param: bound.param,
          field: bound.field,
          value: bound.value,
          matches:
            bound.value !== null &&
            expected !== null &&
            sameValue(bound.field, bound.value, expected),
        };
      }),
  })),
});
