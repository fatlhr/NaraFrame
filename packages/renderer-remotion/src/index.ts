import { corePackage } from "@naraframe/core";
import { VERSION as remotionVersion } from "remotion";

export const rendererPackage = "@naraframe/renderer-remotion";
export const rendererCorePackage = corePackage;
export const rendererRemotionVersion = remotionVersion;
export type {
  RenderDraftRequest,
  RenderedDraft,
} from "./render-draft.js";
export {
  inspectDraftFrames,
  isVisualPreflightError,
  RENDER_CONCURRENCY,
  renderDraft,
  resolveBrowserExecutable,
  VisualPreflightError,
} from "./render-draft.js";

export { RenderFailure, type RenderStage } from "./render-failure.js";
