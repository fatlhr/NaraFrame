import { describe, expect, it, vi } from "vitest";

// Capture the payload each key is hashed from, so the marker's presence is
// observable without depending on a specific hash value.
vi.mock("../../src/project/hash.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/project/hash.js")>();
  return { ...actual, hashValue: vi.fn(actual.hashValue) };
});

import {
  computeSceneRenderKeys,
  PREFLIGHT_TEXT_RULES,
} from "../../src/compiler/keys.js";
import { hashValue } from "../../src/project/hash.js";
import type { CompiledDraft } from "../../src/schema/compiled.js";

const sceneWith = (
  id: string,
  layers: unknown[],
  startFrame: number,
): CompiledDraft["scenes"][number] =>
  ({
    id,
    startFrame,
    endFrame: startFrame + 30,
    visual: { type: "composition" },
    layers,
    beats: [],
    transitionOut: { type: "cut" },
  }) as unknown as CompiledDraft["scenes"][number];

const draft = {
  width: 540,
  height: 960,
  fps: 30,
  label: "DRAFT",
  assets: {},
  fonts: [],
  profile: { render: {} },
  scenes: [
    sceneWith(
      "with-text",
      [{ type: "text", id: "t", text: "A", opacity: 1 }],
      0,
    ),
    sceneWith("without-text", [{ type: "shape", id: "s", opacity: 1 }], 30),
  ],
} as unknown as Parameters<typeof computeSceneRenderKeys>[0];

describe("preflight text rules identity", () => {
  it("is a versioned string", () => {
    expect(PREFLIGHT_TEXT_RULES).toMatch(/^naraframe-preflight-text\/\d+$/);
  });

  it("enters the key of a scene with text layers, so builds checked under older rules are not reused", () => {
    const hashed = vi.mocked(hashValue);
    hashed.mockClear();
    computeSceneRenderKeys(draft);
    const payloads = hashed.mock.calls.map(
      ([value]) => value as Record<string, unknown>,
    );

    expect(payloads[0]?.preflightTextRules).toBe(PREFLIGHT_TEXT_RULES);
  });

  it("leaves a scene without text layers with its existing key", () => {
    const hashed = vi.mocked(hashValue);
    hashed.mockClear();
    computeSceneRenderKeys(draft);
    const payloads = hashed.mock.calls.map(
      ([value]) => value as Record<string, unknown>,
    );

    expect("preflightTextRules" in (payloads[1] ?? {})).toBe(false);
  });
});
