import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUrl, MaxLength } from 'class-validator';
import { ContentStatus } from '@feliz/shared-types';

/**
 * Registers a piece of content. Either it was uploaded to S3 (storageKey
 * set, obtained from the presigned-upload step) or it's an external link
 * the client pasted (downloadUrl set). The service validates that at least
 * one source is present.
 */
export class CreateContentDto {
  @ApiProperty({ example: 'Guía de finanzas personales' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'PDF con los primeros pasos para ordenar tus finanzas.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'Finanzas' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentType?: string;

  @ApiPropertyOptional({ example: 'guia-finanzas.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ example: 102400 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sizeBytes?: number;

  @ApiPropertyOptional({ description: 'S3 object key returned by the presigned-upload step.' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  storageKey?: string;

  @ApiPropertyOptional({ description: 'External download link (Drive/Dropbox/etc.).', example: 'https://drive.google.com/file/d/...' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  downloadUrl?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
