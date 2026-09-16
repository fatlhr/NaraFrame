import { z } from "zod";
import { IdSchema, SchemaVersionSchema } from "./primitives.js";

export const MoneySchema = z
  .object({
    amount: z.number().finite().nonnegative(),
    currency: z.string().trim().min(1).max(8),
  })
  .strict();
export type Money = z.infer<typeof MoneySchema>;

export const ReceiptAuthorizationSchema = z
  .object({
    grantedBy: z.string().trim().min(1),
    grantedAt: z.string().datetime(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();
export type ReceiptAuthorization = z.infer<typeof ReceiptAuthorizationSchema>;

export const ReceiptStatusSchema = z.enum([
  "reserved",
  "succeeded",
  "failed",
  "unknown",
  "escalated",
]);
export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;

export const ReceiptSchema = z
  .object({
    id: IdSchema,
    operationId: IdSchema,
    version: z.number().int().min(1),
    requestKey: z.string().trim().min(1),
    operation: z.string().trim().min(1),
    provider: z.string().trim().min(1),
    authorization: ReceiptAuthorizationSchema,
    estimate: MoneySchema,
    reservation: MoneySchema,
    actual: MoneySchema.optional(),
    status: ReceiptStatusSchema,
    attempt: z.number().int().min(1).max(2),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((receipt, ctx) => {
    if (receipt.status === "succeeded" && !receipt.actual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A succeeded receipt must record its actual cost.",
        path: ["actual"],
      });
    }
    if (receipt.status !== "succeeded" && receipt.actual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only a succeeded receipt may record an actual cost.",
        path: ["actual"],
      });
    }
  });
export type Receipt = z.infer<typeof ReceiptSchema>;

export const ProductionLedgerSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    budget: MoneySchema,
    receipts: z.array(ReceiptSchema),
  })
  .strict();
export type ProductionLedger = z.infer<typeof ProductionLedgerSchema>;
