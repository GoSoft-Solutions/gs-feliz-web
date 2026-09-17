import { createHmac } from 'crypto';

/**
 * Mirrors apps/api/src/modules/email/unsubscribe.util.ts (only the piece
 * the worker needs: building the link, not verifying it — verification
 * happens in the API's public unsubscribe endpoint). Duplicated rather
 * than imported because the worker is a separate deployable package that
 * can't reach into apps/api's source.
 */
export function buildUnsubscribeUrl(apiBaseUrl: string, email: string, secret: string): string {
  const token = createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
  const params = new URLSearchParams({ email, token });
  return `${apiBaseUrl}/api/v1/public/unsubscribe?${params.toString()}`;
}
