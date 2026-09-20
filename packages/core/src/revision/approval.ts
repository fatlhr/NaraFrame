import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { SchemaVersionSchema, Sha256Schema } from "../schema/primitives.js";
import { atomicWrite, revisionsDirectory } from "./store.js";

export const ApprovalSchema = z
  .object({
    /** The exact source the approval covers. It does not carry to another revision. */
    sourceRevision: Sha256Schema,
    /** Fingerprint of what the reviewed preview and the export both render. */
    assemblyKey: Sha256Schema,
    scope: z.object({ type: z.literal("project") }).strict(),
    /** The preview build the owner reviewed; null only for autonomous export. */
    previewBuildId: z.string().trim().min(1).nullable(),
    /** Set only when the owner explicitly authorised export without review. */
    autonomy: z
      .object({
        authorizedBy: z.string().trim().min(1),
        note: z.string().trim().min(1).optional(),
      })
      .strict()
      .nullable(),
    approvedAt: z.string().datetime(),
  })
  .strict()
  .refine(
    (approval) =>
      (approval.previewBuildId === null) === (approval.autonomy !== null),
    "An approval names a reviewed preview build or an explicit autonomy authorisation, exactly one of the two",
  );

const ApprovalLogSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    approvals: z.array(ApprovalSchema),
  })
  .strict();

export type Approval = z.infer<typeof ApprovalSchema>;

const logPath = (root: string, sourceRevision: string): string =>
  join(revisionsDirectory(root), "approvals", `${sourceRevision}.json`);

export const readApprovals = async (
  root: string,
  sourceRevision: string,
): Promise<Approval[]> => {
  try {
    const parsed = ApprovalLogSchema.safeParse(
      JSON.parse(await readFile(logPath(root, sourceRevision), "utf8")),
    );
    return parsed.success ? parsed.data.approvals : [];
  } catch {
    return [];
  }
};

/** Append-only: an approval is a fact about a moment, never rewritten. */
export const recordApproval = async (
  root: string,
  approval: Approval,
): Promise<Approval> => {
  const valid = ApprovalSchema.parse(approval);
  const existing = await readApprovals(root, valid.sourceRevision);
  await atomicWrite(
    logPath(root, valid.sourceRevision),
    `${JSON.stringify({ schemaVersion: 1, approvals: [...existing, valid] }, null, 2)}\n`,
  );
  return valid;
};
