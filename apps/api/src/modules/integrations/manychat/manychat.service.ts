import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@feliz/database';
import { PrismaService } from '../../../database/prisma.service';
import { normalizeEmail } from '../../../common/utils/normalize-email.util';
import { ManyChatContactDto } from './dto/manychat-contact.dto';

const PROVIDER = 'MANYCHAT';

export interface ManyChatUpsertResult {
  success: true;
  contact_id: string;
  status: 'created' | 'updated';
}

@Injectable()
export class ManyChatService {
  private readonly logger = new Logger('integration:manychat');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent create-or-update of a Contact from a ManyChat payload.
   *
   * Idempotency guarantee: calling this twice with the same external_id
   * never creates a second Contact — it always resolves to the same
   * Contact and just records a new CONTACT_UPDATED event.
   *
   * See docs/integrations/manychat.md for the full contract.
   */
  async upsertContact(dto: ManyChatContactDto): Promise<ManyChatUpsertResult> {
    const email = normalizeEmail(dto.email);
    const campaign = dto.campaign ? await this.prisma.campaign.findUnique({ where: { slug: dto.campaign } }) : null;

    if (dto.campaign && !campaign) {
      this.logger.warn(`campaign slug not found, contact will be created without campaign association`, {
        campaign: dto.campaign,
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1: resolve identity. Prefer the (provider, external_id) match
      // — it's the strongest signal that this is the *same* ManyChat
      // subscriber writing again. Fall back to email only if this is the
      // first time we see this external_id.
      const existingSource = await tx.contactSource.findUnique({
        where: { provider_externalId: { provider: PROVIDER, externalId: dto.external_id } },
        include: { contact: true },
      });

      let contact = existingSource?.contact ?? null;
      let isNewContact = false;

      if (!contact && email) {
        contact = await tx.contact.findUnique({ where: { email } });
      }

      if (!contact) {
        isNewContact = true;
        contact = await tx.contact.create({
          data: {
            email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            phone: dto.phone,
            metadata: {},
          },
        });
      } else {
        // Backfill any new information ManyChat sends on a returning
        // contact, without clobbering existing values with blanks.
        contact = await tx.contact.update({
          where: { id: contact.id },
          data: {
            ...(email && !contact.email ? { email } : {}),
            ...(dto.first_name && !contact.firstName ? { firstName: dto.first_name } : {}),
            ...(dto.last_name && !contact.lastName ? { lastName: dto.last_name } : {}),
            ...(dto.phone && !contact.phone ? { phone: dto.phone } : {}),
          },
        });
      }

      // Step 2: upsert the ContactSource row that ties this external
      // identity to the Contact (this is what makes step 1 work on the
      // next call).
      await tx.contactSource.upsert({
        where: { provider_externalId: { provider: PROVIDER, externalId: dto.external_id } },
        create: {
          contactId: contact.id,
          provider: PROVIDER,
          externalId: dto.external_id,
          source: dto.source,
          campaignId: campaign?.id,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
        update: {
          source: dto.source,
          campaignId: campaign?.id ?? undefined,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      // Step 3: record the event history entry for this capture.
      await tx.contactEvent.create({
        data: {
          contactId: contact.id,
          eventType: isNewContact ? 'LEAD_CREATED' : 'CONTACT_UPDATED',
          campaignId: campaign?.id,
          source: dto.source,
          metadata: { provider: PROVIDER, external_id: dto.external_id },
        },
      });

      return { contact, isNewContact };
    });

    this.logger.log('manychat contact upserted', {
      contact_id: result.contact.id,
      campaign: dto.campaign,
      status: result.isNewContact ? 'created' : 'updated',
    });

    return {
      success: true,
      contact_id: result.contact.id,
      status: result.isNewContact ? 'created' : 'updated',
    };
  }
}
