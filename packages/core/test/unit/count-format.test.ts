import { formatCount } from "@naraframe/core";
import { describe, expect, it } from "vitest";

describe("formatCount", () => {
  it("groups Indonesian thousands with dots and adds prefix and suffix", () => {
    expect(formatCount(50000, { grouping: ".", suffix: "+" })).toBe("50.000+");
    expect(formatCount(1590, { prefix: "Guru Patimpus · " })).toBe(
      "Guru Patimpus · 1590",
    );
  });

  it("rounds to the declared decimals with the matching decimal mark", () => {
    expect(formatCount(2.486, { decimals: 1, grouping: "." })).toBe("2,5");
    expect(formatCount(1234.5, { decimals: 1, grouping: "," })).toBe("1,234.5");
    expect(formatCount(12345.678, { decimals: 2 })).toBe("12345.68");
  });

  it("writes intermediate values the same way as endpoints", () => {
    expect(formatCount(29443.2, { grouping: ".", suffix: "+" })).toBe(
      "29.443+",
    );
    expect(formatCount(-0.2, {})).toBe("0");
    expect(formatCount(-1500, { grouping: " " })).toBe("-1 500");
  });
});
