/**
 * Contribution display status.
 *
 * The stored header status only tracks the draft → submitted → cancelled
 * lifecycle. What a provider actually wants to know is what happened at the
 * receiving end, which lives on the individual lines. This derives the one
 * label that summarises a submitted contribution, so the list, the API and the
 * detail view cannot drift apart.
 */

export type LineStatus =
  | "pending"
  | "received"
  | "partially_received"
  | "not_received"
  | "rejected";

/** Line statuses that mean the camp side has finished with that line. */
const TERMINAL: ReadonlySet<string> = new Set([
  "received",
  "partially_received",
  "not_received",
  "rejected",
]);

/** Line statuses that mean something actually arrived. */
const ARRIVED: ReadonlySet<string> = new Set(["received", "partially_received"]);

export function deriveDisplayStatus(
  headerStatus: string,
  lineStatuses: readonly string[],
): string {
  // A draft or a cancelled contribution is described by its header alone.
  if (headerStatus !== "submitted" || lineStatuses.length === 0) {
    return headerStatus;
  }

  const total = lineStatuses.length;
  const fullyReceived = lineStatuses.filter((s) => s === "received").length;
  const arrived = lineStatuses.filter((s) => ARRIVED.has(s)).length;
  const settled = lineStatuses.filter((s) => TERMINAL.has(s)).length;

  if (fullyReceived === total) return "completed";
  if (settled === total) return arrived > 0 ? "partially_received" : "not_received";
  // Still in progress: some lines confirmed, the rest awaiting confirmation.
  if (arrived > 0) return "partially_received";
  return "submitted";
}

/**
 * A submitted contribution may be withdrawn only while every line is still
 * awaiting confirmation. Once a Camp Manager has recorded what arrived, the
 * record is part of the receipt history and must not disappear.
 */
export function isCancellable(
  headerStatus: string,
  lineStatuses: readonly string[],
): boolean {
  return (
    headerStatus === "submitted" &&
    lineStatuses.length > 0 &&
    lineStatuses.every((s) => s === "pending")
  );
}
