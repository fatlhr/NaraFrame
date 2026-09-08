import { corePackage } from "@naraframe/core";

export const rendererPackage = "@naraframe/renderer-remotion";
export const rendererCorePackage = corePackage;
export type {
  RenderDraftRequest,
  RenderedDraft,
} from "./render-draft.js";
export { renderDraft } from "./render-draft.js";
