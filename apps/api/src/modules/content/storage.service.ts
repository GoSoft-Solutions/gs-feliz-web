import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { EnvConfig } from '@feliz/config';
import { ENV_CONFIG } from '../../config/app-config.module';

export interface PresignedUpload {
  /** Pre-authorized URL the browser PUTs the file bytes to. */
  uploadUrl: string;
  /** S3 object key to persist on the ContentItem after upload succeeds. */
  storageKey: string;
}

/**
 * Wraps S3 for content storage. The browser uploads files directly to S3
 * using a presigned PUT URL (the file never passes through the API), and
 * downloads use a presigned GET URL. This keeps the API stateless and
 * avoids proxying large files.
 *
 * When CONTENT_BUCKET is not configured the service reports disabled and
 * callers fall back to external links only.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger('storage:s3');
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly expiry: number;

  constructor(@Inject(ENV_CONFIG) env: EnvConfig) {
    this.bucket = env.CONTENT_BUCKET;
    this.expiry = env.S3_URL_EXPIRY_SECONDS;
    if (this.bucket) {
      this.s3 = new S3Client({ region: env.AWS_REGION ?? 'us-east-1' });
    }
  }

  get enabled(): boolean {
    return Boolean(this.s3 && this.bucket);
  }

  /**
   * Creates a presigned PUT URL for uploading a file. The key is namespaced
   * by date and a random id to avoid collisions and keep the bucket tidy.
   */
  async createUploadUrl(fileName: string, contentType?: string): Promise<PresignedUpload> {
    this.assertEnabled();
    const safeName = sanitizeFileName(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const storageKey = `content/${datePrefix}/${randomUUID()}-${safeName}`;

    const uploadUrl = await getSignedUrl(
      this.s3!,
      new PutObjectCommand({
        Bucket: this.bucket!,
        Key: storageKey,
        ContentType: contentType,
      }),
      { expiresIn: this.expiry },
    );

    return { uploadUrl, storageKey };
  }

  /** Creates a presigned GET URL so an end user can download the object. */
  async createDownloadUrl(storageKey: string, downloadName?: string): Promise<string> {
    this.assertEnabled();
    return getSignedUrl(
      this.s3!,
      new GetObjectCommand({
        Bucket: this.bucket!,
        Key: storageKey,
        ResponseContentDisposition: downloadName
          ? `attachment; filename="${sanitizeFileName(downloadName)}"`
          : undefined,
      }),
      { expiresIn: this.expiry },
    );
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.s3!.send(new DeleteObjectCommand({ Bucket: this.bucket!, Key: storageKey }));
    } catch (err) {
      // Deleting the DB row should not fail if the object is already gone.
      this.logger.warn('failed to delete S3 object (continuing)', {
        storageKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error('CONTENT_BUCKET is not configured — file uploads are disabled');
    }
  }
}

function sanitizeFileName(name: string): string {
  // Keep it readable but safe for an S3 key and a Content-Disposition header.
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 180) || 'file';
}
