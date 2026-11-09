import type { Beat, Layer, PlanSource, Scene } from "@naraframe/core";
import { compileDraft } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const presentation = { opacity: 1, rotationDeg: 0, zIndex: 1 } as const;

const card: Extract<Layer, { type: "shape" }> = {
  id: "card",
  type: "shape",
  shape: "rectangle",
  fill: "#FFFFFF",
  frame: { x: 100, y: 600, width: 880, height: 400 },
  ...presentation,
};

const price: Extract<Layer, { type: "text" }> = {
  id: "price",
  type: "text",
  text: "Rp 25.000",
  color: "#FFFFFF",
  frame: { x: 160, y: 700, width: 760, height: 160 },
  ...presentation,
  zIndex: 2,
};

const scene = (beats: Beat[]): Scene => ({
  id: "price-card",
  narrativeRole: "context",
  durationMs: 4000,
  visual: { type: "composition", layers: [card, price] },
  beats,
  transition: { type: "cut" },
});

const silentSource = (scenes: Scene[]): PlanSource => {
  const source = narratedSource({ scenes });
  const { narration: _narration, ...rest } = source;
  return rest;
};

const reveal = (id: string, startMs: number, targetId = "card"): Beat => ({
  id,
  targetId,
  action: "reveal",
  startMs,
  durationMs: 300,
  params: { direction: "up", distance: 24 },
});

const exit = (id: string, startMs: number, targetId = "card"): Beat => ({
  id,
  targetId,
  action: "exit",
  startMs,
  durationMs: 300,
  params: {},
});

describe("visibility sequence (S1)", () => {
  it("accepts a card revealed, exited and revealed again", () => {
    const result = compileDraft(
      silentSource([
        scene([reveal("in", 0), exit("out", 1000), reveal("again", 2000)]),
      ]),
    );
    if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
    const beats = result.value.scenes[0]?.beats ?? [];
    expect(beats.map((beat) => [beat.id, beat.startFrame])).toEqual([
      ["in", 0],
      ["out", 30],
      ["again", 60],
    ]);
  });

  it("warns about two reveals of one layer that overlap, and names the frames", () => {
    // Existing projects overlap reveals, so this compiles with a warning.
    const result = compileDraft(
      silentSource([scene([reveal("in", 0), reveal("again", 200)])]),
    );
    expect(result.ok).toBe(true);
    const issue = result.issues.find(
      (item) => item.code === "VISIBILITY_OVERLAP",
    );
    expect(issue?.severity).toBe("warning");
    expect(issue?.path).toBe("/scenes/0/beats/1");
    expect(issue?.message).toContain("again");
    expect(issue?.message).toContain("in");
    expect(issue?.suggestion).toContain("frame 9");
  });

  it("allows reveals of different layers at the same time", () => {
    const result = compileDraft(
      silentSource([
        scene([reveal("card-in", 0), reveal("price-in", 0, "price")]),
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("does not judge contrast against a backdrop that shows more than once", () => {
    const shown = compileDraft(
      silentSource([
        scene([reveal("in", 0), reveal("price-in", 400, "price")]),
      ]),
    );
    if (!shown.ok) throw new Error(shown.issues.map((i) => i.code).join());
    // White on a white card that stays up is measured, and fails.
    expect(shown.issues.map((i) => i.code)).toContain("CONTRAST_INSUFFICIENT");

    const reshown = compileDraft(
      silentSource([
        scene([
          reveal("in", 0),
          exit("out", 1000),
          reveal("again", 2000),
          reveal("price-in", 2400, "price"),
        ]),
      ]),
    );
    if (!reshown.ok) throw new Error(reshown.issues.map((i) => i.code).join());
    const unverified = reshown.issues.find(
      (item) => item.code === "CONTRAST_UNVERIFIED",
    );
    expect(unverified?.message).toContain("shows and hides more than once");
    expect(reshown.issues.map((i) => i.code)).not.toContain(
      "CONTRAST_INSUFFICIENT",
    );
  });

  it("still measures a panel that shows and hides with its text in one group", () => {
    const group: Extract<Layer, { type: "group" }> = {
      id: "price-card",
      type: "group",
      memberIds: ["card", "price"],
      transform: { x: 0, y: 0, scale: 1, rotationDeg: 0, opacity: 1 },
      zIndex: 1,
    };
    const grouped: Scene = {
      ...scene([
        reveal("in", 0, "price-card"),
        exit("out", 1000, "price-card"),
        reveal("again", 2000, "price-card"),
      ]),
      visual: { type: "composition", layers: [group, card, price] },
    };
    const result = compileDraft(silentSource([grouped]));
    if (!result.ok) throw new Error(result.issues.map((i) => i.code).join());
    // White on the white card, measured against the card itself.
    const insufficient = result.issues.find(
      (item) => item.code === "CONTRAST_INSUFFICIENT",
    );
    expect(insufficient?.message).toContain("against panel card");
  });
});
