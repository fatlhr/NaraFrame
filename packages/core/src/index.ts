export const corePackage = "@naraframe/core";

export { compileDraft } from "./compiler/compile-draft.js";
export {
  type LoadedPlanProject,
  loadPlanProject,
} from "./io/load-project.js";

export type {
  Issue,
  IssueResponsible,
  IssueSeverity,
  Result,
} from "./model/issue.js";
export type { Asset, AssetManifest } from "./schema/asset.js";
export {
  AssetManifestSchema,
  AssetSchema,
} from "./schema/asset.js";
export type { CompiledAsset, CompiledDraft } from "./schema/compiled.js";
export { CompiledDraftSchema } from "./schema/compiled.js";
export type { PlanSource } from "./schema/export-schema.js";
export { exportSchemas, validatePlanSource } from "./schema/export-schema.js";
export type { ProfileLock, RenderTokens } from "./schema/profile.js";
export { ProfileLockSchema, RenderTokensSchema } from "./schema/profile.js";
export type { ProjectConfig } from "./schema/project.js";
export { ProjectConfigSchema } from "./schema/project.js";
export type {
  Beat,
  Frame,
  Layer,
  Scene,
  Scenes,
  SceneVisual,
} from "./schema/scene.js";
export {
  BeatSchema,
  FrameSchema,
  LayerSchema,
  SceneSchema,
  ScenesSchema,
  SceneVisualSchema,
} from "./schema/scene.js";
