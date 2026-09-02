import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Requests a presigned URL to upload a file directly to S3. */
export class PresignUploadDto {
  @ApiProperty({ example: 'guia-finanzas.pdf' })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentType?: string;
}

export class ListContentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;
}
