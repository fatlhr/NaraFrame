import type { ProductionLedger } from "@naraframe/core";
import {
  computeLedgerTotals,
  escalateReceipt,
  latestReceiptsByOperation,
  requestReservation,
  retryReceipt,
  settleReceipt,
  settleUnknown,
} from "@naraframe/core";
import { describe, expect, it } from "vitest";

const auth = (note = "test") => ({
  grantedBy: "fatih",
  grantedAt: "2026-09-16T00:00:00.000Z",
  note,
});

const money = (amount: number, currency = "IDR") => ({ amount, currency });

const emptyLedger = (budget = 100): ProductionLedger => ({
  schemaVersion: 1,
  budget: money(budget),
  receipts: [],
});

const clock = () => "2026-09-16T00:00:00.000Z";

describe("requestReservation", () => {
  it("creates a version-1 reserved receipt within budget", () => {
    const result = requestReservation(
      emptyLedger(),
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

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("reserved");
    expect(result.value.version).toBe(1);
    expect(result.value.attempt).toBe(1);
    expect(result.value.reservation).toEqual(money(40));
  });

  it("denies a reservation that would exceed the available budget", () => {
    let ledger = emptyLedger(100);
    const first = requestReservation(
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
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    ledger = { ...ledger, receipts: [first.value] };

    const settled = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(40) },
      clock,
    );
    expect(settled.ok).toBe(true);
    if (!settled.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, settled.value] };

    const second = requestReservation(
      ledger,
      {
        operationId: "scene-2",
        requestKey: "req-2",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(40),
      },
      clock,
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, second.value] };

    const totals = computeLedgerTotals(ledger);
    expect(totals).toEqual({
      currency: "IDR",
      spent: 40,
      reserved: 40,
      unknown: 0,
      available: 20,
    });

    const denied = requestReservation(
      ledger,
      {
        operationId: "scene-3",
        requestKey: "req-3",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(30),
      },
      clock,
    );
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.issues[0]?.code).toBe("BUDGET_EXCEEDED");
  });

  it("rejects a currency that does not match the ledger's budget", () => {
    const result = requestReservation(
      emptyLedger(),
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10, "USD"),
      },
      clock,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("CURRENCY_MISMATCH");
  });

  it("refuses a second reservation for an operationId that already has one", () => {
    let ledger = emptyLedger();
    const first = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    ledger = { ...ledger, receipts: [first.value] };

    const again = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1b",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.issues[0]?.code).toBe("OPERATION_ALREADY_EXISTS");
  });
});

describe("settleReceipt", () => {
  it("moves a reserved receipt to succeeded with its actual cost", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };

    const settled = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(9) },
      clock,
    );
    expect(settled.ok).toBe(true);
    if (!settled.ok) return;
    expect(settled.value.status).toBe("succeeded");
    expect(settled.value.version).toBe(2);
    expect(settled.value.actual).toEqual(money(9));
  });

  it("moves a timed-out request to unknown and keeps it held against the budget", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
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
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };

    const timedOut = settleReceipt(
      ledger,
      "scene-1",
      { status: "unknown" },
      clock,
    );
    expect(timedOut.ok).toBe(true);
    if (!timedOut.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, timedOut.value] };

    const totals = computeLedgerTotals(ledger);
    expect(totals.unknown).toBe(40);
    expect(totals.reserved).toBe(0);
    expect(totals.available).toBe(60);
  });

  it("refuses to settle a receipt that is not pending", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };
    const settled = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(10) },
      clock,
    );
    expect(settled.ok).toBe(true);
    if (!settled.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, settled.value] };

    const again = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(10) },
      clock,
    );
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.issues[0]?.code).toBe("RECEIPT_NOT_PENDING");
  });

  it("reports OPERATION_NOT_FOUND for an unknown operationId", () => {
    const result = settleReceipt(
      emptyLedger(),
      "missing",
      { status: "failed" },
      clock,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("OPERATION_NOT_FOUND");
  });
});

describe("settleUnknown", () => {
  it("resolves an unknown receipt to succeeded once the actual cost is confirmed", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
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
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };
    const timedOut = settleReceipt(
      ledger,
      "scene-1",
      { status: "unknown" },
      clock,
    );
    expect(timedOut.ok).toBe(true);
    if (!timedOut.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, timedOut.value] };

    const resolved = settleUnknown(ledger, "scene-1", money(35), clock);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.status).toBe("succeeded");
    expect(resolved.value.actual).toEqual(money(35));
    ledger = { ...ledger, receipts: [...ledger.receipts, resolved.value] };

    expect(computeLedgerTotals(ledger)).toEqual({
      currency: "IDR",
      spent: 35,
      reserved: 0,
      unknown: 0,
      available: 65,
    });
  });

  it("refuses to resolve a receipt that is not unknown", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };

    const result = settleUnknown(ledger, "scene-1", money(10), clock);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("RECEIPT_NOT_UNKNOWN");
  });
});

