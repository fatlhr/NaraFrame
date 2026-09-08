import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

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
