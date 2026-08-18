import { describe, expect, it } from "vitest";
import {
  isValidNationalId,
  nationalIdSchema,
  optionalNationalIdSchema,
  toNationalIdInput,
} from "@/lib/validations/national-id";

/**
 * UT-NID-*: national ID format.
 *
 * A Palestinian national ID is exactly nine digits. The browser and the server
 * share these rules, so a value the form accepts can never be one the route
 * rejects — and, more importantly, the other way round.
 */

describe("accepting an ID (UT-NID)", () => {
  it("UT-NID-01: exactly nine digits is valid", () => {
    expect(isValidNationalId("405123456")).toBe(true);
    expect(isValidNationalId("000000000")).toBe(true);
  });

  it("UT-NID-02: surrounding whitespace is ignored", () => {
    expect(isValidNationalId("  405123456  ")).toBe(true);
    expect(nationalIdSchema.parse("  405123456 ")).toBe("405123456");
  });

  it("UT-NID-03: the wrong length is rejected", () => {
    expect(isValidNationalId("40512345")).toBe(false); // eight
    expect(isValidNationalId("4051234567")).toBe(false); // ten
    expect(isValidNationalId("")).toBe(false);
  });

  it("UT-NID-04: nine characters that are not all digits are rejected", () => {
    // Length alone is not enough — this is what a bare length check would miss.
    expect(isValidNationalId("40512345a")).toBe(false);
    expect(isValidNationalId("405-12345")).toBe(false);
    expect(isValidNationalId("٤٠٥١٢٣٤٥٦")).toBe(false); // Arabic-Indic digits
    expect(isValidNationalId("405 12345")).toBe(false);
  });

  it("UT-NID-05: a null or missing value is rejected rather than throwing", () => {
    expect(isValidNationalId(null)).toBe(false);
    expect(isValidNationalId(undefined)).toBe(false);
  });
});

describe("the required schema (UT-NID)", () => {
  it("UT-NID-06: a bad value fails with the translation key as its message", () => {
    const result = nationalIdSchema.safeParse("123");

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("nationalIdFormatError");
  });
});

describe("the optional member schema (UT-NID)", () => {
  it("UT-NID-07: blank, null and undefined all normalise to null", () => {
    // A child may have no ID yet; the column stores null, never "".
    for (const empty of ["", null, undefined]) {
      const result = optionalNationalIdSchema.safeParse(empty);
      expect(result.success, String(empty)).toBe(true);
      expect(result.data, String(empty)).toBeNull();
    }
  });

  it("UT-NID-08: a well-formed value passes through trimmed", () => {
    expect(optionalNationalIdSchema.parse(" 405123456 ")).toBe("405123456");
  });

  it("UT-NID-09: a partial number is rejected rather than stored malformed", () => {
    expect(optionalNationalIdSchema.safeParse("4051").success).toBe(false);
    expect(optionalNationalIdSchema.safeParse("abcdefghi").success).toBe(false);
  });
});

describe("the input filter (UT-NID)", () => {
  it("UT-NID-10: non-digits are dropped as the user types", () => {
    expect(toNationalIdInput("405-123-456")).toBe("405123456");
    expect(toNationalIdInput("abc405")).toBe("405");
  });

  it("UT-NID-11: input is cut at nine digits", () => {
    expect(toNationalIdInput("4051234567890")).toBe("405123456");
  });

  it("UT-NID-12: whatever the filter produces is either empty or acceptable", () => {
    // The field cannot hold a value the schema would reject once it is full,
    // so the form never has to explain a format error mid-typing.
    for (const raw of ["405123456", "40a5!1@2#3$4%5^6&7*8", "٤٠٥12345678"]) {
      const filtered = toNationalIdInput(raw);
      expect(filtered).toMatch(/^\d{0,9}$/);
      if (filtered.length === 9) expect(isValidNationalId(filtered)).toBe(true);
    }
  });
});
