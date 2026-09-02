import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';

// See contacts.controller.ts for why these explicit return types exist
// (works around TS2742 under pnpm's isolated node_modules layout).
type CampaignsServiceReturn<K extends keyof CampaignsService> = ReturnType<CampaignsService[K]>;

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  create(@Body() dto: CreateCampaignDto): CampaignsServiceReturn<'create'> {
    return this.campaignsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@Query() query: ListCampaignsQueryDto): CampaignsServiceReturn<'findAll'> {
    return this.campaignsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a campaign by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): CampaignsServiceReturn<'findOne'> {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign (activate/pause/archive/edit)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ): CampaignsServiceReturn<'update'> {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(@Param('id', ParseUUIDPipe) id: string): CampaignsServiceReturn<'remove'> {
    return this.campaignsService.remove(id);
  }
}
