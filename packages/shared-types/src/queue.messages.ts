/**
 * Contracts for messages exchanged over SQS between the API (producers)
 * and the worker (consumers). Both sides import these so the message
 * shape stays in sync.
 */

/**
 * Emitted when a contact subscribes through a campaign capture page
 * (danielcorral.com.mx/news/<slug>) and a welcome email should be sent.
 * The worker resolves the campaign + contact and delivers the email.
 */
export interface SubscribeEmailMessage {
  type: 'SUBSCRIBE_EMAIL';
  /** Campaign the subscriber came through (null for the generic /news signup). */
  campaignId: string | null;
  contactId: string;
  email: string;
  firstName?: string | null;
}

export type QueueMessage = SubscribeEmailMessage;
