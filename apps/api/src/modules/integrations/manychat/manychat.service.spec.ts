import { Test, TestingModule } from '@nestjs/testing';
import { ManyChatService } from './manychat.service';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Mocks the subset of Prisma used by ManyChatService, including a fake
 * $transaction that just runs the callback against the same mocked
 * client (good enough for unit-level assertions; the real transactional
 * behavior against Postgres is covered by the e2e tests).
 */
function createPrismaMock() {
  const client = {
    campaign: { findUnique: jest.fn() },
    contactSource: { findUnique: jest.fn(), upsert: jest.fn() },
    contact: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    contactEvent: { create: jest.fn() },
  };

  return {
    ...client,
    $transaction: jest.fn((callback: (tx: typeof client) => unknown) => callback(client)),
  };
}

describe('ManyChatService', () => {
  let service: ManyChatService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ManyChatService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ManyChatService);
  });

  const baseDto = {
    external_id: '123456789',
    first_name: 'Juan',
    email: 'juan@example.com',
    source: 'instagram',
    campaign: 'guia-gratuita',
  };

  it('creates a new Contact + ContactSource + LEAD_CREATED event on first capture', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', slug: 'guia-gratuita' });
    prisma.contactSource.findUnique.mockResolvedValue(null);
    prisma.contact.findUnique.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'contact-1', email: 'juan@example.com' });

    const result = await service.upsertContact(baseDto);

    expect(result).toEqual({ success: true, contact_id: 'contact-1', status: 'created' });
    expect(prisma.contact.create).toHaveBeenCalledTimes(1);
    expect(prisma.contactSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { provider_externalId: { provider: 'MANYCHAT', externalId: '123456789' } },
        create: expect.objectContaining({ contactId: 'contact-1', campaignId: 'camp-1' }),
      }),
    );
    expect(prisma.contactEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'LEAD_CREATED' }) }),
    );
  });

  it('is idempotent: calling twice with the same external_id never creates a second Contact', async () => {
    const existingContact = { id: 'contact-1', email: 'juan@example.com', firstName: 'Juan', lastName: null, phone: null };

    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', slug: 'guia-gratuita' });
    // Second call: the source already exists and resolves back to the same contact.
    prisma.contactSource.findUnique.mockResolvedValue({
      contact: existingContact,
    });
    prisma.contact.update.mockResolvedValue(existingContact);

    const result = await service.upsertContact(baseDto);

    expect(result).toEqual({ success: true, contact_id: 'contact-1', status: 'updated' });
    expect(prisma.contact.create).not.toHaveBeenCalled();
    expect(prisma.contactEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'CONTACT_UPDATED' }) }),
    );
  });

  it('resolves to an existing Contact by email when external_id is new but the email matches', async () => {
    const existingContact = { id: 'contact-existing', email: 'juan@example.com', firstName: null, lastName: null, phone: null };

    prisma.campaign.findUnique.mockResolvedValue(null);
    prisma.contactSource.findUnique.mockResolvedValue(null); // new external_id
    prisma.contact.findUnique.mockResolvedValue(existingContact); // but email matches
    prisma.contact.update.mockResolvedValue(existingContact);

    const result = await service.upsertContact({ ...baseDto, campaign: undefined });

    expect(result.status).toBe('updated');
    expect(result.contact_id).toBe('contact-existing');
    expect(prisma.contact.create).not.toHaveBeenCalled();
  });

  it('creates the contact without a campaign association when the campaign slug does not exist', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);
    prisma.contactSource.findUnique.mockResolvedValue(null);
    prisma.contact.findUnique.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'contact-2', email: 'juan@example.com' });

    const result = await service.upsertContact({ ...baseDto, campaign: 'does-not-exist' });

    expect(result.status).toBe('created');
    expect(prisma.contactSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ campaignId: undefined }) }),
    );
  });

  it('works with no email at all (only external_id is required)', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);
    prisma.contactSource.findUnique.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'contact-3', email: null });

    const result = await service.upsertContact({ external_id: 'no-email-id' });

    expect(result.status).toBe('created');
    expect(prisma.contact.findUnique).not.toHaveBeenCalled();
  });
});
