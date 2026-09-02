import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@feliz/database';
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

  async subscribe(dto: SubscribeDto): Promise<SubscribeResult> {
    const email = normalizeEmail(dto.email);
    if (!email) {
      // IsEmail on the DTO already guards this; belt-and-suspenders.
      throw new Error('A valid email is required');
    }

    const campaign = dto.campaignSlug
      ? await this.prisma.campaign.findUnique({ where: { slug: dto.campaignSlug } })
      : null;

    if (dto.campaignSlug && !campaign) {
      this.logger.warn('subscribe with unknown campaign slug — proceeding without association', {
        slug: dto.campaignSlug,
      });
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

      // Record where this signup came from. Keyed on (provider, external_id);
      // we use the contact id as the external id so re-subscribing through
      // the same page updates the row instead of duplicating it.
      await tx.contactSource.upsert({
        where: { provider_externalId: { provider: PROVIDER, externalId: existing.id } },
        create: {
          contactId: existing.id,
          provider: PROVIDER,
          externalId: existing.id,
          source: campaign?.slug ?? 'news',
          campaignId: campaign?.id,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          source: campaign?.slug ?? 'news',
          campaignId: campaign?.id ?? undefined,
        },
      });

      await tx.contactEvent.create({
        data: {
          contactId: existing.id,
          eventType: isNew ? 'LEAD_CREATED' : 'CONTACT_UPDATED',
          campaignId: campaign?.id,
          source: campaign?.slug ?? 'news',
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
    contact: { id: string; email: string | null; firstName: string | null },
  ): Promise<boolean> {
    if (!contact.email) return false;

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
