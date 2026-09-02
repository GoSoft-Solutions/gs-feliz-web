import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Payload sent from the public capture pages
 * (danielcorral.com.mx/news and /news/<slug>). Deliberately minimal —
 * this endpoint is unauthenticated, so it only accepts the fields it
 * strictly needs and rejects everything else (whitelist validation).
 */
export class SubscribeDto {
  @ApiProperty({ example: 'israel@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiPropertyOptional({ example: 'Israel' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'guia-gratuita',
    description: 'Campaign slug from the capture URL. Omitted for the generic /news signup.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(SLUG_REGEX, { message: 'campaignSlug must be a valid slug (e.g. "guia-gratuita")' })
  campaignSlug?: string;
}
