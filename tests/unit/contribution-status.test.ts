import { describe, expect, it } from "vitest";
import {
  deriveDisplayStatus,
  isCancellable,
} from "@/lib/contributions/status";

/**
 * UT-CST-*: the status a provider actually sees.
 *
 * The stored header status only tracks draft → submitted → cancelled, so a
 * submitted contribution would otherwise read "submitted" forever no matter
 * what the receiving camps did with it. These pin down the summary label and
 * the window in which a contribution may still be withdrawn.
 */

describe("display status (UT-CST)", () => {
  it("UT-CST-01: a draft and a cancelled contribution are described by the header alone", () => {
    expect(deriveDisplayStatus("draft", [])).toBe("draft");
    expect(deriveDisplayStatus("draft", ["pending"])).toBe("draft");
    expect(deriveDisplayStatus("cancelled", ["pending"])).toBe("cancelled");
  });

  it("UT-CST-02: a submitted contribution with no line stays 'submitted'", () => {
    expect(deriveDisplayStatus("submitted", [])).toBe("submitted");
  });

  it("UT-CST-03: nothing confirmed yet still reads as awaiting confirmation", () => {
    expect(deriveDisplayStatus("submitted", ["pending", "pending"])).toBe(
      "submitted",
    );
  });

  it("UT-CST-04: every line received reads as completed", () => {
    expect(deriveDisplayStatus("submitted", ["received", "received"])).toBe(
      "completed",
    );
  });

  it("UT-CST-05: some received while others are still pending reads as partial", () => {
    expect(deriveDisplayStatus("submitted", ["received", "pending"])).toBe(
      "partially_received",
    );
  });

  it("UT-CST-06: all lines settled with something arrived reads as partial", () => {
    // Settled but mixed: one arrived short, one never arrived.
    expect(
      deriveDisplayStatus("submitted", ["partially_received", "not_received"]),
    ).toBe("partially_received");
    expect(deriveDisplayStatus("submitted", ["received", "rejected"])).toBe(
      "partially_received",
    );
  });

  it("UT-CST-07: all lines settled with nothing arrived reads as not received", () => {
    expect(deriveDisplayStatus("submitted", ["not_received", "rejected"])).toBe(
      "not_received",
    );
    expect(deriveDisplayStatus("submitted", ["rejected"])).toBe("not_received");
  });

  it("UT-CST-08: a rejected line alongside pending ones does not settle the contribution", () => {
    // Nothing has arrived and one camp has yet to answer, so the provider is
    // still waiting rather than looking at a final outcome.
    expect(deriveDisplayStatus("submitted", ["rejected", "pending"])).toBe(
      "submitted",
    );
  });
});

describe("cancellation window (UT-CST)", () => {
  it("UT-CST-09: a submitted contribution with every line pending may be cancelled", () => {
    expect(isCancellable("submitted", ["pending", "pending"])).toBe(true);
  });

  it("UT-CST-10: one confirmed line closes the window", () => {
    // The receipt history is real from that point on and must not vanish.
    for (const settled of [
      "received",
      "partially_received",
      "not_received",
      "rejected",
    ]) {
      expect(isCancellable("submitted", ["pending", settled]), settled).toBe(
        false,
      );
    }
  });

  it("UT-CST-11: a draft is deleted rather than cancelled, and a cancelled one is final", () => {
    expect(isCancellable("draft", ["pending"])).toBe(false);
    expect(isCancellable("cancelled", ["pending"])).toBe(false);
  });

  it("UT-CST-12: a submitted contribution with no line at all cannot be cancelled", () => {
    expect(isCancellable("submitted", [])).toBe(false);
  });
});
