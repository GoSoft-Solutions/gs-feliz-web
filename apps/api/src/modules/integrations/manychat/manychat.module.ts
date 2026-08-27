import { Module } from '@nestjs/common';
import { ManyChatController } from './manychat.controller';
import { ManyChatService } from './manychat.service';
import { ManyChatApiKeyGuard } from './guards/manychat-api-key.guard';

@Module({
  controllers: [ManyChatController],
  providers: [ManyChatService, ManyChatApiKeyGuard],
})
export class ManyChatModule {}
