import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
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

  // --- Welcome email (designed by the client in the admin console) ---
  // Optional so a campaign can be created as a DRAFT before its email is
  // designed. The automatic send is skipped until subject + html are set.
  @ApiPropertyOptional({ example: 'Tu guía gratuita está lista' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  emailSubject?: string;

  @ApiPropertyOptional({ example: '<h1>Hola</h1><p>Aquí está tu contenido...</p>' })
  @IsOptional()
  @IsString()
  emailHtml?: string;

  @ApiPropertyOptional({ example: 'Daniel Corral' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emailFromName?: string;

  @ApiPropertyOptional({ example: 'hola@danielcorral.com.mx' })
  @IsOptional()
  @IsEmail()
  emailReplyTo?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
