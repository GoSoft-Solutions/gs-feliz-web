import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@feliz/database';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { buildEmailDocument } from '../../email/email-render.util';
import { normalizeEmail } from '../../../common/utils/normalize-email.util';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { SendContactEmailDto } from './dto/send-email.dto';
import { BulkEmailAudience, SendBulkEmailDto } from './dto/send-bulk-email.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

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
        // id as a tiebreaker: contacts created in bulk share a createdAt,
        // and without a total order pages can repeat or skip rows.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Include the signup source(s) and the related campaign so the admin
        // list can show FUENTE (e.g. "Instagram") and the campaign name.
        include: {
          sources: {
            orderBy: { createdAt: 'desc' },
            include: { campaign: { select: { id: true, name: true, slug: true, source: true } } },
          },
        },
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
      include: {
        sources: {
          orderBy: { createdAt: 'desc' },
          include: { campaign: { select: { id: true, name: true, slug: true, source: true } } },
        },
      },
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

  /**
   * Permanently deletes a contact and its related sources/events. Used from
   * the admin to clean up test or unwanted contacts. Irreversible.
   */
  async remove(id: string): Promise<{ success: true }> {
    await this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.contactEvent.deleteMany({ where: { contactId: id } }),
      this.prisma.contactSource.deleteMany({ where: { contactId: id } }),
      this.prisma.contact.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  /**
   * Sends a one-off personalized email to a single contact from the admin.
  * Respects unsubscribe status and records an EMAIL_SENT event.
   */
  async sendCustomEmail(id: string, dto: SendContactEmailDto): Promise<{ success: true }> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException(`Contact "${id}" not found`);
    if (!contact.email) throw new BadRequestException('This contact has no email address');
    if (contact.unsubscribed) throw new BadRequestException('This contact is unsubscribed');

    const tokens: Record<string, string> = {
      nombre: contact.firstName?.trim() || 'Hola',
      email: contact.email,
    };
    const applyTokens = (t: string) =>
      t.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_m, k: string) => tokens[k] ?? '');

    await this.email.send({
      to: contact.email,
      subject: applyTokens(dto.subject),
      html: buildEmailDocument(applyTokens(dto.html), contact.email),
      fromName: dto.fromName,
    });

    await this.prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        eventType: 'EMAIL_SENT',
        source: 'admin',
        metadata: { subject: applyTokens(dto.subject), manual: true },
      },
    });

    return { success: true };
  }

  async sendBulkEmail(dto: SendBulkEmailDto): Promise<{ success: true; audience: BulkEmailAudience; matched: number; sent: number }> {
    const where: Prisma.ContactWhereInput = {
      email: { not: null },
      unsubscribed: false,
      ...(dto.audience === BulkEmailAudience.LEAD ? { status: 'LEAD' } : {}),
      ...(dto.audience === BulkEmailAudience.NEWSLETTER
        ? { sources: { some: { provider: 'LANDING', campaignId: null } } }
        : {}),
    };
    const contacts = await this.prisma.contact.findMany({ where });
    let sent = 0;
    const applyTokens = (template: string, contact: { firstName: string | null; email: string | null }) =>
      template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_match, key: string) => key === 'nombre' ? contact.firstName?.trim() || 'Hola' : contact.email ?? '');

    for (const contact of contacts) {
      if (!contact.email) continue;
      const subject = applyTokens(dto.subject, contact);
      const html = buildEmailDocument(applyTokens(dto.html, contact), contact.email);
      await this.email.send({ to: contact.email, subject, html, fromName: dto.fromName });
      await this.prisma.contactEvent.create({
        data: { contactId: contact.id, eventType: 'EMAIL_SENT', campaignId: dto.campaignId, source: 'bulk', metadata: { subject, audience: dto.audience } },
      });
      sent += 1;
    }

    return { success: true, audience: dto.audience, matched: contacts.length, sent };
  }
}
