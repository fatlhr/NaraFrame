export const corePackage = "@naraframe/core";

export {
  type SanitizedSvg,
  sanitizeSvg,
} from "./asset/svg-sanitize.js";
export {
  type CapabilityRegistry,
  capabilityRegistry,
} from "./capabilities.js";
export {
  type AudioModeSource,
  checkAudioModeConflicts,
  checkFinalAudioMode,
  type ResolvedAudioMode,
  resolveAudioMode,
} from "./compiler/audio-mode.js";
export { type CaptionCue, deriveCaptionCues } from "./compiler/captions.js";
export {
  type CompileOptions,
  compileDraft,
  type DraftResolution,
  type DraftScope,
} from "./compiler/compile-draft.js";
export { contrastRatio, contrastThresholdFor } from "./compiler/contrast.js";
export {
  computeAssemblyKey,
  computeSceneRenderKeys,
  generationKeyForBlock,
  RENDER_ENGINE,
  type SceneRenderKey,
} from "./compiler/keys.js";
export {
  type ResolvedBlock,
  type ResolvedNarrationTimeline,
  type ResolvedPhrase,
  resolveNarrationTimeline,
} from "./compiler/narration-timeline.js";
export {
  checkProductionReadiness,
  computeSceneClosure,
  outOfScopeGaps,
  type ProductionScope,
  type SceneClosure,
} from "./compiler/production.js";
export {
  checkProvenance,
  checkSourceProvenance,
} from "./compiler/provenance.js";
export {
  type ContrastSample,
  computeReadabilityMetrics,
  computeVarietyMetrics,
  type ReadabilityMetrics,
  type VarietyMetrics,
} from "./compiler/qa-report.js";
export {
  type PartitionedScene,
  partitionScenes,
  type SceneNarrationRef,
} from "./compiler/scene-partition.js";
export {
  compileSoundtrack,
  MASKING_LIMIT,
} from "./compiler/soundtrack.js";
export {
  checkVoiceBindings,
  narrationTextHash,
} from "./compiler/voice-binding.js";
export { type CountFormat, formatCount } from "./count-format.js";
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
export { dedupeIssues } from "./model/issue.js";
export {
  type CostReport,
  computeCostReport,
} from "./production/cost-report.js";
export { createFakeTtsProvider } from "./production/fake-tts-provider.js";
export {
  type PendingGeneration,
  pendingGeneration,
} from "./production/generation-plan.js";
export {
  type ImportAudioOptions,
  type ImportedAudio,
  type ImportedPhrase,
  importPreparedAudio,
} from "./production/import-audio.js";
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
export { readProductionLedger } from "./production/ledger-io.js";
export {
  type ProductionRoute,
  type ProductionRouteInput,
  resolveProductionRoute,
} from "./production/route.js";
export {
  createSayTtsProvider,
  type SayTtsProviderOptions,
} from "./production/say-tts-provider.js";
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
  applyProfile,
  type OverrideConflict,
  type ProfileApplyOptions,
  type ProfileApplyPlan,
  type ProfileApplyResult,
  type ProfileChange,
  type ProfileEffect,
  planProfileApply,
} from "./profile/apply.js";
export {
  type BrandBindingPlan,
  brandSummary,
  checkBrandBindings,
  planBrandBindings,
} from "./profile/brand-bindings.js";
export {
  type BuiltProfileLock,
  buildProfileLock,
  type CreatedProject,
  type CreateProjectOptions,
  createProject,
} from "./project/create-project.js";
export {
  pngSize,
  RECIPE_ALLOWED_MODULES,
  recipeCodeHash,
  scanRecipeCode,
} from "./recipe/load-recipes.js";
export { resolveTextSlotStyle } from "./recipe/text-slots.js";
export {
  type Approval,
  ApprovalSchema,
  readApprovals,
  recordApproval,
} from "./revision/approval.js";
export {
  type SyncResult,
  type SyncStatus,
  syncWorkingCopy,
} from "./revision/capture.js";
export {
  type EditOptions,
  type EditResult,
  editProject,
} from "./revision/edit.js";
export { withProjectLock } from "./revision/lock.js";
export {
  checkRecipeTrust,
  type RecipeTrust,
  RecipeTrustSchema,
  readRecipeTrust,
  recordRecipeTrust,
} from "./revision/recipe-trust.js";
export {
  type CostSide,
  computeReuse,
  type ReuseCounts,
  type ReuseReport,
} from "./revision/reuse.js";
export { type RevisionState, readRevisionState } from "./revision/state.js";
export { writePreviewSelection } from "./revision/store.js";
export { type UndoResult, undoProject } from "./revision/undo.js";
export type { Asset, AssetManifest } from "./schema/asset.js";
export {
  AssetManifestSchema,
  AssetSchema,
} from "./schema/asset.js";
export type { CaptionCorrection, Captions } from "./schema/captions.js";
export {
  CaptionCorrectionSchema,
  CaptionsSchema,
} from "./schema/captions.js";
export type {
  CompiledAsset,
  CompiledBeat,
  CompiledCaptions,
  CompiledDraft,
  CompiledFont,
  CompiledTextSlot,
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
  Narration,
  NarrationBlock,
  NarrationSource,
} from "./schema/narration.js";
export { NarrationBlockSchema, NarrationSchema } from "./schema/narration.js";
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
export {
  type LoadedRecipe,
  type RecipeManifest,
  RecipeManifestSchema,
} from "./schema/recipe.js";
export type {
  Beat,
  FocalPoint,
  Frame,
  Insets,
  Layer,
  Scene,
  SceneNarration,
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
  SceneNarrationSchema,
  SceneSchema,
  ScenesSchema,
  SceneVisualSchema,
  ShadowSchema,
  StrokeSchema,
  TransitionSchema,
  TypographyRoleSchema,
} from "./schema/scene.js";
export {
  type MusicTrack,
  type Soundtrack,
  SoundtrackSchema,
} from "./schema/soundtrack.js";
export type { Source } from "./schema/source.js";
export { SourceSchema } from "./schema/source.js";
