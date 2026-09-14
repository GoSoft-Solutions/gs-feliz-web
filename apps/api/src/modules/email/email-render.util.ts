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

// --- Brand ---------------------------------------------------------------
// Kept in one place so the admin preview (apps/admin/components/email-editor.tsx)
// and the actually-delivered email stay visually in sync when either changes.
// Matches the site's actual palette (apps/landing/css/styles.css :root) —
// black + ivory + orange, orange reserved for the one accent (the CTA
// button and inline links), not the header.
const BRAND_NAME = 'DANIEL CORRAL';
const COLOR_BLACK = '#0A0A0A';
const COLOR_IVORY = '#F0EDE6';
const COLOR_ORANGE = '#F4711A';
const COLOR_TEXT = '#222222';

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

/**
 * Wraps a body of rich-text HTML (as produced by the admin's campaign and
 * newsletter editor) into a complete, branded HTML email document.
 *
 * Two things make the delivered email match the admin's preview instead
 * of arriving unstyled:
 *  1. Every wrapper element is a table with fully INLINE styles. Real
 *     inboxes (Gmail webmail/app chief among them) strip <style> blocks
 *     that live in the body — inline is the only styling that reliably
 *     survives across clients.
 *  2. `styleContent` walks the editor's raw output — plain <p>/<h3>/<ul>/
 *     <a> tags with no styling of their own, since contentEditable never
 *     adds any — and injects the brand's inline styles onto them, without
 *     touching anything that already carries its own (e.g. the CTA button
 *     built by the admin's composeHtml()).
 */
export function buildEmailDocument(body: string): string {
  const styledBody = styleContent(body);
  // body's text is already HTML-escaped (it comes from contentEditable's
  // innerHTML), so the tag-stripped preheader needs no re-escaping.
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
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Short plain-text snippet shown by inbox clients next to the subject line. */
function buildPreheader(body: string): string {
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

// --- Inline-style injection ------------------------------------------------
// The rich-text editor's contentEditable output never carries its own
// styling (a bare <p>, <h3>, <ul><li>, <a>, ...). This applies the brand's
// styling as inline `style` attributes so it survives real inboxes.
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

/**
 * Adds `style="..."` to every opening `<tag>` in `html` that doesn't
 * already have one, and MERGES into ones that do (e.g. the CTA button's
 * anchor, or a `<p style="text-align:center">` from the editor's align
 * buttons) by prepending our defaults before the existing declarations —
 * since a later declaration of the same CSS property wins inside a single
 * `style` attribute, whatever the element already declares always takes
 * precedence over our defaults.
 */
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
