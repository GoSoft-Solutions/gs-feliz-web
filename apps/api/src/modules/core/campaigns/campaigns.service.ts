import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@feliz/database';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`A campaign with slug "${dto.slug}" already exists`);
    }

    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        source: dto.source,
        status: dto.status,
        emailSubject: dto.emailSubject,
        emailHtml: dto.emailHtml,
        emailFromName: dto.emailFromName,
        emailReplyTo: dto.emailReplyTo,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  findAll(query: ListCampaignsQueryDto) {
    return this.prisma.campaign.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      throw new NotFoundException(`Campaign "${id}" not found`);
    }

    return campaign;
  }

  /** Used by the ManyChat integration to associate a contact to a campaign by slug. */
  findBySlug(slug: string): ReturnType<PrismaService['campaign']['findUnique']> {
    return this.prisma.campaign.findUnique({ where: { slug } });
  }

  async remove(id: string) {
    await this.findOne(id);
    // ContactSource.campaignId / ContactEvent.campaignId are ON DELETE SET
    // NULL, so removing a campaign keeps its contacts and history intact.
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.emailSubject !== undefined ? { emailSubject: dto.emailSubject } : {}),
        ...(dto.emailHtml !== undefined ? { emailHtml: dto.emailHtml } : {}),
        ...(dto.emailFromName !== undefined ? { emailFromName: dto.emailFromName } : {}),
        ...(dto.emailReplyTo !== undefined ? { emailReplyTo: dto.emailReplyTo } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  }
}
