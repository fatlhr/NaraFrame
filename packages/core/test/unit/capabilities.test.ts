import { capabilityRegistry } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const registry = capabilityRegistry();

/**
 * The registry may advertise a form only if something exercises it. Each entry
 * names where that happens, so adding a form without evidence fails here
 * instead of quietly appearing in the published capability list.
 */
const EVIDENCE: Record<string, string[]> = {
  // recipe: recipe-project (integration) and recipe-production (e2e).
  visuals: ["text", "media", "composition", "recipe"],
  // path: compile-draft-m2-4-3 and path-count-motion.
  layers: ["text", "image", "shape", "path", "group"],
  groupLayouts: ["absolute", "stack", "grid"],
  // motion-transitions, visual-preflight and compile-draft-m0-10 exercise these;
  // draw, follow and count: compile-draft-m2-4-3 and path-count-motion.
  beats: [
    "reveal",
    "exit",
    "emphasize",
    "focus",
    "transform",
    "draw",
    "follow",
    "count",
  ],
  // billboard: path-count-motion and compile-draft-m2-4-3.
  compositionMotion: [
    "billboard",
    "camera-framing",
    "camera-moves",
    "parallax",
    "world-overlay",
  ],
  beatCameras: ["push", "pan", "zoom"],
  transitions: ["cut", "push-through", "mask-reveal", "match-cut"],
  paletteTokens: [
    "palette.background",
    "palette.surface",
    "palette.text",
    "palette.accent",
  ],
  // phrase-anchors: compile-draft-m2-4-3.
  audio: ["narration", "captions", "music", "phrase-anchors", "sfx", "ducking"],
  textEmphasis: ["accent", "strong", "quiet"],
  // audio-modes (e2e) exports music and silent finals; audio-boundaries voice.
  audioModes: ["voice", "music", "silent"],
  // caption-policy (integration/e2e) and caption-preflight exercise each mode.
  captionModes: ["none", "selected", "full"],
  // library integration + manual public inspect/stage/edit/preview evidence.
  library: [
    "local-catalog",
    "pinned-import",
    "explicit-update",
    "scalar-parameters",
    "sibling-anchors",
    "recipe-dependencies-no-trust-transfer",
  ],
  // image-placement unit + library integration + manual native/half previews.
  imageLayout: ["png-source-pixel-metadata", "png-source-pixel-crop"],
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
