import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  Sha256Schema,
} from "./primitives.js";

export const PreparedWordSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    startMs: NonNegativeIntegerSchema,
    endMs: NonNegativeIntegerSchema,
  })
  .strict();
export const PreparedPhraseSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    startMs: NonNegativeIntegerSchema,
    endMs: NonNegativeIntegerSchema,
    words: z.array(PreparedWordSchema).optional(),
  })
  .strict();
export const PreparedVerificationSchema = z.union([
  z.object({ state: z.literal("pending") }).strict(),
  z
    .object({
      state: z.literal("verified"),
      method: z.literal("listening"),
      reviewer: z.string().trim().min(1),
      verifiedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
]);
const provenance = {
  schemaVersion: z.literal(1),
  units: z.literal("milliseconds"),
  audioSha256: Sha256Schema,
  alignment: z
    .object({
      method: z.string().trim().min(1),
      source: z.string().trim().min(1),
    })
    .strict(),
  uncertainties: z.array(z.string().trim().min(1)),
  verification: PreparedVerificationSchema,
};
export const PreparedAudioReceiptSchema = z
  .object({
    ...provenance,
    textSha256: Sha256Schema,
    timingSha256: Sha256Schema,
    audioDurationMs: z.number().int().positive(),
  })
  .strict();
export const PreparedTimingPackageSchema = z
  .object({
    ...provenance,
    text: z.string().trim().min(1),
    phrases: z.array(PreparedPhraseSchema).min(1),
    pauseAfterMs: NonNegativeIntegerSchema,
    voiceStyleSignature: z.string().trim().min(1).optional(),
    license: z.string().trim().min(1).optional(),
  })
  .strict();
export type PreparedAudioReceipt = z.infer<typeof PreparedAudioReceiptSchema>;
export type PreparedTimingPackage = z.infer<typeof PreparedTimingPackageSchema>;
