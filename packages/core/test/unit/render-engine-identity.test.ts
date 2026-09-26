import type { PlanSource } from "@naraframe/core";
import { generationKeyForBlock, RENDER_ENGINE } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const sourceWith = (render: Partial<Record<string, unknown>>): PlanSource =>
  ({
    profile: {
      production: { voiceStyleSignature: "probe-voice" },
      render,
    },
  }) as unknown as PlanSource;

describe("render engine identity", () => {
  it("is a versioned string that a renderer change is expected to move", () => {
    expect(RENDER_ENGINE).toMatch(/^naraframe-draft\/\d+$/);
  });

  it("does not reach voice generation keys, so a renderer bump cannot bill a retake", () => {
    const block = { id: "opening", text: "Selat Sunda tidak pernah diam." };
    // Two projects that differ in everything the renderer cares about.
    const first = generationKeyForBlock(
      sourceWith({ palette: { accent: "#FF5A36" }, engine: RENDER_ENGINE }),
      block as never,
    );
    const second = generationKeyForBlock(
      sourceWith({
        palette: { accent: "#0B7A75" },
        engine: "naraframe-draft/99",
      }),
      block as never,
    );
    expect(second).toBe(first);
  });

  it("changes a voice key only when the spoken text or the voice style changes", () => {
    const base = sourceWith({});
    const key = (text: string) =>
      generationKeyForBlock(base, { id: "b", text } as never);
    expect(key("Halo dunia.")).toBe(key("Halo dunia."));
    expect(key("Halo dunia.")).not.toBe(key("Halo dunia!"));
  });
});
