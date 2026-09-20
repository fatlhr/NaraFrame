import { randomUUID } from "node:crypto";
import type { Issue, Result } from "../model/issue.js";
import type {
  Money,
  ProductionLedger,
  Receipt,
  ReceiptAuthorization,
} from "../schema/production.js";

const ARTIFACT = "production.json";

const issue = (
  code: string,
  message: string,
  suggestion: string,
  entityId?: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: ARTIFACT,
  path: "/receipts",
  message,
  suggestion,
  ...(entityId ? { entityId } : {}),
});

export interface LedgerTotals {
  currency: string;
  spent: number;
  reserved: number;
  unknown: number;
  available: number;
}

/**
 * Receipts are append-only and versioned per operationId; only the highest
 * version for a given operation reflects its current state.
 */
export const latestReceiptsByOperation = (
  receipts: readonly Receipt[],
): Receipt[] => {
  const latest = new Map<string, Receipt>();
  for (const receipt of receipts) {
    const current = latest.get(receipt.operationId);
    if (!current || receipt.version > current.version) {
      latest.set(receipt.operationId, receipt);
    }
  }
  return [...latest.values()];
};

export const computeLedgerTotals = (ledger: ProductionLedger): LedgerTotals => {
  let spent = 0;
  let reserved = 0;
  let unknown = 0;

  for (const receipt of latestReceiptsByOperation(ledger.receipts)) {
    if (receipt.status === "succeeded" && receipt.actual) {
      spent += receipt.actual.amount;
    } else if (receipt.status === "reserved") {
      reserved += receipt.reservation.amount;
    } else if (receipt.status === "unknown") {
      // A timed-out request may have already charged the provider; keep it
      // held against the budget until it resolves to a known actual cost.
      unknown += receipt.reservation.amount;
    }
    // "failed" and "escalated" hold nothing: their reservation is released.
  }

  return {
    currency: ledger.budget.currency,
    spent,
    reserved,
    unknown,
    available: ledger.budget.amount - spent - reserved - unknown,
  };
};

export interface ReservationRequest {
  operationId: string;
  requestKey: string;
  operation: string;
  provider: string;
  authorization: ReceiptAuthorization;
  estimate: Money;
}

