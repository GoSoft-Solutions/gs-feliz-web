import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { SubscribeDto } from './dto/subscribe.dto';

/**
 * Public, unauthenticated endpoints called directly by the capture pages.
 * No API key — but rate-limited per IP to blunt abuse/spam, tighter than
 * the app-wide default.
 */
@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({
    summary: 'Subscribe from a capture page (creates/associates the contact and sends the welcome email)',
  })
  subscribe(@Body() dto: SubscribeDto): ReturnType<PublicService['subscribe']> {
    return this.publicService.subscribe(dto);
  }
}
