export const corePackage = "@naraframe/core";

export {
  compileDraft,
  type DraftScope,
} from "./compiler/compile-draft.js";
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
export {
  type CreatedProject,
  type CreateProjectOptions,
  createProject,
} from "./project/create-project.js";
export type { Asset, AssetManifest } from "./schema/asset.js";
export {
  AssetManifestSchema,
  AssetSchema,
} from "./schema/asset.js";
export type {
  CompiledAsset,
  CompiledBeat,
  CompiledDraft,
} from "./schema/compiled.js";
export {
  CompiledBeatSchema,
  CompiledDraftSchema,
} from "./schema/compiled.js";
export type { PlanSource } from "./schema/export-schema.js";
export { exportSchemas, validatePlanSource } from "./schema/export-schema.js";
export type {
  LockedProfileAsset,
  ProfileLock,
  ProfileSource,
  RenderTokens,
} from "./schema/profile.js";
export {
  LockedProfileAssetSchema,
  ProfileLockSchema,
  ProfileSourceSchema,
  RenderTokensSchema,
} from "./schema/profile.js";
export type { ProjectConfig } from "./schema/project.js";
export { ProjectConfigSchema } from "./schema/project.js";
export type {
  Beat,
  FocalPoint,
  Frame,
  Insets,
  Layer,
  Scene,
  Scenes,
  SceneVisual,
  Shadow,
  Stroke,
  TypographyRole,
} from "./schema/scene.js";
export {
  BeatSchema,
  FocalPointSchema,
  FrameSchema,
  InsetsSchema,
  LayerSchema,
  SceneSchema,
  ScenesSchema,
  SceneVisualSchema,
  ShadowSchema,
  StrokeSchema,
  TypographyRoleSchema,
} from "./schema/scene.js";
