import { Inject, Injectable, Logger } from '@nestjs/common';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import type { EnvConfig } from '@feliz/config';
import { ENV_CONFIG } from '../../config/app-config.module';
import type { OutboundEmail, SendResult } from './email.types';

/**
 * Sends transactional email behind a provider abstraction.
 *
 * The active provider is chosen by EMAIL_PROVIDER:
 *   - 'log'  → the email is logged, not sent. Lets the full capture →
 *              send flow run end-to-end while SES is still in sandbox or
 *              the domain isn't verified yet (demo-safe default).
 *   - 'ses'  → sends for real via AWS SES using SES_FROM_EMAIL as the
 *              envelope sender (must be a verified identity).
 *
 * Switching to real sending is a one-line env change; no code change.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('email');
  private readonly ses?: SESClient;

  constructor(@Inject(ENV_CONFIG) private readonly env: EnvConfig) {
    if (this.env.EMAIL_PROVIDER === 'ses') {
      this.ses = new SESClient({ region: this.env.AWS_REGION ?? 'us-east-1' });
    }
  }

  async send(email: OutboundEmail): Promise<SendResult> {
    if (this.env.EMAIL_PROVIDER === 'ses') {
      return this.sendViaSes(email);
    }
    return this.sendViaLog(email);
  }

  private sendViaLog(email: OutboundEmail): SendResult {
    this.logger.log('EMAIL (simulated — EMAIL_PROVIDER=log, not actually sent)', {
      to: email.to,
      subject: email.subject,
      fromName: email.fromName,
      replyTo: email.replyTo,
      htmlPreview: email.html.slice(0, 280),
    });
    return { provider: 'log' };
  }

  private async sendViaSes(email: OutboundEmail): Promise<SendResult> {
    const fromEmail = this.env.SES_FROM_EMAIL;
    if (!this.ses || !fromEmail) {
      // Misconfiguration: provider is 'ses' but no verified sender set.
      // Fail loud rather than silently dropping the email.
      throw new Error(
        'EMAIL_PROVIDER=ses requires SES_FROM_EMAIL to be set to a verified SES identity',
      );
    }

    const fromName = email.fromName ?? this.env.SES_FROM_NAME;
    const source = fromName ? `${sanitizeName(fromName)} <${fromEmail}>` : fromEmail;

    const result = await this.ses.send(
      new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [email.to] },
        ReplyToAddresses: email.replyTo ? [email.replyTo] : undefined,
        Message: {
          Subject: { Data: email.subject, Charset: 'UTF-8' },
          Body: { Html: { Data: email.html, Charset: 'UTF-8' } },
        },
      }),
    );

    this.logger.log('email sent via SES', { to: email.to, messageId: result.MessageId });
    return { provider: 'ses', messageId: result.MessageId };
  }
}

/**
 * Strips characters that would let a From display name break the email
 * header (CRLF injection) or the "Name <addr>" formatting.
 */
function sanitizeName(name: string): string {
  return name.replace(/[\r\n<>"]/g, '').trim();
}
