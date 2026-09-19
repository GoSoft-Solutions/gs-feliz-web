import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

// The platform runs on a UTC server (no TZ set in the Docker image) but
// the business — and everyone reading this chart — is in Mexico. Without
// this, a contact created at, say, 8pm Mexico time lands after midnight
// UTC and gets counted on the WRONG day (tomorrow, from the server's
// point of view) — the growth chart would silently disagree with what
// actually happened each day. Single-tenant platform for a Mexico-based
// business, so a fixed IANA zone (DST-aware on its own) is the right call
// rather than a per-user setting.
const BUSINESS_TZ = 'America/Mexico_City';

/** The calendar day (YYYY-MM-DD) a timestamp falls on in `BUSINESS_TZ`. */
function businessDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export interface AnalyticsOverview {
  totals: {
    contacts: number;
    newInWindow: number;
    campaigns: number;
    campaignsActive: number;
    emailsSent: number;
    unsubscribed: number;
    unsubscribeRate: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  growth: Array<{ date: string; count: number }>;
  campaignPerformance: Array<{ id: string; name: string; slug: string; contacts: number; emailsSent: number }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    contactName: string;
    contactEmail: string | null;
    campaignName: string | null;
    source: string | null;
    createdAt: string;
  }>;
}

/**
 * Aggregates data already captured by the CORE + integrations modules
 * (Contact, ContactSource, Campaign, ContactEvent) into the numbers the
 * admin's Analytics page renders. No new data is captured here — this is
 * a read-only view over what the platform already records.
 *
 * The platform's contact volume is low today (new product), so this
 * fetches contacts into memory and aggregates in JS rather than reaching
 * for raw SQL / date-bucketing queries — simplest correct thing now,
 * revisit with DB-side aggregation if/when volume actually demands it.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days = 30): Promise<AnalyticsOverview> {
    // The exact set of business-calendar days the window covers, oldest
    // first — e.g. ["2026-09-13", ..., "2026-09-19"] for days=7. Built
    // from "today" in BUSINESS_TZ, not the server's UTC clock.
    const todayKey = businessDateKey(new Date());
    const [ty, tm, td] = todayKey.split('-').map(Number);
    // A UTC-midnight anchor for `todayKey` — used only for whole-day
    // arithmetic below (add/subtract N days), never reformatted back
    // through a timezone, so it can't reintroduce the UTC-vs-Mexico
    // day-shift this function exists to avoid.
    const todayAnchor = new Date(Date.UTC(ty, tm - 1, td));
    const windowDays: string[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(todayAnchor);
      d.setUTCDate(d.getUTCDate() - i);
      windowDays.push(d.toISOString().slice(0, 10));
    }
    const windowDaySet = new Set(windowDays);

    const [contacts, campaigns, emailsSentTotal, recentEventRows] = await Promise.all([
      this.prisma.contact.findMany({
        select: {
          id: true,
          status: true,
          unsubscribed: true,
          createdAt: true,
          // Most recent source per contact — mirrors the "Fuente" column
          // shown in the Contacts page, so the two stay consistent.
          sources: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { source: true, provider: true },
          },
        },
      }),
      this.prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          _count: { select: { sources: true } },
        },
      }),
      this.prisma.contactEvent.count({ where: { eventType: 'EMAIL_SENT' } }),
      this.prisma.contactEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
          campaign: { select: { name: true } },
        },
      }),
    ]);

    // --- Totals + status breakdown -----------------------------------
    const statusCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    let unsubscribed = 0;
    let newInWindow = 0;
    const growthCounts = new Map<string, number>(); // date (YYYY-MM-DD) -> count

    for (const contact of contacts) {
      statusCounts.set(contact.status, (statusCounts.get(contact.status) ?? 0) + 1);

      const latestSource = contact.sources[0];
      const sourceLabel = latestSource?.source?.trim() || latestSource?.provider || 'Sin fuente';
      sourceCounts.set(sourceLabel, (sourceCounts.get(sourceLabel) ?? 0) + 1);

      if (contact.unsubscribed) unsubscribed += 1;

      const dayKey = businessDateKey(contact.createdAt);
      if (windowDaySet.has(dayKey)) {
        newInWindow += 1;
        growthCounts.set(dayKey, (growthCounts.get(dayKey) ?? 0) + 1);
      }
    }

    // Zero-fill every day in the window so the chart has no gaps. This is
    // also exactly the same day list newInWindow was counted against, so
    // the KPI tile and the sum of the chart's bars can never disagree.
    const growth = windowDays.map((date) => ({ date, count: growthCounts.get(date) ?? 0 }));

    // --- Campaign performance (emails sent per campaign) ---------------
    const emailsByCampaign = await this.prisma.contactEvent.groupBy({
      by: ['campaignId'],
      where: { eventType: 'EMAIL_SENT', campaignId: { not: null } },
      _count: { _all: true },
    });
    const emailsByCampaignMap = new Map(
      emailsByCampaign.map((row) => [row.campaignId as string, row._count._all]),
    );

    const campaignPerformance = campaigns
      .map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        contacts: campaign._count.sources,
        emailsSent: emailsByCampaignMap.get(campaign.id) ?? 0,
      }))
      .sort((a, b) => b.contacts - a.contacts)
      .slice(0, 8);

    return {
      totals: {
        contacts: contacts.length,
        newInWindow,
        campaigns: campaigns.length,
        campaignsActive: campaigns.filter((c) => c.status === 'ACTIVE').length,
        emailsSent: emailsSentTotal,
        unsubscribed,
        unsubscribeRate: contacts.length > 0 ? Math.round((unsubscribed / contacts.length) * 1000) / 10 : 0,
      },
      statusBreakdown: [...statusCounts.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      sourceBreakdown: [...sourceCounts.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      growth,
      campaignPerformance,
      recentEvents: recentEventRows.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        contactName: [event.contact.firstName, event.contact.lastName].filter(Boolean).join(' ') || 'Sin nombre',
        contactEmail: event.contact.email,
        campaignName: event.campaign?.name ?? null,
        source: event.source,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }
}
