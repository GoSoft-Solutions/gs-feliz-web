import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ContentItem } from '@feliz/database';
import { PrismaService } from '../../database/prisma.service';
import { StorageService, type PresignedUpload } from './storage.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ListContentQueryDto, PresignUploadDto } from './dto/presign-upload.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Step 1 of an upload: hand the browser a presigned S3 PUT URL. */
  requestUpload(dto: PresignUploadDto): Promise<PresignedUpload> {
    if (!this.storage.enabled) {
      throw new BadRequestException(
        'File uploads are not enabled (CONTENT_BUCKET unset). Use an external download link instead.',
      );
    }
    return this.storage.createUploadUrl(dto.fileName, dto.contentType);
  }

  /**
   * Step 2 of an upload (or a pure external link): register the content.
   * Requires either an uploaded object (storageKey) or an external
   * downloadUrl — otherwise there's nothing to hand to end users.
   */
  create(dto: CreateContentDto): Prisma.PrismaPromise<ContentItem> {
    if (!dto.storageKey && !dto.downloadUrl) {
      throw new BadRequestException('Provide either an uploaded file (storageKey) or a downloadUrl');
    }

    return this.prisma.contentItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        contentType: dto.contentType,
        fileName: dto.fileName,
        sizeBytes: dto.sizeBytes,
        storageKey: dto.storageKey,
        downloadUrl: dto.downloadUrl,
        status: dto.status ?? 'PUBLISHED',
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(query: ListContentQueryDto) {
    const items = await this.prisma.contentItem.findMany({
      where: query.category ? { category: query.category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { items, total: items.length };
  }

  async findOne(id: string): Promise<ContentItem> {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Content "${id}" not found`);
    return item;
  }

  async update(id: string, dto: UpdateContentDto): Promise<ContentItem> {
    await this.findOne(id);
    return this.prisma.contentItem.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.contentType !== undefined ? { contentType: dto.contentType } : {}),
        ...(dto.fileName !== undefined ? { fileName: dto.fileName } : {}),
        ...(dto.sizeBytes !== undefined ? { sizeBytes: dto.sizeBytes } : {}),
        ...(dto.storageKey !== undefined ? { storageKey: dto.storageKey } : {}),
        ...(dto.downloadUrl !== undefined ? { downloadUrl: dto.downloadUrl } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    if (item.storageKey) {
      await this.storage.deleteObject(item.storageKey);
    }
    await this.prisma.contentItem.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Resolves a shareable download link for an item: the external URL if it
   * has one, otherwise a freshly presigned S3 GET URL.
   */
  async getDownloadLink(id: string): Promise<{ url: string }> {
    const item = await this.findOne(id);
    if (item.downloadUrl) return { url: item.downloadUrl };
    if (item.storageKey && this.storage.enabled) {
      const url = await this.storage.createDownloadUrl(item.storageKey, item.fileName ?? undefined);
      return { url };
    }
    throw new NotFoundException('This content has no downloadable file');
  }
}
