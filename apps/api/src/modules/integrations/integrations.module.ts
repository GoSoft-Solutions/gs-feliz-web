import { Module } from '@nestjs/common';
import { ManyChatModule } from './manychat/manychat.module';

/**
 * INTEGRATIONS module: groups all external-system adapters. Only
 * ManyChat is active today (Phase 3). Stripe/Google/SES modules are
 * added here when their respective phases start — see docs/roadmap.md.
 */
@Module({
  imports: [ManyChatModule],
})
export class IntegrationsModule {}
