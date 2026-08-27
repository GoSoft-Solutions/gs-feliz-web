import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCampaignDto } from './create-campaign.dto';

// slug is immutable after creation: campaigns are referenced by slug from
// external systems (ManyChat), so changing it would silently break those
// integrations without any error surfacing on either side.
export class UpdateCampaignDto extends PartialType(OmitType(CreateCampaignDto, ['slug'] as const)) {}
