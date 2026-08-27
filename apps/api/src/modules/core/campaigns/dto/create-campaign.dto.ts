import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CampaignStatus } from '@feliz/shared-types';

// lowercase, digits, hyphens only — matches how slugs are used in URLs
// and in the ManyChat "campaign" field (e.g. "guia-gratuita").
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateCampaignDto {
  @ApiProperty({ example: 'Guía Gratuita' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'guia-gratuita' })
  @IsString()
  @MaxLength(200)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase alphanumeric with hyphens (e.g. "guia-gratuita")' })
  slug!: string;

  @ApiPropertyOptional({ example: 'instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, default: CampaignStatus.DRAFT })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
