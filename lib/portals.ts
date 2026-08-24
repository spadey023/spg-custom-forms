/**
 * Canonical ?portal= slug -> display name map.
 *
 * OPEN ITEM (solution doc §8, owner Neha Bansal): the canonical list of
 * portal values is not yet finalized. Update this map once confirmed —
 * everything else (form pages, email subject lines) reads through
 * `getPortalDisplayName` so a single edit here is sufficient.
 */
export const PORTALS: Record<string, string> = {
  surefyre: "SureFyre",
  execupro: "ExecuPro",
  flood: "Flood",
  cpl: "CPL",
};

export function getPortalDisplayName(slug: string | null | undefined): string {
  if (!slug) return "Unknown Portal";
  const normalized = slug.trim().toLowerCase();
  return PORTALS[normalized] ?? slug.trim();
}

export function isKnownPortal(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() in PORTALS;
}
