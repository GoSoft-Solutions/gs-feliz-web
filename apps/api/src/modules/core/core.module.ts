import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module';
import { CampaignsModule } from './campaigns/campaigns.module';

/**
 * CORE module: Contacts, Campaigns, and (via ContactsService) Contact
 * Events. This is the only module other modules should depend on for
 * identity/campaign data — see docs/architecture.md.
 */
@Module({
  imports: [ContactsModule, CampaignsModule],
  exports: [ContactsModule, CampaignsModule],
})
export class CoreModule {}
