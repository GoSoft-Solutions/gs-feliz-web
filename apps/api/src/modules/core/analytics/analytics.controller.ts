import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService, type AnalyticsOverview } from './analytics.service';
import { AnalyticsOverviewQueryDto } from './dto/analytics-overview-query.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Aggregated stats for the admin Analytics dashboard' })
  overview(@Query() query: AnalyticsOverviewQueryDto): Promise<AnalyticsOverview> {
    return this.analyticsService.overview(query.days);
  }
}
