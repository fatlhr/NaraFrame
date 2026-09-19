import type { Issue } from "../model/issue.js";
import type { Narration } from "../schema/narration.js";

const issue = (
  code: string,
  severity: Issue["severity"],
  path: string,
  message: string,
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact: "narration.json",
  path,
  message,
  suggestion:
    "Declare the source under `sources` and reference it from the block's `sourceIds`.",
});

/**
 * A block marked `carriesFactualClaim` must cite a declared source. When the
 * active profile requires sourcing the gap blocks publication (error);
 * otherwise it is reported as a warning.
 */
export const checkProvenance = (
  narration: Narration,
  requireSourcing: boolean,
): Issue[] => {
  const declared = new Set(
    (narration.sources ?? []).map((source) => source.id),
  );
  const severity: Issue["severity"] = requireSourcing ? "error" : "warning";
  const issues: Issue[] = [];

  narration.blocks.forEach((block, index) => {
    const path = `/blocks/${index}`;
    const sourceIds = block.sourceIds ?? [];

    sourceIds.forEach((sourceId, sourceIndex) => {
      if (!declared.has(sourceId)) {
        issues.push(
          issue(
            "SOURCE_UNKNOWN",
            "error",
            `${path}/sourceIds/${sourceIndex}`,
            `Block ${block.id} cites source ${sourceId}, which is not declared.`,
          ),
        );
      }
    });

    if (block.carriesFactualClaim && sourceIds.length === 0) {
      issues.push(
        issue(
          "SOURCE_MISSING",
          severity,
          path,
          `Block ${block.id} carries a factual claim but cites no source.`,
        ),
      );
    }
  });

  return issues;
};
