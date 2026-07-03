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
  const { orgId, authToken } = getApiSession();
  const headers: Record<string, string> = {};
  const bearerToken = authToken ?? ENV_TOKEN;
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
    headers['x-session-token'] = bearerToken;
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

/**
 * When a request comes back 401/403, probe the session endpoint to tell the
 * user exactly which link in the auth chain is broken.
 */
export async function diagnoseAuthFailure(): Promise<string> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/get-session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const json: unknown = await res.json().catch(() => null);
    const hasUser = typeof json === 'object' && json !== null && 'user' in (json as Record<string, unknown>);
    if (hasUser) {
      return 'Your dashboard session IS active and reaches the API, but this endpoint still refused the request — likely a permissions/role issue for your user, or the backend does not accept session auth on this route.';
    }
    return 'No active session reached the API. Either you are not signed in to the Onchain Suite dashboard in this browser, or the session cookie is not sent from the editor origin (cookie SameSite/domain scope). Sign in to the dashboard, then reload the builder.';
  } catch {
    return 'The session check itself could not reach the API — the backend CORS policy probably does not allow this editor origin with credentials (Access-Control-Allow-Origin + Access-Control-Allow-Credentials).';
  }
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
