import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Minimal mock shaped like the subset of PrismaService.contact /
 * contactEvent used by ContactsService. Using jest.fn() per method keeps
 * assertions explicit about what the service actually calls.
 */
function createPrismaMock() {
  return {
    contact: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    contactEvent: {
      findMany: jest.fn(),
    },
  };
}

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ContactsService);
  });

  describe('create', () => {
    it('normalizes email (lowercase + trim) before checking for duplicates and writing', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);
      prisma.contact.create.mockResolvedValue({ id: 'c1', email: 'juan@example.com' });

      await service.create({ email: '  Juan@Example.com  ', firstName: 'Juan' });

      expect(prisma.contact.findUnique).toHaveBeenCalledWith({ where: { email: 'juan@example.com' } });
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'juan@example.com' }) }),
      );
    });

    it('throws ConflictException when a contact with the same normalized email already exists', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'existing', email: 'juan@example.com' });

      await expect(service.create({ email: 'JUAN@example.com' })).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.contact.create).not.toHaveBeenCalled();
    });

    it('allows creating a contact with no email at all', async () => {
      prisma.contact.create.mockResolvedValue({ id: 'c2', email: null });

      await service.create({ firstName: 'Sin Email' });

      expect(prisma.contact.findUnique).not.toHaveBeenCalled();
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: undefined }) }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the contact (with sources included) when found', async () => {
      const contact = { id: 'c1', email: 'juan@example.com', sources: [] };
      prisma.contact.findUnique.mockResolvedValue(contact);

      const result = await service.findOne('c1');

      expect(result).toBe(contact);
      expect(prisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: { sources: true },
      });
    });
  });

  describe('update', () => {
    it('rejects updating to an email already used by a different contact', async () => {
      prisma.contact.findUnique
        .mockResolvedValueOnce({ id: 'c1', email: 'old@example.com', sources: [] }) // findOne() guard
        .mockResolvedValueOnce({ id: 'c2', email: 'taken@example.com' }); // dedupe check

      await expect(service.update('c1', { email: 'taken@example.com' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('allows updating a contact to keep its own email unchanged', async () => {
      prisma.contact.findUnique
        .mockResolvedValueOnce({ id: 'c1', email: 'same@example.com', sources: [] })
        .mockResolvedValueOnce({ id: 'c1', email: 'same@example.com' });
      prisma.contact.update.mockResolvedValue({ id: 'c1', email: 'same@example.com' });

      await service.update('c1', { email: 'same@example.com' });

      expect(prisma.contact.update).toHaveBeenCalled();
    });
  });
});
