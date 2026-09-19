import { z } from "zod";
import { IdSchema, SchemaVersionSchema } from "./primitives.js";

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
  })
  .strict()
  .superRefine((captions, context) => {
    const ids = new Set<string>();
    const targets = new Set<string>();
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
