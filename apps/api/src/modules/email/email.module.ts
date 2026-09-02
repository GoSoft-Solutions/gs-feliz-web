import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { QueuePublisherService } from './queue-publisher.service';

/**
 * EMAIL module: exposes EmailService (provider-abstracted transactional
 * email) and QueuePublisherService (SQS publish with inline fallback).
 * Depends only on the global config module for its settings.
 */
@Module({
  providers: [EmailService, QueuePublisherService],
  exports: [EmailService, QueuePublisherService],
})
export class EmailModule {}
