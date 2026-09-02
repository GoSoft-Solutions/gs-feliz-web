/**
 * A single outbound email, already fully rendered and ready to deliver.
 * Provider-agnostic on purpose: the same shape is produced whether we
 * later send it via SES, SMTP, or just log it.
 */
export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  /** Display name shown to the recipient (falls back to a platform default). */
  fromName?: string;
  /** Optional Reply-To address (e.g. the client's real inbox). */
  replyTo?: string;
}

export interface SendResult {
  /** Provider that handled delivery ('log' when simulated). */
  provider: 'log' | 'ses';
  /** Provider message id when available (SES MessageId), else undefined. */
  messageId?: string;
}
