import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum BulkEmailAudience {
  ALL = 'ALL',
  LEAD = 'LEAD',
  NEWSLETTER = 'NEWSLETTER',
}

export class SendBulkEmailDto {
  @ApiProperty({ example: 'Tu contenido de esta semana' })
  @IsString()
  @MaxLength(300)
  subject!: string;

  @ApiProperty({ example: '<p>Hola {{nombre}}, aquí tienes una actualización.</p>' })
  @IsString()
  html!: string;

  @ApiProperty({ enum: BulkEmailAudience, default: BulkEmailAudience.ALL })
  @IsEnum(BulkEmailAudience)
  audience!: BulkEmailAudience;

  @ApiPropertyOptional({ example: 'uuid-de-campana' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ example: 'Daniel Corral' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;
}
