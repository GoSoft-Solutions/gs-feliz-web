import { Inject, Injectable, Logger } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { EnvConfig } from '@feliz/config';
import type { QueueMessage } from '@feliz/shared-types';
import { ENV_CONFIG } from '../../config/app-config.module';

/**
 * Publishes messages to SQS when a queue is configured.
 *
 * When SQS_QUEUE_URL is empty (local/demo), publishing is a no-op that
 * returns false, signalling the caller to handle the work inline instead.
 * This lets the same subscribe flow run with or without SQS.
 */
@Injectable()
export class QueuePublisherService {
  private readonly logger = new Logger('queue');
  private readonly sqs?: SQSClient;
  private readonly queueUrl?: string;

  constructor(@Inject(ENV_CONFIG) env: EnvConfig) {
    this.queueUrl = env.SQS_QUEUE_URL;
    if (this.queueUrl) {
      this.sqs = new SQSClient({ region: env.AWS_REGION ?? 'us-east-1' });
    }
  }

  /** True when a queue is configured and messages will be published to it. */
  get enabled(): boolean {
    return Boolean(this.sqs && this.queueUrl);
  }

  /**
   * Publishes a message to the queue. Returns true if it was published,
   * false if no queue is configured (caller should process inline).
   */
  async publish(message: QueueMessage): Promise<boolean> {
    if (!this.sqs || !this.queueUrl) {
      return false;
    }

    const result = await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );

    this.logger.log('message published to queue', {
      type: message.type,
      messageId: result.MessageId,
    });
    return true;
  }
}
