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
  /** Full unsubscribe URL for this recipient; appended as an email footer. */
  unsubscribeUrl?: string;
}

/**
 * Renders a campaign's stored welcome email into a concrete OutboundEmail
 * for a given subscriber. Returns null when the campaign has no email
 * designed yet (no subject or no body) — the caller should then skip
 * sending rather than deliver a blank message.
 *
 * Supported template tokens (case-sensitive), substituted in both subject
 * and body: {{nombre}} and {{email}}. An unsubscribe footer is appended
 * when unsubscribeUrl is provided (required for compliant bulk email).
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
  const html = subscriber.unsubscribeUrl
    ? `${body}${unsubscribeFooter(subscriber.unsubscribeUrl)}`
    : body;

  return {
    to: subscriber.email,
    subject: applyTokens(campaign.emailSubject, tokens),
    html,
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
}

function unsubscribeFooter(url: string): string {
  return `<hr style="margin-top:32px;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#888;text-align:center;margin-top:16px">Recibes este correo porque te suscribiste en danielcorral.com.mx.<br/><a href="${url}" style="color:#888">Cancelar suscripción</a></p>`;
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
