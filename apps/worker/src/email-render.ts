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
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <tr>
              <td align="center" style="padding:40px 24px;background:#111827;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:4px">
                DANIEL CORRAL
              </td>
            </tr>
            <tr>
              <td style="padding:52px 44px 68px;font-size:16px;line-height:1.8;color:#374151">
                <style>p{margin:0 0 24px}h1,h2,h3{margin:0 0 22px}a{color:#F4711A}</style>
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
  return template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_m, key: string) =>
    escapeHtml(tokens[key] ?? ''),
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
