import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ManyChatApiKeyGuard } from './guards/manychat-api-key.guard';
import { ManyChatService } from './manychat.service';
import { ManyChatContactDto } from './dto/manychat-contact.dto';

@ApiTags('integrations/manychat')
@Controller('integrations/manychat')
@UseGuards(ManyChatApiKeyGuard)
@ApiSecurity('manychat-api-key')
export class ManyChatController {
  constructor(private readonly manyChatService: ManyChatService) {}

  @Post('contacts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update a Contact from a ManyChat webhook (idempotent)',
  })
  @ApiHeader({ name: 'X-API-Key', required: true })
  createOrUpdateContact(@Body() dto: ManyChatContactDto) {
    return this.manyChatService.upsertContact(dto);
  }
}