describe("retryReceipt", () => {
  const failedOnceLedger = (): ProductionLedger => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-9",
        requestKey: "req-9",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    if (!reserved.ok) throw new Error("setup failed");
    ledger = { ...ledger, receipts: [reserved.value] };
    const failed = settleReceipt(
      ledger,
      "scene-9",
      { status: "failed" },
      clock,
    );
    if (!failed.ok) throw new Error("setup failed");
    return { ...ledger, receipts: [...ledger.receipts, failed.value] };
  };

  it("allows the first retry (attempt 2) after a failure", () => {
    const ledger = failedOnceLedger();
    const retried = retryReceipt(
      ledger,
      "scene-9",
      { authorization: auth("retry"), estimate: money(10) },
      clock,
    );
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    expect(retried.value.attempt).toBe(2);
    expect(retried.value.status).toBe("reserved");
  });

  it("refuses a third attempt and requires escalation instead", () => {
    let ledger = failedOnceLedger();
    const retried = retryReceipt(
      ledger,
      "scene-9",
      { authorization: auth("retry"), estimate: money(10) },
      clock,
    );
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, retried.value] };
    const failedAgain = settleReceipt(
      ledger,
      "scene-9",
      { status: "failed" },
      clock,
    );
    expect(failedAgain.ok).toBe(true);
    if (!failedAgain.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, failedAgain.value] };

    const thirdAttempt = retryReceipt(
      ledger,
      "scene-9",
      { authorization: auth("retry again"), estimate: money(10) },
      clock,
    );
    expect(thirdAttempt.ok).toBe(false);
    if (thirdAttempt.ok) return;
    expect(thirdAttempt.issues[0]?.code).toBe("ATTEMPT_LIMIT_REACHED");

    const escalated = escalateReceipt(
      ledger,
      "scene-9",
      auth("escalate"),
      clock,
    );
    expect(escalated.ok).toBe(true);
    if (!escalated.ok) return;
    expect(escalated.value.status).toBe("escalated");
    ledger = { ...ledger, receipts: [...ledger.receipts, escalated.value] };

    expect(ledger.receipts.map((receipt) => receipt.version)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("refuses to retry an unknown receipt instead of blindly resending it", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };
    const timedOut = settleReceipt(
      ledger,
      "scene-1",
      { status: "unknown" },
      clock,
    );
    expect(timedOut.ok).toBe(true);
    if (!timedOut.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, timedOut.value] };

    const retried = retryReceipt(
      ledger,
      "scene-1",
      { authorization: auth("retry"), estimate: money(10) },
      clock,
    );
    expect(retried.ok).toBe(false);
    if (retried.ok) return;
    expect(retried.issues[0]?.code).toBe("RECEIPT_NOT_RETRYABLE");
  });
});

describe("escalateReceipt", () => {
  it("refuses to escalate before both attempts have failed", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };

    const result = escalateReceipt(ledger, "scene-1", auth("too early"), clock);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("ESCALATION_NOT_APPLICABLE");
  });
});

describe("latestReceiptsByOperation", () => {
  it("keeps only the highest version per operationId", () => {
    let ledger = emptyLedger();
    const reserved = requestReservation(
      ledger,
      {
        operationId: "scene-1",
        requestKey: "req-1",
        operation: "tts.synthesize",
        provider: "fake",
        authorization: auth(),
        estimate: money(10),
      },
      clock,
    );
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    ledger = { ...ledger, receipts: [reserved.value] };
    const settled = settleReceipt(
      ledger,
      "scene-1",
      { status: "succeeded", actual: money(10) },
      clock,
    );
    expect(settled.ok).toBe(true);
    if (!settled.ok) return;
    ledger = { ...ledger, receipts: [...ledger.receipts, settled.value] };

    const latest = latestReceiptsByOperation(ledger.receipts);
    expect(latest).toHaveLength(1);
    expect(latest[0]?.version).toBe(2);
    expect(ledger.receipts).toHaveLength(2);
  });
});
