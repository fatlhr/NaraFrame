import { resolveProductionRoute } from "@naraframe/core";
import { describe, expect, it } from "vitest";

describe("resolveProductionRoute", () => {
  it("prefers prepared media whenever a ready audio asset is supplied", () => {
    expect(
      resolveProductionRoute({
        hasPreparedAudioAsset: true,
        hasNarrationText: true,
      }),
    ).toBe("prepared-media");
    expect(
      resolveProductionRoute({
        hasPreparedAudioAsset: true,
        hasNarrationText: false,
      }),
    ).toBe("prepared-media");
  });

  it("falls back to a silent draft when there is no narration text", () => {
    expect(
      resolveProductionRoute({
        hasPreparedAudioAsset: false,
        hasNarrationText: false,
      }),
    ).toBe("silent-draft");
  });

  it("takes the narrated route when text exists but no audio is prepared", () => {
    expect(
      resolveProductionRoute({
        hasPreparedAudioAsset: false,
        hasNarrationText: true,
      }),
    ).toBe("narrated");
  });
});
