import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
};

/** Order-independent SHA-256 of a JSON-like value. */
export const hashValue = (value: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");

export const sha256Text = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const sha256File = async (filePath: string): Promise<string> => {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest("hex");
};
