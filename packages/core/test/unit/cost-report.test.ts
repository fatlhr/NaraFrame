import type { ProductionLedger } from "@naraframe/core";
import {
  computeCostReport,
  requestReservation,
  settleReceipt,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";

const auth = () => ({
  grantedBy: "fatih",
  grantedAt: "2026-09-16T00:00:00.000Z",
});
const money = (amount: number) => ({ amount, currency: "IDR" });
const clock = () => "2026-09-16T00:00:00.000Z";

describe("computeCostReport", () => {
  it("keeps unknown spend visibly separate from actual, and sums estimates across receipts", () => {
    let ledger: ProductionLedger = {
      schemaVersion: 1,
      budget: money(100),
      receipts: [],
    };

    const r1 = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(40),
      },
      clock,
    );
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    ledger = { ...ledger, receipts: [r1.value] };
    const s1 = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(35) },
      clock,
    );
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, s1.value] };

    const r2 = requestReservation(
      ledger,
      {
        operationId: "scene-2",
        requestKey: "req-2",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(20),
      },
      clock,
    );
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, r2.value] };
    const t2 = settleReceipt(ledger, "scene-2", { status: "unknown" }, clock);
    expect(t2.ok).toBe(true);
    if (!t2.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, t2.value] };

    const report = computeCostReport(ledger);

    expect(report).toEqual({
      currency: "IDR",
      budget: 100,
      estimated: 60,
      actual: 35,
      unknown: 20,
      reserved: 0,
      available: 45,
      receipts: report.receipts,
    });
    expect(report.receipts.map((receipt) => receipt.operationId)).toEqual([
      "scene-1",
      "scene-2",
    ]);
  });

  it("reports an all-zero report for a ledger with no receipts", () => {
    const ledger: ProductionLedger = {
      schemaVersion: 1,
      budget: money(100),
      receipts: [],
    };

    expect(computeCostReport(ledger)).toEqual({
      currency: "IDR",
      budget: 100,
      estimated: 0,
      actual: 0,
      unknown: 0,
      reserved: 0,
      available: 100,
      receipts: [],
    });
  });
});
