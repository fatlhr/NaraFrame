import { hashValue } from "../project/hash.js";
import type { NarrationBlock } from "../schema/narration.js";

/** Local timing plus measured master duration; visual trailing hold is excluded. */
export const preparedTimingHash = (
  block: Pick<
    Extract<NarrationBlock, { audioAssetId: string }>,
    "audioDurationMs" | "phrases"
  >,
): string =>
  hashValue({ audioDurationMs: block.audioDurationMs, phrases: block.phrases });
