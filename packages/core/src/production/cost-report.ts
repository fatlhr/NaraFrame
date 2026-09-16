import type { ProductionLedger, Receipt } from "../schema/production.js";
import { computeLedgerTotals, latestReceiptsByOperation } from "./ledger.js";

export interface CostReport {
  currency: string;
  budget: number;
  estimated: number;
  actual: number;
  unknown: number;
  reserved: number;
  available: number;
  receipts: Receipt[];
}

/**
 * Derives a cost report straight from the ledger's own receipts: estimated
 * is the sum of every current receipt's estimate, actual is confirmed
 * spend, and unknown is kept separate rather than folded into either total.
 */
export const computeCostReport = (ledger: ProductionLedger): CostReport => {
  const totals = computeLedgerTotals(ledger);
  const receipts = latestReceiptsByOperation(ledger.receipts).sort((a, b) =>
    a.operationId.localeCompare(b.operationId),
  );
  const estimated = receipts.reduce(
    (sum, receipt) => sum + receipt.estimate.amount,
    0,
  );

  return {
    currency: totals.currency,
    budget: ledger.budget.amount,
    estimated,
    actual: totals.spent,
    unknown: totals.unknown,
    reserved: totals.reserved,
    available: totals.available,
    receipts,
  };
};
