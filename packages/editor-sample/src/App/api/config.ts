import { getApiSession } from './session';

/**
 * Shared Onchain Suite API configuration.
 *
 * Base URL and credentials are resolved at call time, in priority order:
 * 1. Runtime session from the host app (HOST_CONFIG postMessage or
 *    `?token=&orgId=&apiBaseUrl=` query params) — see ./session.ts.
 * 2. Vite env: VITE_API_BASE_URL / VITE_API_AUTH_TOKEN
 *    (VITE_UPLOAD_AUTH_TOKEN honored for backwards compatibility).
 * 3. Production backend default, with cookie auth (`credentials: "include"`).
 */
const DEFAULT_API_BASE_URL = 'https://onchain-backend-dvxw.onrender.com/api/v1';

const ENV_TOKEN: string | undefined =
  import.meta.env.VITE_API_AUTH_TOKEN ?? import.meta.env.VITE_UPLOAD_AUTH_TOKEN;

export function getApiBaseUrl(): string {
  const { apiUrl } = getApiSession();
  return (apiUrl ?? import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

/**
 * @param options.orgScoped Include the `x-org-id` header. Only set this for
 * org-scoped endpoints (e.g. /assets, /templates, /campaigns). User-scoped
 * endpoints like /email-templates reject requests carrying an org header
 * with "You are not a member of this organization" when the org context
 * doesn't match, so they must not receive it.
 */
export function authHeaders(options?: { orgScoped?: boolean }): Record<string, string> {
  const { token, orgId } = getApiSession();
  const headers: Record<string, string> = {};
  const effectiveToken = token ?? ENV_TOKEN;
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
    headers['x-editor-token'] = effectiveToken;
  }
  if (options?.orgScoped && orgId) {
    headers['x-org-id'] = orgId;
  }
  return headers;
}

/**
 * Matches the campaign save/load flow: when a host-provided token is present,
 * cookies are omitted (embedded, cross-origin); otherwise fall back to the
 * browser session cookie.
 */
export function apiCredentials(): RequestCredentials {
  const { token } = getApiSession();
  return token ?? ENV_TOKEN ? 'omit' : 'include';
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
    if (typeof value === 'object' && value !== null) {
      const nested = findErrorMessage(value);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}
