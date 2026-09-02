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

  return {
    to: subscriber.email,
    subject: applyTokens(campaign.emailSubject, tokens),
    html: applyTokens(campaign.emailHtml, tokens),
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
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
