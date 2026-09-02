import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { StorageService } from './storage.service';

/**
 * CONTENT module: manages downloadable content (PDFs and any file type).
 * Files live in S3 (via StorageService, presigned direct upload/download);
 * metadata lives in the content_items table.
 */
@Module({
  controllers: [ContentController],
  providers: [ContentService, StorageService],
  exports: [ContentService],
})
export class ContentModule {}