export const requestReservation = (
  ledger: ProductionLedger,
  request: ReservationRequest,
  now: () => string = () => new Date().toISOString(),
): Result<Receipt> => {
  if (request.estimate.currency !== ledger.budget.currency) {
    return {
      ok: false,
      issues: [
        issue(
          "CURRENCY_MISMATCH",
          `Estimate currency ${request.estimate.currency} does not match the ledger's budget currency ${ledger.budget.currency}.`,
          "Convert the estimate to the ledger's budget currency before reserving.",
          request.operationId,
        ),
      ],
    };
  }

  const existing = latestReceiptsByOperation(ledger.receipts).find(
    (receipt) => receipt.operationId === request.operationId,
  );
  if (existing) {
    return {
      ok: false,
      issues: [
        issue(
          "OPERATION_ALREADY_EXISTS",
          `Operation ${request.operationId} already has a receipt at status "${existing.status}".`,
          "Use retryReceipt or settleReceipt for an existing operation instead of requesting a new reservation.",
          request.operationId,
        ),
      ],
    };
  }

  const totals = computeLedgerTotals(ledger);
  if (request.estimate.amount > totals.available) {
    return {
      ok: false,
      issues: [
        issue(
          "BUDGET_EXCEEDED",
          `Reserving ${request.estimate.amount} ${request.estimate.currency} would exceed the ${totals.available} ${totals.currency} still available (budget ${ledger.budget.amount}, spent ${totals.spent}, reserved ${totals.reserved}, unknown ${totals.unknown}).`,
          "Lower the estimate, settle or write off pending receipts, or raise the budget before retrying.",
          request.operationId,
        ),
      ],
    };
  }

  const timestamp = now();
  const receipt: Receipt = {
    id: randomUUID(),
    operationId: request.operationId,
    version: 1,
    requestKey: request.requestKey,
    operation: request.operation,
    provider: request.provider,
    authorization: request.authorization,
    estimate: request.estimate,
    reservation: request.estimate,
    status: "reserved",
    attempt: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return { ok: true, value: receipt, issues: [] };
};

export type SettlementOutcome =
  | { status: "succeeded"; actual: Money }
  | { status: "failed" }
  | { status: "unknown" };

const findLatest = (
  ledger: ProductionLedger,
  operationId: string,
): Receipt | undefined =>
  latestReceiptsByOperation(ledger.receipts).find(
    (receipt) => receipt.operationId === operationId,
  );

const versionAfter = (
  prior: Receipt,
  now: () => string,
  overrides: Partial<Receipt>,
): Receipt => ({
  ...prior,
  ...overrides,
  id: randomUUID(),
  version: prior.version + 1,
  updatedAt: now(),
});

export const settleReceipt = (
  ledger: ProductionLedger,
  operationId: string,
  outcome: SettlementOutcome,
  now: () => string = () => new Date().toISOString(),
): Result<Receipt> => {
  const prior = findLatest(ledger, operationId);
  if (!prior) {
    return {
      ok: false,
      issues: [
        issue(
          "OPERATION_NOT_FOUND",
          `No receipt exists for operation ${operationId}.`,
          "Request a reservation before settling it.",
          operationId,
        ),
      ],
    };
  }
  if (prior.status !== "reserved") {
    return {
      ok: false,
      issues: [
        issue(
          "RECEIPT_NOT_PENDING",
          `Operation ${operationId} is at status "${prior.status}", not "reserved".`,
          "Only a reserved receipt can be settled.",
          operationId,
        ),
      ],
    };
  }
  if (
    outcome.status === "succeeded" &&
    outcome.actual.currency !== ledger.budget.currency
  ) {
    return {
      ok: false,
      issues: [
        issue(
          "CURRENCY_MISMATCH",
          `Actual cost currency ${outcome.actual.currency} does not match the ledger's budget currency ${ledger.budget.currency}.`,
          "Convert the actual cost to the ledger's budget currency before settling.",
          operationId,
        ),
      ],
    };
  }

  const receipt = versionAfter(prior, now, {
    status: outcome.status,
    actual: outcome.status === "succeeded" ? outcome.actual : undefined,
  });

  return { ok: true, value: receipt, issues: [] };
};

export const settleUnknown = (
  ledger: ProductionLedger,
  operationId: string,
  actual: Money,
  now: () => string = () => new Date().toISOString(),
): Result<Receipt> => {
  const prior = findLatest(ledger, operationId);
  if (!prior) {
    return {
      ok: false,
      issues: [
        issue(
          "OPERATION_NOT_FOUND",
          `No receipt exists for operation ${operationId}.`,
          "Request a reservation before resolving it.",
          operationId,
        ),
      ],
    };
  }
  if (prior.status !== "unknown") {
    return {
      ok: false,
      issues: [
        issue(
          "RECEIPT_NOT_UNKNOWN",
          `Operation ${operationId} is at status "${prior.status}", not "unknown".`,
          "Only an unknown receipt can be resolved to a confirmed actual cost.",
          operationId,
        ),
      ],
    };
  }
  if (actual.currency !== ledger.budget.currency) {
    return {
      ok: false,
      issues: [
        issue(
          "CURRENCY_MISMATCH",
          `Actual cost currency ${actual.currency} does not match the ledger's budget currency ${ledger.budget.currency}.`,
          "Convert the actual cost to the ledger's budget currency before resolving.",
          operationId,
        ),
      ],
    };
  }

  const receipt = versionAfter(prior, now, {
    status: "succeeded",
    actual,
  });

  return { ok: true, value: receipt, issues: [] };
};

export const retryReceipt = (
  ledger: ProductionLedger,
  operationId: string,
  request: { authorization: ReceiptAuthorization; estimate: Money },
  now: () => string = () => new Date().toISOString(),
): Result<Receipt> => {
  const prior = findLatest(ledger, operationId);
  if (!prior) {
    return {
      ok: false,
      issues: [
        issue(
          "OPERATION_NOT_FOUND",
          `No receipt exists for operation ${operationId}.`,
          "Request a reservation before retrying it.",
          operationId,
        ),
      ],
    };
  }
  if (prior.status === "unknown") {
    return {
      ok: false,
      issues: [
        issue(
          "RECEIPT_NOT_RETRYABLE",
          `Operation ${operationId} timed out with an unknown outcome; it must not be blindly resent.`,
          "Resolve the actual cost with settleUnknown once it is known, instead of retrying.",
          operationId,
        ),
      ],
    };
  }
  if (prior.status !== "failed") {
    return {
      ok: false,
      issues: [
        issue(
          "RECEIPT_NOT_RETRYABLE",
          `Operation ${operationId} is at status "${prior.status}", not "failed".`,
          "Only a failed receipt can be retried.",
          operationId,
        ),
      ],
    };
  }
  if (prior.attempt >= 2) {
    return {
      ok: false,
      issues: [
        issue(
          "ATTEMPT_LIMIT_REACHED",
          `Operation ${operationId} has already used its two allowed attempts.`,
          "Escalate the receipt for a human decision instead of retrying again.",
          operationId,
        ),
      ],
    };
  }
  if (request.estimate.currency !== ledger.budget.currency) {
    return {
      ok: false,
      issues: [
        issue(
          "CURRENCY_MISMATCH",
          `Estimate currency ${request.estimate.currency} does not match the ledger's budget currency ${ledger.budget.currency}.`,
          "Convert the estimate to the ledger's budget currency before retrying.",
          operationId,
        ),
      ],
    };
  }

  const totals = computeLedgerTotals(ledger);
  if (request.estimate.amount > totals.available) {
    return {
      ok: false,
      issues: [
        issue(
          "BUDGET_EXCEEDED",
          `Retrying with ${request.estimate.amount} ${request.estimate.currency} would exceed the ${totals.available} ${totals.currency} still available.`,
          "Lower the estimate or raise the budget before retrying.",
          operationId,
        ),
      ],
    };
  }

  const receipt = versionAfter(prior, now, {
    status: "reserved",
    authorization: request.authorization,
    estimate: request.estimate,
    reservation: request.estimate,
    actual: undefined,
    attempt: prior.attempt + 1,
  });

  return { ok: true, value: receipt, issues: [] };
};

export const escalateReceipt = (
  ledger: ProductionLedger,
  operationId: string,
  authorization: ReceiptAuthorization,
  now: () => string = () => new Date().toISOString(),
): Result<Receipt> => {
  const prior = findLatest(ledger, operationId);
  if (!prior) {
    return {
      ok: false,
      issues: [
        issue(
          "OPERATION_NOT_FOUND",
          `No receipt exists for operation ${operationId}.`,
          "Request a reservation before escalating it.",
          operationId,
        ),
      ],
    };
  }
  if (prior.status !== "failed" || prior.attempt < 2) {
    return {
      ok: false,
      issues: [
        issue(
          "ESCALATION_NOT_APPLICABLE",
          `Operation ${operationId} is at status "${prior.status}" with attempt ${prior.attempt}; escalation only applies after both attempts fail.`,
          "Retry the receipt if an attempt remains, or settle/resolve it if it is still pending.",
          operationId,
        ),
      ],
    };
  }

  const receipt = versionAfter(prior, now, {
    status: "escalated",
    authorization,
  });

  return { ok: true, value: receipt, issues: [] };
};
