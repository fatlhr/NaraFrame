import type { ProductionLedger, TtsProvider } from "@naraframe/core";
import { createFakeTtsProvider, synthesizeNarration } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const auth = () => ({
  grantedBy: "fatih",
  grantedAt: "2026-09-16T00:00:00.000Z",
  note: "test",
});

const emptyLedger = (): ProductionLedger => ({
  schemaVersion: 1,
  budget: { amount: 100_000, currency: "IDR" },
  receipts: [],
});

const clock = () => "2026-09-16T00:00:00.000Z";

describe("synthesizeNarration", () => {
  it("reserves, calls the provider, and settles a succeeded receipt with the actual cost", async () => {
    const provider = createFakeTtsProvider();
    const outcome = await synthesizeNarration(
      emptyLedger(),
      provider,
      {
        operationId: "krakatau-hook-narration",
        requestKey: "req-1",
        authorization: auth(),
        tts: {
          text: "Krakatau meletus pada tahun 1883.",
          languageCode: "id-ID",
          voiceId: "id-fake-voice-1",
        },
      },
      clock,
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.receipt.status).toBe("succeeded");
    expect(outcome.value.receipt.version).toBe(2);
    expect(outcome.value.result?.phrases.length).toBeGreaterThan(0);
    expect(outcome.value.ledger.receipts).toHaveLength(2);
  });

  it("propagates a ledger-level denial (e.g. budget exceeded) without calling the provider", async () => {
    const provider = createFakeTtsProvider();
    const tightLedger: ProductionLedger = {
      schemaVersion: 1,
      budget: { amount: 1, currency: "IDR" },
      receipts: [],
    };

    const outcome = await synthesizeNarration(
      tightLedger,
      provider,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        authorization: auth(),
        tts: {
          text: "Teks yang cukup panjang untuk melebihi anggaran satu rupiah.",
          languageCode: "id-ID",
          voiceId: "id-fake-voice-1",
        },
      },
      clock,
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.issues[0]?.code).toBe("BUDGET_EXCEEDED");
  });

  it("settles a receipt as failed when the provider throws, without losing the reservation", async () => {
    const failingProvider: TtsProvider = {
      id: "failing",
      estimate: () => ({ amount: 10, currency: "IDR" }),
      synthesize: () => {
        throw new Error("simulated provider outage");
      },
    };

    const outcome = await synthesizeNarration(
      emptyLedger(),
      failingProvider,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        authorization: auth(),
        tts: { text: "Halo dunia.", languageCode: "id-ID", voiceId: "voice-1" },
      },
      clock,
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.receipt.status).toBe("failed");
    expect(outcome.value.result).toBeUndefined();
    // The reservation (v1) and the failure (v2) both survive in the ledger.
    expect(outcome.value.ledger.receipts).toHaveLength(2);
  });
});
