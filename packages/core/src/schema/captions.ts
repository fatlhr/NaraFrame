import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  SchemaVersionSchema,
} from "./primitives.js";

export const CaptionModeSchema = z.enum(["none", "selected", "full"]);

export const CaptionSelectionSchema = z
  .object({
    blockId: IdSchema,
    phraseId: IdSchema,
    startOffsetMs: NonNegativeIntegerSchema.optional(),
    endOffsetMs: NonNegativeIntegerSchema.optional(),
  })
  .strict();

export const CaptionCorrectionSchema = z
  .object({
    id: IdSchema,
    blockId: IdSchema,
    phraseId: IdSchema,
    displayText: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

export const CaptionsSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    corrections: z.array(CaptionCorrectionSchema),
    mode: CaptionModeSchema.optional(),
    selections: z.array(CaptionSelectionSchema).optional(),
  })
  .strict()
  .superRefine((captions, context) => {
    const ids = new Set<string>();
    const targets = new Set<string>();
    const selected = new Set<string>();
    captions.selections?.forEach((selection, index) => {
      const target = `${selection.blockId}/${selection.phraseId}`;
      if (selected.has(target))
        context.addIssue({
          code: "custom",
          message: "A phrase may have only one caption selection",
          path: ["selections", index, "phraseId"],
        });
      selected.add(target);
      if (
        selection.endOffsetMs !== undefined &&
        selection.endOffsetMs <= (selection.startOffsetMs ?? 0)
      )
        context.addIssue({
          code: "custom",
          message: "endOffsetMs must be greater than startOffsetMs",
          path: ["selections", index, "endOffsetMs"],
        });
    });
    captions.corrections.forEach((correction, index) => {
      if (ids.has(correction.id)) {
        context.addIssue({
          code: "custom",
          message: "Correction IDs must be unique",
          path: ["corrections", index, "id"],
        });
      }
      ids.add(correction.id);
      const target = `${correction.blockId}/${correction.phraseId}`;
      if (targets.has(target)) {
        context.addIssue({
          code: "custom",
          message: "A phrase may have only one display correction",
          path: ["corrections", index, "phraseId"],
        });
      }
      targets.add(target);
    });
  });

export type CaptionCorrection = z.infer<typeof CaptionCorrectionSchema>;
export type Captions = z.infer<typeof CaptionsSchema>;
export type CaptionMode = z.infer<typeof CaptionModeSchema>;
