/**
 * FELIZ Worker — SQS consumer.
 *
 * Long-polls the subscribe queue and delivers campaign welcome emails
 * asynchronously (decoupled from the API's HTTP request). For each
 * SUBSCRIBE_EMAIL message it resolves the campaign + contact, renders the
 * email, sends it (SES or logged), records an EMAIL_SENT event, then
 * deletes the message. Messages that fail are left on the queue and
 * retried by SQS (and eventually dead-lettered per the queue config).
 *
 * When SQS_QUEUE_URL is not set the worker logs and exits — in that mode
 * the API sends inline instead, so there's nothing to consume.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../.env') });
loadEnv({ path: resolve(__dirname, '../../../.env') });

import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs';
import { PrismaClient } from '@feliz/database';
import { validateEnv, type EnvConfig } from '@feliz/config';
import type { QueueMessage } from '@feliz/shared-types';
import { renderCampaignEmail } from './email-render';
import { EmailSender } from './email-sender';

const prisma = new PrismaClient();

async function handleSubscribeEmail(
  env: EnvConfig,
  sender: EmailSender,
  msg: Extract<QueueMessage, { type: 'SUBSCRIBE_EMAIL' }>,
): Promise<void> {
  if (!msg.campaignId) {
    console.log('[worker] subscribe without campaign — no welcome email to send', {
      contactId: msg.contactId,
    });
    return;
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: msg.campaignId } });
  if (!campaign) {
    console.warn('[worker] campaign not found, skipping', { campaignId: msg.campaignId });
    return;
  }

  const email = renderCampaignEmail(campaign, { email: msg.email, firstName: msg.firstName });
  if (!email) {
    console.log('[worker] campaign has no email designed yet, skipping', {
      campaignId: msg.campaignId,
    });
    return;
  }

  await sender.send(email);

  await prisma.contactEvent.create({
    data: {
      contactId: msg.contactId,
      eventType: 'EMAIL_SENT',
      campaignId: campaign.id,
      source: campaign.slug,
      metadata: { subject: email.subject },
    },
  });
}

async function processMessage(env: EnvConfig, sender: EmailSender, raw: Message): Promise<void> {
  const body = JSON.parse(raw.Body ?? '{}') as QueueMessage;
  switch (body.type) {
    case 'SUBSCRIBE_EMAIL':
      await handleSubscribeEmail(env, sender, body);
      break;
    default:
      console.warn('[worker] unknown message type, ignoring', { body });
  }
}

async function main(): Promise<void> {
  const env = validateEnv(process.env);

  if (!env.SQS_QUEUE_URL) {
    console.log('[worker] SQS_QUEUE_URL not set — API sends email inline; worker has nothing to do.');
    return;
  }

  const sqs = new SQSClient({ region: env.AWS_REGION ?? 'us-east-1' });
  const sender = new EmailSender(env);
  const queueUrl = env.SQS_QUEUE_URL;

  console.log('[worker] started — polling queue', { queueUrl });

  // Long-poll loop. Runs until the process is stopped by the platform.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }),
    );

    if (!Messages || Messages.length === 0) continue;

    for (const message of Messages) {
      try {
        await processMessage(env, sender, message);
        await sqs.send(
          new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }),
        );
      } catch (err) {
        // Leave the message on the queue for SQS to retry / dead-letter.
        console.error('[worker] failed to process message, leaving for retry', {
          messageId: message.MessageId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}

main()
  .catch((err) => {
    console.error('[worker] fatal error', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
