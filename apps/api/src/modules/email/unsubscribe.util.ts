import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Builds a per-recipient unsubscribe token so an unsubscribe link only
 * works for its intended email. It's an HMAC of the email with a server
 * secret — no database lookup needed to validate, and it can't be forged
 * without the secret.
 */
export function makeUnsubscribeToken(email: string, secret: string): string {
  return createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string, secret: string): boolean {
  const expected = makeUnsubscribeToken(email, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Builds the full unsubscribe URL for an email + site base.
 * Points to the public API endpoint that flags the contact as opted out.
 */
export function buildUnsubscribeUrl(apiBaseUrl: string, email: string, secret: string): string {
  const token = makeUnsubscribeToken(email, secret);
  const params = new URLSearchParams({ email, token });
  return `${apiBaseUrl}/api/v1/public/unsubscribe?${params.toString()}`;
}
