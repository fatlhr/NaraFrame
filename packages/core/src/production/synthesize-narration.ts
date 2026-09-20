import type { Result } from "../model/issue.js";
import type {
  ProductionLedger,
  Receipt,
  ReceiptAuthorization,
} from "../schema/production.js";
import { requestReservation, settleReceipt } from "./ledger.js";
import type {
  TtsProvider,
  TtsSynthesisRequest,
  TtsSynthesisResult,
} from "./tts-provider.js";

export interface SynthesizeNarrationRequest {
  operationId: string;
  requestKey: string;
  authorization: ReceiptAuthorization;
  tts: TtsSynthesisRequest;
}

export interface SynthesizeNarrationOutcome {
  ledger: ProductionLedger;
  receipt: Receipt;
  result?: TtsSynthesisResult;
}

/**
 * One sequential reserve-call-settle cycle for a single narration request.
 * No concurrency and no generic billing service: the ledger is reserved
 * before the provider call and settled with its outcome immediately after,
 * so a crash between the two leaves a "reserved" receipt an operator can
 * inspect rather than a silent, unaccounted-for spend.
 */
export const synthesizeNarration = async (
  ledger: ProductionLedger,
  provider: TtsProvider,
  request: SynthesizeNarrationRequest,
  now: () => string = () => new Date().toISOString(),
): Promise<Result<SynthesizeNarrationOutcome>> => {
  const reservation = requestReservation(
    ledger,
    {
      operationId: request.operationId,
      requestKey: request.requestKey,
      operation: "tts.synthesize",
      provider: provider.id,
      authorization: request.authorization,
      estimate: provider.estimate(request.tts),
    },
    now,
  );
  if (!reservation.ok) {
    return reservation;
  }

  const reservedLedger: ProductionLedger = {
    ...ledger,
    receipts: [...ledger.receipts, reservation.value],
  };

  let synthesis: TtsSynthesisResult;
  try {
    synthesis = await provider.synthesize(request.tts);
  } catch {
    const failed = settleReceipt(
      reservedLedger,
      request.operationId,
      { status: "failed" },
      now,
    );
    if (!failed.ok) {
      return failed;
    }
    return {
      ok: true,
      value: {
        ledger: {
          ...reservedLedger,
          receipts: [...reservedLedger.receipts, failed.value],
        },
        receipt: failed.value,
      },
      issues: [],
    };
  }

  const settled = settleReceipt(
    reservedLedger,
    request.operationId,
    { status: "succeeded", actual: synthesis.cost },
    now,
  );
  if (!settled.ok) {
    return settled;
  }

  return {
    ok: true,
    value: {
      ledger: {
        ...reservedLedger,
        receipts: [...reservedLedger.receipts, settled.value],
      },
      receipt: settled.value,
      result: synthesis,
    },
    issues: [],
  };
};
