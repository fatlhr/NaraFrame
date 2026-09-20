export type ProductionRoute = "prepared-media" | "silent-draft" | "narrated";

export interface ProductionRouteInput {
  hasPreparedAudioAsset: boolean;
  hasNarrationText: boolean;
}

/**
 * A scene/project uses prepared media as-is when a ready audio asset is
 * already supplied, falls back to a silent draft when no narration text
 * exists yet, and otherwise takes the narrated route, which requires a TTS
 * provider call and therefore a ledger reservation.
 */
export const resolveProductionRoute = (
  input: ProductionRouteInput,
): ProductionRoute => {
  if (input.hasPreparedAudioAsset) {
    return "prepared-media";
  }
  if (input.hasNarrationText) {
    return "narrated";
  }
  return "silent-draft";
};
