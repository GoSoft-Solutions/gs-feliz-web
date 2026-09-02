import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/**
 * PUBLIC module: unauthenticated endpoints for the capture pages
 * (danielcorral.com.mx/news and /news/<slug>). Owns the subscribe flow
 * that turns an anonymous email submission into a Contact + campaign
 * association + automatic welcome email.
 */
@Module({
  imports: [EmailModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
