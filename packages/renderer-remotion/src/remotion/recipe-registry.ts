import type { CompiledDraft } from "@naraframe/core";
import type { ComponentType } from "react";

/** What a trusted recipe receives. It draws at 1080×1920 design pixels. */
export interface RecipeProps {
  params: Record<string, unknown>;
  /** PNGs named by `assetId` in the params, with a URL and real pixel size. */
  assets: Record<string, { src: string; width: number; height: number }>;
  profile: CompiledDraft["profile"]["render"];
  fps: number;
  durationInFrames: number;
}

const registry = new Map<string, ComponentType<RecipeProps>>();

/**
 * Called by the per-render wrapper entry with the project's trusted recipe
 * modules. Nothing else registers code here.
 */
export const registerRecipes = (
  recipes: Record<string, { default: ComponentType<RecipeProps> }>,
): void => {
  for (const [id, module] of Object.entries(recipes)) {
    registry.set(id, module.default);
  }
};

export const getRecipe = (id: string): ComponentType<RecipeProps> | null =>
  registry.get(id) ?? null;
