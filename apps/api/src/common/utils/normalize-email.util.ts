/**
 * Normalizes an email for storage/lookup: trims whitespace and lowercases.
 * This MUST be applied before any create/find-by-email operation so
 * "Juan@Example.com" and "juan@example.com " are treated as the same
 * contact (see docs/architecture.md#modelo-central-de-identidad).
 */
export function normalizeEmail(email: string | null | undefined): string | undefined {
  if (!email) {
    return undefined;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}
