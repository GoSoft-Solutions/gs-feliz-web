import type { OutboundEmail } from './email.types';

export interface CampaignEmailSource {
  emailSubject: string | null;
  emailHtml: string | null;
  emailFromName: string | null;
  emailReplyTo: string | null;
}

export interface SubscriberContext {
  email: string;
  firstName?: string | null;
}

/**
 * Renders a campaign's stored welcome email into a concrete OutboundEmail
 * for a given subscriber. Returns null when the campaign has no email
 * designed yet (no subject or no body) — the caller should then skip
 * sending rather than deliver a blank message.
 *
 * Supported template tokens (case-sensitive), substituted in both subject
 * and body: {{nombre}} and {{email}}.
 */
export function renderCampaignEmail(
  campaign: CampaignEmailSource,
  subscriber: SubscriberContext,
): OutboundEmail | null {
  if (!campaign.emailSubject || !campaign.emailHtml) {
    return null;
  }

  const tokens: Record<string, string> = {
    nombre: subscriber.firstName?.trim() || 'Hola',
    email: subscriber.email,
  };

  const body = applyTokens(campaign.emailHtml, tokens);
  const html = buildEmailDocument(body);

  return {
    to: subscriber.email,
    subject: applyTokens(campaign.emailSubject, tokens),
    html,
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
}

export function buildEmailDocument(body: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;color:#374151">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f3f4f6">
      <tr>
        <td align="center" style="padding:32px 12px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e6e1da;border-radius:12px;overflow:hidden">
            <tr><td style="height:6px;background:#F4711A;font-size:0;line-height:0">&nbsp;</td></tr>
            <tr>
              <td align="center" style="padding:36px 24px;background:#123B66;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:5px">
                DANIEL CORRAL
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px 50px;font-size:16px;line-height:1.75;color:#374151">
                <style>p{margin:0 0 20px}a{color:#F4711A}</style>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_match, key: string) =>
    escapeHtml(tokens[key] ?? ''),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
