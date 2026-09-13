/**
 * Renders a campaign's stored welcome email into a concrete email for a
 * subscriber. Mirrors the logic used by the API for inline sends so both
 * paths produce identical output. Returns null when the campaign has no
 * email designed yet (caller skips sending).
 *
 * Supported tokens: {{nombre}} and {{email}}.
 */
export interface CampaignEmailSource {
  emailSubject: string | null;
  emailHtml: string | null;
  emailFromName: string | null;
  emailReplyTo: string | null;
}

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}

export function renderCampaignEmail(
  campaign: CampaignEmailSource,
  subscriber: { email: string; firstName?: string | null },
): RenderedEmail | null {
  if (!campaign.emailSubject || !campaign.emailHtml) {
    return null;
  }

  const tokens: Record<string, string> = {
    nombre: subscriber.firstName?.trim() || 'Hola',
    email: subscriber.email,
  };

  return {
    to: subscriber.email,
    subject: applyTokens(campaign.emailSubject, tokens),
    html: buildEmailDocument(applyTokens(campaign.emailHtml, tokens)),
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
}

function buildEmailDocument(body: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#374151">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f3f4f6">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <tr>
              <td align="center" style="padding:30px 24px;background:#111827;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:4px">
                DANIEL CORRAL
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;font-size:16px;line-height:1.7;color:#374151">
                ${body}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;line-height:1.5">
                danielcorral.com.mx
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
  return template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_m, key: string) =>
    escapeHtml(tokens[key] ?? ''),
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
