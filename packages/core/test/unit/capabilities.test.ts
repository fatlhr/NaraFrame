import { capabilityRegistry } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const registry = capabilityRegistry();

/**
 * The registry may advertise a form only if something exercises it. Each entry
 * names where that happens, so adding a form without evidence fails here
 * instead of quietly appearing in the published capability list.
 */
const EVIDENCE: Record<string, string[]> = {
  visuals: ["text", "media", "composition"],
  layers: ["text", "image", "shape", "group"],
  groupLayouts: ["absolute", "stack", "grid"],
  beats: ["reveal", "emphasize", "focus"],
  beatCameras: ["push", "pan", "zoom"],
  transitions: ["cut", "push-through", "mask-reveal", "match-cut"],
  paletteTokens: [
    "palette.background",
    "palette.surface",
    "palette.text",
    "palette.accent",
  ],
  audio: ["narration", "captions", "music", "sfx", "ducking"],
  textEmphasis: ["accent", "strong", "quiet"],
};

describe("capability registry", () => {
  it.each(Object.keys(EVIDENCE))(
    "advertises exactly the %s that are implemented",
    (key) => {
      const advertised = registry[key as keyof typeof registry] as string[];
      expect([...advertised].sort()).toEqual([...(EVIDENCE[key] ?? [])].sort());
    },
  );

  it("advertises only the media the asset schema accepts", () => {
    expect(registry.media).toEqual({
      images: ["png"],
      vectors: ["svg"],
      audio: ["m4a", "mp3", "wav"],
      fonts: ["ttf", "otf", "woff2"],
    });
  });

  it("never advertises a form it also lists as unsupported", () => {
    const advertised = new Set([
      ...registry.visuals,
      ...registry.layers,
      ...registry.media.images,
      ...registry.media.vectors,
      ...registry.media.audio,
      ...registry.media.fonts,
    ]);
    for (const entry of registry.unsupported) {
      expect(advertised.has(entry.name)).toBe(false);
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  });

  it("keeps video out until its decode test exists", () => {
    const names = registry.unsupported.map((entry) => entry.name);
    expect(names).toContain("video-asset");
    // SVG left this list in M2.4.1, once import, sanitising and render existed.
    expect(names).not.toContain("svg");
  });
});
