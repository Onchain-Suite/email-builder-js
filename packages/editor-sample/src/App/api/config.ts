/**
 * Shared Onchain Suite API configuration.
 *
 * - VITE_API_BASE_URL    — API base, defaults to the production backend.
 * - VITE_API_AUTH_TOKEN  — optional Bearer token for non-cookie contexts
 *                          (VITE_UPLOAD_AUTH_TOKEN also honored for
 *                          backwards compatibility). By default the browser
 *                          session cookie is used (`credentials: "include"`).
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://onchain-backend-dvxw.onrender.com/api/v1'
).replace(/\/+$/, '');

const AUTH_TOKEN: string | undefined =
  import.meta.env.VITE_API_AUTH_TOKEN ?? import.meta.env.VITE_UPLOAD_AUTH_TOKEN;

export function authHeaders(): Record<string, string> {
  if (AUTH_TOKEN) {
    return { Authorization: `Bearer ${AUTH_TOKEN}` };
  }
  return {};
}

export function findErrorMessage(obj: unknown): string | null {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }
  const record = obj as Record<string, unknown>;
  for (const key of ['error', 'message', 'detail']) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}
