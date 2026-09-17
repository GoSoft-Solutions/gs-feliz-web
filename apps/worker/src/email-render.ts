import { buildUnsubscribeUrl } from './unsubscribe-util';

/**
 * Renders a campaign's stored welcome email into a concrete email for a
 * subscriber. Mirrors apps/api/src/modules/email/email-render.util.ts so
 * both the API's inline-send path and this worker's queued-send path
 * produce identical output. Returns null when the campaign has no email
 * designed yet (caller skips sending).
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

// Matches the site's actual palette (apps/landing/css/styles.css :root) —
// black + ivory + orange, orange reserved for the one accent (the CTA
// button and inline links), not the header.
const BRAND_NAME = 'DANIEL CORRAL';
const COLOR_BLACK = '#0A0A0A';
const COLOR_IVORY = '#F0EDE6';
const COLOR_ORANGE = '#F4711A';
const COLOR_TEXT = '#222222';

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
    html: buildEmailDocument(applyTokens(campaign.emailHtml, tokens), subscriber.email),
    fromName: campaign.emailFromName ?? undefined,
    replyTo: campaign.emailReplyTo ?? undefined,
  };
}

function buildEmailDocument(body: string, recipientEmail?: string): string {
  const styledBody = styleContent(body);
  const preheader = buildPreheader(body);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="margin:0;padding:0;background:#EEF1F5;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLOR_TEXT}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#EEF1F5">
      <tr>
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
            <tr>
              <td align="center" style="padding:44px 24px 40px;background:${COLOR_BLACK}">
                <span style="display:inline-block;font-size:24px;font-weight:700;letter-spacing:6px;color:${COLOR_IVORY}">${BRAND_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:46px 40px 50px;font-size:16px;line-height:1.75;color:${COLOR_TEXT}">
                ${styledBody}
              </td>
            </tr>
          </table>
          ${buildFooter(recipientEmail)}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildFooter(recipientEmail?: string): string {
  const unsubscribeUrl = recipientEmail ? safeUnsubscribeUrl(recipientEmail) : null;
  if (!unsubscribeUrl) return '';
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
            <tr>
              <td align="center" style="padding:18px 24px 0;font-size:11px;line-height:1.6;color:#ACA9A2">
                <a href="${unsubscribeUrl}" style="color:#ACA9A2;text-decoration:none">Cancelar suscripción</a>
              </td>
            </tr>
          </table>`;
}

function safeUnsubscribeUrl(email: string): string | null {
  try {
    const secret = process.env.UNSUBSCRIBE_SECRET || 'feliz-unsubscribe-dev-secret';
    const apiUrl = process.env.PUBLIC_API_URL || 'https://api.danielcorral.com.mx';
    return buildUnsubscribeUrl(apiUrl, email, secret);
  } catch {
    return null;
  }
}

function buildPreheader(body: string): string {
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

const TAG_STYLES: Record<string, string> = {
  div: `margin:0 0 20px;line-height:1.75;color:${COLOR_TEXT};font-size:16px`,
  p: `margin:0 0 20px;line-height:1.75;color:${COLOR_TEXT};font-size:16px`,
  h1: `margin:0 0 20px;font-size:26px;line-height:1.3;font-weight:700;color:${COLOR_BLACK}`,
  h2: `margin:28px 0 16px;font-size:22px;line-height:1.35;font-weight:700;color:${COLOR_BLACK}`,
  h3: `margin:28px 0 14px;font-size:19px;line-height:1.4;font-weight:700;color:${COLOR_BLACK}`,
  ul: `margin:0 0 20px;padding:0 0 0 22px;color:${COLOR_TEXT};line-height:1.75`,
  ol: `margin:0 0 20px;padding:0 0 0 22px;color:${COLOR_TEXT};line-height:1.75`,
  li: `margin:0 0 10px`,
  blockquote: `margin:0 0 20px;padding:14px 20px;border-left:3px solid ${COLOR_ORANGE};background:#FAF7F2;color:#5B6472;font-style:italic`,
  a: `color:${COLOR_ORANGE};font-weight:600;text-decoration:underline`,
};

function styleContent(html: string): string {
  let out = html;
  for (const [tag, style] of Object.entries(TAG_STYLES)) {
    out = applyInlineStyle(out, tag, style);
  }
  return out;
}

function applyInlineStyle(html: string, tag: string, style: string): string {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
  return html.replace(re, (_match, rawAttrs: string | undefined) => {
    const attrs = rawAttrs ?? '';
    const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i);
    if (styleMatch) {
      const merged = `${style};${styleMatch[1]}`;
      const nextAttrs = attrs.replace(/style\s*=\s*"[^"]*"/i, `style="${merged}"`);
      return `<${tag}${nextAttrs}>`;
    }
    return `<${tag}${attrs} style="${style}">`;
  });
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*(nombre|email)\s*\}\}/g, (_m, key: string) =>
    escapeHtml(tokens[key] ?? ''),
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
