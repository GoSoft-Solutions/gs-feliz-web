import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import type { EnvConfig } from '@feliz/config';
import type { RenderedEmail } from './email-render';

/**
 * Delivers email behind the same provider abstraction the API uses:
 *   EMAIL_PROVIDER=log → logs instead of sending (demo/sandbox-safe).
 *   EMAIL_PROVIDER=ses → sends via AWS SES (verified sender required).
 */
export class EmailSender {
  private readonly ses?: SESClient;

  constructor(private readonly env: EnvConfig) {
    if (env.EMAIL_PROVIDER === 'ses') {
      this.ses = new SESClient({ region: env.AWS_REGION ?? 'us-east-1' });
    }
  }

  async send(email: RenderedEmail): Promise<void> {
    if (this.env.EMAIL_PROVIDER !== 'ses') {
      console.log('[worker] EMAIL (simulated — EMAIL_PROVIDER=log, not sent)', {
        to: email.to,
        subject: email.subject,
      });
      return;
    }

    const fromEmail = this.env.SES_FROM_EMAIL;
    if (!this.ses || !fromEmail) {
      throw new Error('EMAIL_PROVIDER=ses requires SES_FROM_EMAIL to be set');
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

    console.log('[worker] email sent via SES', { to: email.to, messageId: result.MessageId });
  }
}

function sanitizeName(name: string): string {
  return name.replace(/[\r\n<>"]/g, '').trim();
}
