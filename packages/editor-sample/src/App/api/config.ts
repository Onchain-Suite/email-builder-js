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
 * Auth for template/asset endpoints.
 *
 * IMPORTANT: the host-provided token is an *editor token*, which the backend
 * only accepts on the campaign editor routes (/email, /autosave,
 * /editor/content, /editor/saved). Sending it to template or asset endpoints
 * fails with "Authentication failed". Those endpoints authenticate with the
 * browser session cookie instead — which works embedded because
 * editor.onchainsuite.com and api.onchainsuite.com are the same site.
 * An explicit VITE_API_AUTH_TOKEN (real session token) is still honored for
 * local development.
 *
 * @param options.orgScoped Include the `x-org-id` header. Only set this for
 * org-scoped endpoints (e.g. /assets, /templates). User-scoped endpoints
 * like /email-templates reject mismatched org headers with "You are not a
 * member of this organization", so they must not receive it.
 */
export function authHeaders(options?: { orgScoped?: boolean }): Record<string, string> {
  const { orgId } = getApiSession();
  const headers: Record<string, string> = {};
  if (ENV_TOKEN) {
    headers['Authorization'] = `Bearer ${ENV_TOKEN}`;
  }
  if (options?.orgScoped && orgId) {
    headers['x-org-id'] = orgId;
  }
  return headers;
}

/** Session-cookie auth (same-site across *.onchainsuite.com subdomains). */
export function apiCredentials(): RequestCredentials {
  return 'include';
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
