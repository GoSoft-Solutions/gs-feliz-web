import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, type Campaign } from '@feliz/database';
import { PrismaService } from '../../database/prisma.service';
import { normalizeEmail } from '../../common/utils/normalize-email.util';
import { EmailService } from '../email/email.service';
import { QueuePublisherService } from '../email/queue-publisher.service';
import { renderCampaignEmail } from '../email/email-render.util';
import { SubscribeDto } from './dto/subscribe.dto';

const PROVIDER = 'LANDING';

export interface SubscribeResult {
  success: true;
  status: 'created' | 'existing';
  emailQueued: boolean;
}

/**
 * Handles public, unauthenticated subscriptions from the capture pages
 * (danielcorral.com.mx/news and /news/<slug>).
 *
 * Flow:
 *   1. Resolve or create the Contact by (normalized) email — idempotent,
 *      so re-submitting the same email never creates duplicates.
 *   2. Associate the Contact with the campaign (if a valid slug is given)
 *      via a ContactSource row, and record a LEAD_CREATED / CONTACT_UPDATED
 *      event.
 *   3. Trigger the campaign's welcome email: publish to SQS when a queue
 *      is configured (worker sends it), otherwise send inline.
 *
 * All data flows through us — no dependency on an external webhook.
 */
@Injectable()
export class PublicService {
  private readonly logger = new Logger('public:subscribe');

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly queue: QueuePublisherService,
  ) {}

  /**
   * Flags a contact as unsubscribed so it stops receiving email. Called
   * from the public unsubscribe link in every email. The token is an HMAC
   * of the email, so a link only works for its intended recipient.
   */
  async unsubscribe(email: string): Promise<{ success: boolean }> {
    const normalized = normalizeEmail(email);
    if (!normalized) return { success: false };
    const contact = await this.prisma.contact.findUnique({ where: { email: normalized } });
    if (contact && !contact.unsubscribed) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: { unsubscribed: true },
      });
      await this.prisma.contactEvent.create({
        data: { contactId: contact.id, eventType: 'UNSUBSCRIBED', source: 'email' },
      });
    }
    // Always report success so the link never reveals whether an email exists.
    return { success: true };
  }

  /**
   * Resolves a campaign for its public capture page — only when it's
   * ACTIVE. A slug that doesn't exist and a real campaign that's been
   * paused/archived/left in DRAFT look identical from the outside (both
   * 404): a deactivated campaign's link is meant to stop working, not
   * degrade to "exists but disabled".
   */
  async getActiveCampaign(slug: string): Promise<{ name: string; slug: string }> {
    const campaign = await this.prisma.campaign.findUnique({ where: { slug } });
    if (!campaign || campaign.status !== 'ACTIVE') {
      throw new NotFoundException('This campaign link is not available');
    }
    return { name: campaign.name, slug: campaign.slug };
  }

  /** Lets a capture page skip asking for a name when the email already
   * belongs to a known contact. */
  async checkEmailExists(rawEmail: string): Promise<{ exists: boolean }> {
    const email = normalizeEmail(rawEmail);
    if (!email) return { exists: false };
    const contact = await this.prisma.contact.findUnique({ where: { email }, select: { id: true } });
    return { exists: Boolean(contact) };
  }

  async subscribe(dto: SubscribeDto): Promise<SubscribeResult> {
    const email = normalizeEmail(dto.email);
    if (!email) {
      // IsEmail on the DTO already guards this; belt-and-suspenders.
      throw new Error('A valid email is required');
    }

    // A campaign-specific link only works while that campaign is ACTIVE —
    // same rule as getActiveCampaign() above, enforced again here so
    // deactivating a campaign actually stops its link from working even
    // if someone posts to this endpoint directly (not just through the
    // capture page's own existence check).
    let campaign: Campaign | null = null;
    if (dto.campaignSlug) {
      campaign = await this.prisma.campaign.findUnique({ where: { slug: dto.campaignSlug } });
      if (!campaign || campaign.status !== 'ACTIVE') {
        throw new NotFoundException('This campaign link is not available');
      }
    }

    const { contact, isNew } = await this.prisma.$transaction(async (tx) => {
      let existing = await tx.contact.findUnique({ where: { email } });
      const isNew = !existing;

      if (!existing) {
        existing = await tx.contact.create({
          data: {
            email,
            firstName: dto.nombre,
            metadata: {},
          },
        });
      } else if (dto.nombre && !existing.firstName) {
        // Backfill a name for a returning contact without overwriting one.
        existing = await tx.contact.update({
          where: { id: existing.id },
          data: { firstName: dto.nombre },
        });
      }

      // Keep one landing source per campaign so the same contact can belong
      // to multiple campaigns while repeat submissions stay idempotent.
      // The displayed "source" (FUENTE) is the campaign's own source field
      // (e.g. "Instagram"). Fall back to the slug, then to "news" for the
      // generic /news signup with no campaign.
      const sourceLabel = campaign?.source ?? campaign?.slug ?? 'news';

      const existingSource = await tx.contactSource.findFirst({
        where: { contactId: existing.id, provider: PROVIDER, campaignId: campaign?.id ?? null },
      });

      if (existingSource) {
        await tx.contactSource.update({
          where: { id: existingSource.id },
          data: { source: sourceLabel },
        });
      } else {
        await tx.contactSource.create({
          data: {
            contactId: existing.id,
            provider: PROVIDER,
            externalId: `${existing.id}:${campaign?.id ?? 'generic'}`,
            source: sourceLabel,
            campaignId: campaign?.id,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      await tx.contactEvent.create({
        data: {
          contactId: existing.id,
          eventType: isNew ? 'LEAD_CREATED' : 'CONTACT_UPDATED',
          campaignId: campaign?.id,
          source: sourceLabel,
          metadata: { provider: PROVIDER },
        },
      });

      return { contact: existing, isNew };
    });

    const emailQueued = await this.dispatchWelcomeEmail(campaign?.id ?? null, contact);

    this.logger.log('subscribe processed', {
      contactId: contact.id,
      status: isNew ? 'created' : 'existing',
      campaign: campaign?.slug,
      emailQueued,
    });

    return {
      success: true,
      status: isNew ? 'created' : 'existing',
      emailQueued,
    };
  }

  /**
   * Sends (or queues) the welcome email for a subscriber. Returns true if
   * the email was published to the queue for asynchronous delivery, false
   * if it was handled inline (or skipped because the campaign has no email
   * designed yet).
   */
  private async dispatchWelcomeEmail(
    campaignId: string | null,
    contact: { id: string; email: string | null; firstName: string | null; unsubscribed?: boolean },
  ): Promise<boolean> {
    if (!contact.email) return false;
    // Never email a contact who opted out.
    if (contact.unsubscribed) return false;

    // Prefer the queue: it decouples the HTTP request from delivery and
    // gives us retries. Falls back to inline send when no queue is set.
    if (this.queue.enabled) {
      return this.queue.publish({
        type: 'SUBSCRIBE_EMAIL',
        campaignId,
        contactId: contact.id,
        email: contact.email,
        firstName: contact.firstName,
      });
    }

    if (!campaignId) return false;
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return false;

    const outbound = renderCampaignEmail(campaign, {
      email: contact.email,
      firstName: contact.firstName,
    });
    if (!outbound) return false;

    await this.email.send(outbound);
    await this.prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        eventType: 'EMAIL_SENT',
        campaignId,
        source: campaign.slug,
        metadata: { subject: outbound.subject },
      },
    });
    return false;
  }
}
