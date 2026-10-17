import type { Issue } from "../model/issue.js";
import type { PlanSource } from "../schema/export-schema.js";
import type { Narration } from "../schema/narration.js";

const issue = (
  code: string,
  severity: Issue["severity"],
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
  entityId?: string,
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact,
  path,
  ...(entityId ? { entityId } : {}),
  message,
  suggestion,
});

const SUGGESTION =
  "Declare the source under `sources` and reference it from `sourceIds`.";

interface Claimant {
  artifact: string;
  path: string;
  label: string;
  id: string;
  carriesFactualClaim: boolean | undefined;
  sourceIds: readonly string[] | undefined;
}

const checkClaimants = (
  claimants: readonly Claimant[],
  declared: ReadonlySet<string>,
  requireSourcing: boolean,
): Issue[] => {
  const severity: Issue["severity"] = requireSourcing ? "error" : "warning";
  const issues: Issue[] = [];

  for (const claimant of claimants) {
    const sourceIds = claimant.sourceIds ?? [];
    sourceIds.forEach((sourceId, sourceIndex) => {
      if (!declared.has(sourceId)) {
        issues.push(
          issue(
            "SOURCE_UNKNOWN",
            "error",
            claimant.artifact,
            `${claimant.path}/sourceIds/${sourceIndex}`,
            `${claimant.label} ${claimant.id} cites source ${sourceId}, which is not declared.`,
            SUGGESTION,
            claimant.id,
          ),
        );
      }
    });

    if (claimant.carriesFactualClaim && sourceIds.length === 0) {
      issues.push(
        issue(
          "SOURCE_MISSING",
          severity,
          claimant.artifact,
          claimant.path,
          `${claimant.label} ${claimant.id} carries a factual claim but cites no source.`,
          SUGGESTION,
          claimant.id,
        ),
      );
    }
  }

  return issues;
};

const narrationClaimants = (narration: Narration): Claimant[] =>
  narration.blocks.map((block, index) => ({
    artifact: "narration.json",
    path: `/blocks/${index}`,
    label: "Block",
    id: block.id,
    carriesFactualClaim: block.carriesFactualClaim,
    sourceIds: block.sourceIds,
  }));

/**
 * A block marked `carriesFactualClaim` must cite a declared source. When the
 * active profile requires sourcing the gap blocks publication (error);
 * otherwise it is reported as a warning.
 */
export const checkProvenance = (
  narration: Narration,
  requireSourcing: boolean,
): Issue[] =>
  checkClaimants(
    narrationClaimants(narration),
    new Set((narration.sources ?? []).map((source) => source.id)),
    requireSourcing,
  );

/**
 * Checks every block and every scene against the union of sources declared in
 * narration.json and scenes.json, so a claim shown on screen is as accountable
 * as one that is spoken. A source id declared twice is an error. When the
 * profile requires sourcing and nothing is labelled as a claim, reports one
 * info note (`CLAIMS_UNLABELLED`); it never blocks.
 */
export const checkSourceProvenance = (source: PlanSource): Issue[] => {
  const requireSourcing = Boolean(source.profile.production.requireSourcing);
  const declared = new Set<string>();
  const issues: Issue[] = [];

  const declare = (
    artifact: string,
    sources: PlanSource["scenes"]["sources"],
  ): void => {
    (sources ?? []).forEach((entry, index) => {
      if (declared.has(entry.id)) {
        issues.push(
          issue(
            "SOURCE_DUPLICATE",
            "error",
            artifact,
            `/sources/${index}/id`,
            `Source ${entry.id} is declared more than once across narration.json and scenes.json.`,
            "Give every source one unique id.",
            entry.id,
          ),
        );
      }
      declared.add(entry.id);
    });
  };
  declare("scenes.json", source.scenes.sources);
  declare("narration.json", source.narration?.sources);

  const claimants: Claimant[] = [
    ...(source.narration ? narrationClaimants(source.narration) : []),
    ...source.scenes.scenes.map((scene, index) => ({
      artifact: "scenes.json",
      path: `/scenes/${index}`,
      label: "Scene",
      id: scene.id,
      carriesFactualClaim: scene.carriesFactualClaim,
      sourceIds: scene.sourceIds,
    })),
  ];

  issues.push(...checkClaimants(claimants, declared, requireSourcing));

  // The engine never detects claims: it trusts the labels. A profile that
  // requires sourcing but sees no label would otherwise pass in silence.
  if (
    requireSourcing &&
    !claimants.some((claimant) => claimant.carriesFactualClaim)
  ) {
    issues.push(
      issue(
        "CLAIMS_UNLABELLED",
        "info",
        "scenes.json",
        "/scenes",
        "The profile requires sourcing, but no scene or narration block is labelled carriesFactualClaim: true. The engine cannot see claims, so this only means none was declared.",
        "Confirm the episode states no factual claim (causes, quantities, dates, places, named people or events), or set carriesFactualClaim: true on each scene or block that does and cite a declared source in sourceIds.",
      ),
    );
  }

  return issues;
};
