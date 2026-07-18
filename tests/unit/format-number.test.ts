import { describe, expect, it } from "vitest";
import { compactFormat, standardFormat } from "@/lib/format-number";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";

/**
 * UT-FMT-*: Presentation helpers used by the dashboard cards and charts.
 *
 * These are pure and cheap, but they render the population and aid figures that
 * decision-makers read, so the rounding and boundary behaviour is pinned here.
 */

describe("compactFormat (UT-FMT)", () => {
  it("UT-FMT-01: leaves values under one thousand unchanged", () => {
    expect(compactFormat(0)).toBe("0");
    expect(compactFormat(999)).toBe("999");
  });

  it("UT-FMT-02: abbreviates thousands and millions", () => {
    expect(compactFormat(1_000)).toBe("1K");
    expect(compactFormat(1_500)).toBe("1.5K");
    expect(compactFormat(1_000_000)).toBe("1M");
  });

  it("UT-FMT-03: rounds rather than truncates", () => {
    expect(compactFormat(1_249)).toBe("1.2K");
    expect(compactFormat(1_250)).toBe("1.3K");
  });

  it("UT-FMT-04: handles negative values", () => {
    expect(compactFormat(-1_500)).toBe("-1.5K");
  });
});

describe("standardFormat (UT-FMT)", () => {
  it("UT-FMT-05: always shows exactly two decimal places", () => {
    expect(standardFormat(0)).toBe("0.00");
    expect(standardFormat(1_234.5)).toBe("1,234.50");
  });

  it("UT-FMT-06: groups thousands with separators", () => {
    expect(standardFormat(1_234_567.891)).toBe("1,234,567.89");
  });
});

describe("createTimeFrameExtractor (UT-FMT)", () => {
  it("UT-FMT-07: returns the entry matching the requested section", () => {
    const extract = createTimeFrameExtractor("overview:monthly,profit:weekly");
    expect(extract("profit")).toBe("profit:weekly");
  });

  it("UT-FMT-08: returns undefined when the section is absent", () => {
    const extract = createTimeFrameExtractor("overview:monthly");
    expect(extract("profit")).toBeUndefined();
  });

  it("UT-FMT-09: returns undefined when no timeframe is selected at all", () => {
    expect(createTimeFrameExtractor(undefined)("profit")).toBeUndefined();
  });
});
