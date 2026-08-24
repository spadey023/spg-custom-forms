/**
 * Parses repeatable field groups out of a submitted FormData.
 *
 * Client components name repeated-row inputs like `officeLocations[0].city`
 * (see RepeatableFieldGroup). This reconstructs an ordered array of row
 * objects and drops rows left completely blank (both office locations and
 * portal administrator contacts are optional, one-row-by-default sections).
 */
export function parseRepeatableGroup(
  formData: FormData,
  groupName: string,
  fields: readonly string[]
): Record<string, string>[] {
  const pattern = new RegExp(`^${groupName}\\[(\\d+)\\]\\.(\\w+)$`);
  const rowsByIndex = new Map<number, Record<string, string>>();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const match = key.match(pattern);
    if (!match) continue;
    const [, indexStr, field] = match;
    if (!fields.includes(field)) continue;

    const index = Number(indexStr);
    const row = rowsByIndex.get(index) ?? {};
    row[field] = value;
    rowsByIndex.set(index, row);
  }

  return Array.from(rowsByIndex.entries())
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => Object.values(row).some((v) => v.trim().length > 0));
}
