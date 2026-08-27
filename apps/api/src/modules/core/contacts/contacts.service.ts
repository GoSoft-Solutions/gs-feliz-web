import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@feliz/database';
import { PrismaService } from '../../../database/prisma.service';
import { normalizeEmail } from '../../../common/utils/normalize-email.util';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new Contact. Always normalizes the email before writing so
   * duplicates cannot be created by casing/whitespace differences (the
   * DB unique constraint is the last line of defense, this is the first).
   */
  async create(dto: CreateContactDto) {
    const email = normalizeEmail(dto.email);

    if (email) {
      const existing = await this.prisma.contact.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException(`A contact with email "${email}" already exists`);
      }
    }

    return this.prisma.contact.create({
      data: {
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(query: ListContactsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ContactWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!contact) {
      throw new NotFoundException(`Contact "${id}" not found`);
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);

    const email = dto.email !== undefined ? normalizeEmail(dto.email) : undefined;

    if (email) {
      const existing = await this.prisma.contact.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`A contact with email "${email}" already exists`);
      }
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async findEvents(contactId: string) {
    await this.findOne(contactId);

    return this.prisma.contactEvent.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
