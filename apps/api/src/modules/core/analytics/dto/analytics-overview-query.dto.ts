import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyticsOverviewQueryDto {
  @ApiPropertyOptional({
    description: 'Size of the growth window in days (the "Nuevos contactos" chart).',
    default: 30,
    minimum: 7,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(180)
  days?: number;
}
