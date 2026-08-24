/**
 * Case reference number for Contact Support submissions.
 *
 * Format recommended in solution doc §4.4: SPG-YYYYMMDD-XXXXXX
 * OPEN ITEM (solution doc §8, owner OPS): format is pending final sign-off.
 * This is the recommended default and is safe to change in one place.
 */
const SUFFIX_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function generateCaseReference(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
  }

  return `SPG-${year}${month}${day}-${suffix}`;
}
