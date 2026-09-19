import { z } from "zod";
import {
  IdSchema,
  NonNegativeIntegerSchema,
  SchemaVersionSchema,
} from "./primitives.js";

const WordSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    startMs: NonNegativeIntegerSchema,
    endMs: NonNegativeIntegerSchema,
  })
  .strict();

const PhraseSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    startMs: NonNegativeIntegerSchema,
    endMs: NonNegativeIntegerSchema,
    words: z.array(WordSchema).optional(),
  })
  .strict();

const SourceSchema = z
  .object({
    id: IdSchema,
    title: z.string().trim().min(1),
    url: z.string().trim().min(1).optional(),
    retrievedAt: z.string().date().optional(),
  })
  .strict();

const provenanceFields = {
  carriesFactualClaim: z.boolean().optional(),
  sourceIds: z.array(IdSchema).optional(),
};

const ReadyBlockSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    audioAssetId: IdSchema,
    audioDurationMs: z.number().int().positive(),
    pauseAfterMs: NonNegativeIntegerSchema,
    phrases: z.array(PhraseSchema).min(1),
    ...provenanceFields,
  })
  .strict();

const PlannedBlockSchema = z
  .object({
    id: IdSchema,
    text: z.string().trim().min(1),
    ...provenanceFields,
  })
  .strict();

export const NarrationBlockSchema = z.union([
  ReadyBlockSchema,
  PlannedBlockSchema,
]);

export const NarrationSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    order: z.array(IdSchema),
    sources: z.array(SourceSchema).optional(),
    blocks: z.array(NarrationBlockSchema),
  })
  .strict()
  .superRefine((narration, context) => {
    const blockIds = new Set<string>();
    narration.blocks.forEach((block, blockIndex) => {
      if (blockIds.has(block.id)) {
        context.addIssue({
          code: "custom",
          message: "Block IDs must be unique",
          path: ["blocks", blockIndex, "id"],
        });
      }
      blockIds.add(block.id);

      if (!("phrases" in block)) {
        return;
      }

      const phraseIds = new Set<string>();
      let previousEnd = 0;
      block.phrases.forEach((phrase, phraseIndex) => {
        const path = ["blocks", blockIndex, "phrases", phraseIndex];
        if (phraseIds.has(phrase.id)) {
          context.addIssue({
            code: "custom",
            message: "Phrase IDs must be unique within a block",
            path: [...path, "id"],
          });
        }
        phraseIds.add(phrase.id);

        if (phrase.endMs <= phrase.startMs) {
          context.addIssue({
            code: "custom",
            message: "Phrase endMs must be greater than startMs",
            path: [...path, "endMs"],
          });
        }
        if (phrase.startMs < previousEnd) {
          context.addIssue({
            code: "custom",
            message: "Phrases must be ordered and must not overlap",
            path: [...path, "startMs"],
          });
        }
        if (phrase.endMs > block.audioDurationMs) {
          context.addIssue({
            code: "custom",
            message: "Phrase must end within the block's audioDurationMs",
            path: [...path, "endMs"],
          });
        }
        previousEnd = Math.max(previousEnd, phrase.endMs);
      });
    });

    const ordered = new Set<string>();
    narration.order.forEach((id, orderIndex) => {
      if (ordered.has(id)) {
        context.addIssue({
          code: "custom",
          message: "Block order must not repeat an ID",
          path: ["order", orderIndex],
        });
      }
      ordered.add(id);
      if (!blockIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: "Block order references an unknown block ID",
          path: ["order", orderIndex],
        });
      }
    });
    for (const id of blockIds) {
      if (!ordered.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Block ${id} is missing from order`,
          path: ["order"],
        });
      }
    }
  });

export type NarrationSource = z.infer<typeof SourceSchema>;
export type NarrationBlock = z.infer<typeof NarrationBlockSchema>;
export type Narration = z.infer<typeof NarrationSchema>;
