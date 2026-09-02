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
    html: applyTokens(campaign.emailHtml, tokens),
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_m, key: string) =>
    escapeHtml(tokens[key] ?? ''),
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
