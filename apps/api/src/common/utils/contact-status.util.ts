/** Share of the campaigns run so far that a contact must have joined to count as "Activo". */
const ACTIVE_SHARE = 0.8;
const ACTIVE_FLOOR = 2;

/**
 * How many distinct campaigns a contact needs to be "Activo". It scales with
 * the campaigns the client has run (~80%: 10 campaigns -> 8) instead of a
 * fixed number, so the bar keeps meaning something as the catalogue grows.
 * Never below 2, so a single campaign can't make everyone "active".
 */
export function activeThreshold(totalCampaigns: number): number {
  return Math.max(ACTIVE_FLOOR, Math.round(totalCampaigns * ACTIVE_SHARE));
}

/**
 * The status shown in the Contacts table and Analytics, derived from what
 * contacts actually did — the stored `status` column stays LEAD unless
 * someone edits it by hand, so it can't tell you who's engaged:
 *  - Inactivo: cancelled their subscription (or was marked INACTIVE by hand)
 *  - Cliente:  marked CUSTOMER by hand (a purchase can't be inferred from here)
 *  - Activo:   in enough distinct campaigns
 *  - Lead:     everyone else
 * Activo/Lead are automatic on purpose: a stored ACTIVE/LEAD is ignored, so
 * a contact moves between them on its own as campaigns are added.
 */
export function deriveContactStatus(
  contact: { status: string; unsubscribed: boolean },
  campaignCount: number,
  threshold: number,
): string {
  if (contact.unsubscribed || contact.status === 'INACTIVE') return 'INACTIVE';
  if (contact.status === 'CUSTOMER') return 'CUSTOMER';
  if (campaignCount >= threshold) return 'ACTIVE';
  return 'LEAD';
}

export function distinctCampaigns(sources: Array<{ campaignId: string | null }>): number {
  return new Set(sources.map((s) => s.campaignId).filter((id): id is string => id !== null)).size;
}
