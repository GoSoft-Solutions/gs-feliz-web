import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnalyticsModule } from './analytics/analytics.module';

/**
 * CORE module: Contacts, Campaigns, Analytics (a read-only aggregate view
 * over the two), and (via ContactsService) Contact Events. This is the
 * only module other modules should depend on for identity/campaign data
 * — see docs/architecture.md.
 */
@Module({
  imports: [ContactsModule, CampaignsModule, AnalyticsModule],
  exports: [ContactsModule, CampaignsModule, AnalyticsModule],
})
export class CoreModule {}
