export const corePackage = "@naraframe/core";

export {
  compileDraft,
  type DraftScope,
} from "./compiler/compile-draft.js";
export { contrastRatio, contrastThresholdFor } from "./compiler/contrast.js";
export {
  type ContrastSample,
  computeReadabilityMetrics,
  computeVarietyMetrics,
  type ReadabilityMetrics,
  type VarietyMetrics,
} from "./compiler/qa-report.js";
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
export { createFakeTtsProvider } from "./production/fake-tts-provider.js";
export {
  computeLedgerTotals,
  escalateReceipt,
  type LedgerTotals,
  latestReceiptsByOperation,
  type ReservationRequest,
  requestReservation,
  retryReceipt,
  type SettlementOutcome,
  settleReceipt,
  settleUnknown,
} from "./production/ledger.js";
export {
  type ProductionRoute,
  type ProductionRouteInput,
  resolveProductionRoute,
} from "./production/route.js";
export {
  type SynthesizeNarrationOutcome,
  type SynthesizeNarrationRequest,
  synthesizeNarration,
} from "./production/synthesize-narration.js";
export type {
  TtsPhrase,
  TtsProvider,
  TtsSynthesisRequest,
  TtsSynthesisResult,
} from "./production/tts-provider.js";
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
  CompiledFont,
  CompiledTransition,
} from "./schema/compiled.js";
export {
  CompiledBeatSchema,
  CompiledDraftSchema,
  CompiledFontSchema,
  CompiledTransitionSchema,
} from "./schema/compiled.js";
export type { PlanSource } from "./schema/export-schema.js";
export { exportSchemas, validatePlanSource } from "./schema/export-schema.js";
export type {
  Money,
  ProductionLedger,
  Receipt,
  ReceiptAuthorization,
  ReceiptStatus,
} from "./schema/production.js";
export {
  MoneySchema,
  ProductionLedgerSchema,
  ReceiptAuthorizationSchema,
  ReceiptSchema,
  ReceiptStatusSchema,
} from "./schema/production.js";
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
  Transition,
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
  TransitionSchema,
  TypographyRoleSchema,
} from "./schema/scene.js";
