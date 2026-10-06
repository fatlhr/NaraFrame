import type { Issue } from "../model/issue.js";
import type { CompiledTextSlot } from "../schema/compiled.js";
import type { ProfileLock } from "../schema/profile.js";
import type { LoadedRecipe, RecipeTextSlot } from "../schema/recipe.js";
import { lookupParam } from "./param-pointer.js";

type Render = ProfileLock["render"];

/**
 * A slot's style resolved against the profile (after overrides). Family uses
 * the renderer's text-layer rule: the role's family, else the display family
 * for display, else the profile family. Weight: slot, then role, then the
 * profile's heading weight for display/heading and body weight otherwise.
 */
export const resolveTextSlotStyle = (
  render: Render,
  slot: RecipeTextSlot,
): CompiledTextSlot["style"] => {
  const typography = render.typography;
  const role = typography.roles?.[slot.role];
  const fontFamily =
    role?.fontFamily ??
    (slot.role === "display" && typography.displayFontFamily
      ? typography.displayFontFamily
      : typography.fontFamily);
  const fontWeight =
    slot.fontWeight ??
    role?.fontWeight ??
    (slot.role === "display" || slot.role === "heading"
      ? typography.headingWeight
      : typography.bodyWeight);
  return {
    fontFamily,
    fontWeight,
    fontSize: slot.fontSize,
    lineHeight: slot.lineHeight,
    letterSpacing: slot.letterSpacing ?? 0,
    width: slot.box.width,
    height: slot.box.height,
    maxLines: slot.maxLines,
    wrap: slot.wrap,
  };
};

const slotIssue = (
  code: string,
  path: string,
  message: string,
  suggestion: string,
  entityId: string,
): Issue => ({
  code,
  severity: "warning",
  responsible: "agent",
  artifact: "scenes.json",
  path,
  message,
  suggestion,
  entityId,
});

/**
 * The declared slots of one recipe scene with their texts. A missing or
 * non-text value is reported and left out of measurement; an array param
 * gives one instance per element, each checked on its own.
 */
export const compileTextSlots = (
  recipe: LoadedRecipe,
  sceneId: string,
  sceneIndex: number,
  params: unknown,
  render: Render,
  issues: Issue[],
): CompiledTextSlot[] | undefined => {
  if (!recipe.textSlots) return undefined;
  const at = (pointer: string) =>
    `/scenes/${sceneIndex}/visual/params${pointer}`;
  return recipe.textSlots.map((slot) => {
    const where = `Recipe ${recipe.id} in scene ${sceneId} measures text slot ${slot.id} at ${slot.param}`;
    const instances: CompiledTextSlot["instances"] = [];
    const found = lookupParam(params, slot.param);
    if (!found.found) {
      issues.push(
        slotIssue(
          "RECIPE_TEXT_SLOT_PATH_MISSING",
          at(slot.param),
          `${where}, but the params have no value there, so it cannot be measured.`,
          `Add the text at ${slot.param} in this scene's params, or correct the slot in recipe.json (which needs trust again).`,
          slot.id,
        ),
      );
    } else if (typeof found.value === "string") {
      instances.push({ pointer: slot.param, text: found.value });
    } else if (Array.isArray(found.value)) {
      found.value.forEach((item, index) => {
        const pointer = `${slot.param}/${index}`;
        if (typeof item === "string") {
          instances.push({ pointer, text: item });
        } else {
          issues.push(
            slotIssue(
              "RECIPE_TEXT_SLOT_TYPE_INVALID",
              at(pointer),
              `${where}, but element ${index} is not text, so it cannot be measured.`,
              `Make every element of ${slot.param} a string.`,
              slot.id,
            ),
          );
        }
      });
    } else {
      issues.push(
        slotIssue(
          "RECIPE_TEXT_SLOT_TYPE_INVALID",
          at(slot.param),
          `${where}, but the value there is neither text nor a list of text, so it cannot be measured.`,
          `Put a string, or an array of strings, at ${slot.param}.`,
          slot.id,
        ),
      );
    }
    return {
      id: slot.id,
      param: slot.param,
      style: resolveTextSlotStyle(render, slot),
      instances,
    };
  });
};

/** What text-fit measurement covers in one recipe scene, as an info issue. */
export const textFitCoverage = (
  recipe: LoadedRecipe,
  sceneId: string,
  sceneIndex: number,
  slots: CompiledTextSlot[] | undefined,
): Issue => {
  const base = {
    code: "RECIPE_TEXT_FIT_COVERAGE",
    severity: "info" as const,
    responsible: "agent" as const,
    artifact: "scenes.json",
    path: `/scenes/${sceneIndex}/visual/params`,
    entityId: sceneId,
  };
  if (!slots || slots.length === 0) {
    return {
      ...base,
      message: `Recipe ${recipe.id} in scene ${sceneId} declares no text slots: text fit is not checked for this recipe.`,
      suggestion:
        "Review recipe text in the preview frames. Declaring textSlots in recipe.json lets preview and render measure it (a code change that needs trust again).",
    };
  }
  const measured = slots
    .map((slot) => `${slot.id} (${slot.instances.length})`)
    .join(", ");
  return {
    ...base,
    message: `Recipe ${recipe.id} in scene ${sceneId}: text slots ${measured} are measured at preview and render in the profile face, in design pixels; each array element is checked on its own, not their combined height. Other recipe text is not measured, and the recipe is trusted code: NaraFrame cannot verify that it draws these slots with props.textSlots.`,
    suggestion:
      "Fit is measured at preview/render, not by validate. Review unmeasured text in the preview frames.",
  };
};
