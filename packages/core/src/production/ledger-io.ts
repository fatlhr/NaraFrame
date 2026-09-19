import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { issuesFromZodError, type Result } from "../model/issue.js";
import {
  type ProductionLedger,
  ProductionLedgerSchema,
} from "../schema/production.js";

/** Reads `production.json`. A project without one has no recorded spend: ok(null). */
export const readProductionLedger = async (
  root: string,
): Promise<Result<ProductionLedger | null>> => {
  let text: string;
  try {
    text = await readFile(join(root, "production.json"), "utf8");
  } catch {
    return { ok: true, value: null, issues: [] };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      issues: [
        {
          code: "SOURCE_JSON_INVALID",
          severity: "error",
          responsible: "user",
          artifact: "production.json",
          path: "/",
          message: "production.json is not valid JSON.",
          suggestion: "Restore it from a backup; it is the record of spend.",
        },
      ],
    };
  }
  const parsed = ProductionLedgerSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      issues: issuesFromZodError(parsed.error, "production.json"),
    };
  }
  return { ok: true, value: parsed.data, issues: [] };
};
