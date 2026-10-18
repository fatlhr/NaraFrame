import { describe, expect, it } from "vitest";
import { profileSummary } from "../../src/profile/list.js";

describe("profileSummary", () => {
  it("takes the first sentence of the first paragraph under the heading", () => {
    expect(
      profileSummary(
        "# Title\n\nExplain one thing clearly. Then stop.\n\n- A rule.\n",
      ),
    ).toBe("Explain one thing clearly.");
  });

  it("joins a sentence wrapped over several lines", () => {
    expect(
      profileSummary(
        "# Title\n\nTeach one idea from a stable subject: how something\nworks, what the numbers say.\nNothing else.\n",
      ),
    ).toBe(
      "Teach one idea from a stable subject: how something works, what the numbers say.",
    );
  });

  it("does not stop at a decimal point or an abbreviation without a space", () => {
    expect(profileSummary("Use 3.5 seconds per shot. Next.")).toBe(
      "Use 3.5 seconds per shot.",
    );
  });

  it("returns the whole paragraph when it has no full stop, and empty for no text", () => {
    expect(profileSummary("# Title\n\nA calm series")).toBe("A calm series");
    expect(profileSummary("# Only a heading\n")).toBe("");
  });
});
