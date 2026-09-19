import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedScene, narratedSource } from "./narrated-source.js";

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

describe("compileDraft with narration", () => {
  it("derives scene frame ranges from the narration clock, ignoring scene durationMs", () => {
    const result = compileDraft(narratedSource());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.scenes.map((s) => [s.startFrame, s.endFrame])).toEqual([
      [0, 36],
      [36, 81],
      [81, 135],
    ]);
    // 2400 + 300 + 1800 = 4500 ms at 30 fps.
    expect(result.value.totalFrames).toBe(135);
    expect(result.value.narration?.totalDurationMs).toBe(4500);
  });

  it("emits one audio clip per ready block at its resolved start", () => {
    const result = compileDraft(narratedSource());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.narration?.clips).toEqual([
      {
        blockId: "context",
        assetId: "voice-context",
        startMs: 0,
        durationMs: 2400,
        startFrame: 0,
        durationInFrames: 72,
      },
      {
        blockId: "mechanism",
        assetId: "voice-mechanism",
        startMs: 2700,
        durationMs: 1800,
        startFrame: 81,
        durationInFrames: 54,
      },
    ]);
  });

  it("moves later clips and scenes when only an earlier clip changes, leaving other blocks' audio untouched", () => {
    const before = compileDraft(narratedSource());
    const after = compileDraft(
      narratedSource({
        contextDurationMs: 3000,
        contextAsset: { id: "voice-context-v2", sha256: "c".repeat(64) },
      }),
    );
    if (!before.ok || !after.ok) throw new Error("expected both to compile");
    const mechanismBefore = before.value.narration?.clips[1];
    const mechanismAfter = after.value.narration?.clips[1];
    // Same asset and duration; only the global offset moved (2700 -> 3300 ms).
    expect(mechanismAfter?.assetId).toBe(mechanismBefore?.assetId);
    expect(mechanismAfter?.durationMs).toBe(mechanismBefore?.durationMs);
    expect(mechanismBefore?.startMs).toBe(2700);
    expect(mechanismAfter?.startMs).toBe(3300);
    expect(after.value.totalFrames).toBe(153);
  });

  it("requires every scene to reference narration once narration.json exists", () => {
    const result = compileDraft(
      narratedSource({
        scenes: [
          narratedScene("s1", { blockId: "context" }),
          narratedScene("s2"),
          narratedScene("s3", { blockId: "mechanism" }),
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("SCENE_NARRATION_MISSING");
  });

  it("reports TIMELINE_INCOMPLETE while a block is still planned", () => {
    const result = compileDraft(
      narratedSource({
        blocks: [
          { id: "context", text: "Belum ada audio." },
          {
            id: "mechanism",
            text: "Siap.",
            audioAssetId: "voice-mechanism",
            audioDurationMs: 1800,
            pauseAfterMs: 0,
            phrases: [{ id: "m1", text: "Siap.", startMs: 100, endMs: 1700 }],
          },
        ],
        scenes: [
          narratedScene("s1", { blockId: "context" }),
          narratedScene("s2", { blockId: "mechanism" }),
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("TIMELINE_INCOMPLETE");
  });

  it("rejects a scene that does not follow phrase order", () => {
    const result = compileDraft(
      narratedSource({
        scenes: [
          narratedScene("s1", { blockId: "context", phraseId: "c2" }),
          narratedScene("s2", { blockId: "context", phraseId: "c1" }),
          narratedScene("s3", { blockId: "mechanism" }),
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("SCENE_PHRASE_ORDER");
  });

  it("blocks on SOURCE_MISSING only when the profile requires sourcing", () => {
    const blocks = [
      {
        id: "context",
        text: "Klaim.",
        carriesFactualClaim: true,
        audioAssetId: "voice-context",
        audioDurationMs: 2400,
        pauseAfterMs: 300,
        phrases: [{ id: "c1", text: "Klaim.", startMs: 100, endMs: 2200 }],
      },
      {
        id: "mechanism",
        text: "Ok.",
        audioAssetId: "voice-mechanism",
        audioDurationMs: 1800,
        pauseAfterMs: 0,
        phrases: [{ id: "m1", text: "Ok.", startMs: 100, endMs: 1700 }],
      },
    ];
    const scenes = [
      narratedScene("s1", { blockId: "context" }),
      narratedScene("s2", { blockId: "mechanism" }),
    ];
    const required = compileDraft(
      narratedSource({ blocks, scenes, requireSourcing: true }),
    );
    expect(required.ok).toBe(false);
    if (!required.ok)
      expect(codes(required.issues)).toContain("SOURCE_MISSING");

    const optional = compileDraft(narratedSource({ blocks, scenes }));
    expect(optional.ok).toBe(true);
    if (optional.ok) {
      expect(
        optional.issues.find((i) => i.code === "SOURCE_MISSING")?.severity,
      ).toBe("warning");
    }
  });
});

describe("compileDraft captions", () => {
  it("compiles one cue per phrase with frame ranges and default style scaled to the draft", () => {
    const result = compileDraft(narratedSource());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.captions?.style).toEqual({
      fontSize: 22,
      maxLines: 2,
      bottom: 12,
      side: 24,
    });
    expect(result.value.captions?.cues).toEqual([
      {
        id: "context/c1",
        text: "Krakatau memiliki sejarah.",
        startFrame: 3,
        endFrame: 30,
      },
      {
        id: "context/c2",
        text: "Erupsinya panjang.",
        startFrame: 36,
        endFrame: 66,
      },
      {
        id: "mechanism/m1",
        text: "Tekanan magma meningkat.",
        startFrame: 84,
        endFrame: 132,
      },
    ]);
  });

  it("uses the profile's caption style and adds the safe zone", () => {
    const result = compileDraft(
      narratedSource({
        captionStyle: { fontSize: 60, maxLines: 3, bottomOffset: 100 },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.captions?.style).toMatchObject({
      fontSize: 30,
      maxLines: 3,
      bottom: 50,
    });
  });

  it("shows an attributed display correction while leaving the spoken text alone", () => {
    const result = compileDraft(
      narratedSource({
        captions: {
          schemaVersion: 1,
          corrections: [
            {
              id: "fix1",
              blockId: "context",
              phraseId: "c2",
              displayText: "Erupsinya sangat panjang.",
              reason: "clearer wording",
            },
          ],
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.captions?.cues[1]?.text).toBe(
      "Erupsinya sangat panjang.",
    );
  });

  it("rejects a correction that targets no phrase", () => {
    const result = compileDraft(
      narratedSource({
        captions: {
          schemaVersion: 1,
          corrections: [
            {
              id: "x",
              blockId: "context",
              phraseId: "zz",
              displayText: "a",
              reason: "r",
            },
          ],
        },
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("CAPTION_CORRECTION_TARGET_UNKNOWN");
  });

  it("emits no captions without narration, or for a scene-scoped preview", () => {
    const { narration: _omit, ...silent } = narratedSource({
      scenes: [narratedScene("s1")],
    });
    const withoutNarration = compileDraft(silent);
    expect(withoutNarration.ok).toBe(true);
    if (withoutNarration.ok)
      expect(withoutNarration.value.captions).toBeUndefined();

    const scoped = compileDraft(narratedSource(), {
      type: "scene",
      sceneId: "s2",
    });
    expect(scoped.ok).toBe(true);
    if (scoped.ok) expect(scoped.value.captions).toBeUndefined();
  });
});

describe("compileDraft draft label", () => {
  it("says the draft has audio only when narration clips are compiled", () => {
    const narrated = compileDraft(narratedSource());
    expect(narrated.ok).toBe(true);
    if (narrated.ok) expect(narrated.value.label).toBe("DRAFT • WITH AUDIO");

    const { narration: _omit, ...silent } = narratedSource({
      scenes: [narratedScene("s1")],
    });
    const silentResult = compileDraft(silent);
    expect(silentResult.ok).toBe(true);
    if (silentResult.ok)
      expect(silentResult.value.label).toBe("DRAFT • NO AUDIO");
  });
});
