import { describe, expect, it } from "vitest";
import { MINIMUM_NODE, nodeSatisfies } from "../../src/doctor.js";

describe("Node requirement", () => {
  it("accepts the minimum and anything newer, including odd and future lines", () => {
    expect(MINIMUM_NODE).toBe("22.0.0");
    for (const version of ["22.0.0", "22.12.1", "23.10.0", "24.20.0", "26.1.0"])
      expect(nodeSatisfies(version), version).toBe(true);
    expect(nodeSatisfies("v24.20.0")).toBe(true);
  });

  it("refuses anything older than the minimum", () => {
    for (const version of ["21.7.3", "20.19.0", "18.20.4"])
      expect(nodeSatisfies(version), version).toBe(false);
  });
});
