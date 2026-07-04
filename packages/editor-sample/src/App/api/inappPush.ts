import { apiCredentials, authHeaders, diagnoseAuthFailure, findErrorMessage, getApiBaseUrl } from './config';
import { getApiSession } from './session';

export type TestPushRequest = {
  walletAddress: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

/**
 * Sends a test in-app push to a single wallet via
 * `POST /integrations/inapp/test-push` (org admin route). Tries the
 * campaign editor token first (cookie-less embedded flow), then falls back
 * to session auth — same pattern as the template endpoints.
 */
export async function sendTestPush(request: TestPushRequest): Promise<void> {
  const { token, orgId, campaignId } = getApiSession();

  let url = `${getApiBaseUrl()}/integrations/inapp/test-push`;
  if (campaignId) {
    url += `?campaignId=${encodeURIComponent(campaignId)}`;
  }

  const doFetch = (headers: Record<string, string>) =>
    fetch(url, {
      method: 'POST',
      credentials: apiCredentials(),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        walletAddress: request.walletAddress,
        title: request.title,
        body: request.body,
        ...(request.ctaLabel ? { ctaLabel: request.ctaLabel } : {}),
        ...(request.ctaUrl ? { ctaUrl: request.ctaUrl } : {}),
      }),
    });

  const editorHeaders: Record<string, string> | null = token
    ? {
        Authorization: `Bearer ${token}`,
        'x-editor-token': token,
        ...(orgId ? { 'x-org-id': orgId } : {}),
      }
    : null;

  let response: Response;
  try {
    response = await doFetch(editorHeaders ?? authHeaders({ orgScoped: true }));
    if (editorHeaders && (response.status === 401 || response.status === 403)) {
      const fallback = await doFetch(authHeaders({ orgScoped: true })).catch(() => null);
      if (fallback && fallback.ok) {
        response = fallback;
      }
    }
  } catch {
    throw new Error(
      `Test push request never reached the server. This is usually the backend CORS policy blocking this editor origin (or no network). Check that the API allows origin ${window.location.origin} with credentials.`
    );
  }

  if (!response.ok) {
    const json: unknown = await response.json().catch(() => null);
    const serverMessage = findErrorMessage(json);
    if (response.status === 401 || response.status === 403) {
      const diagnosis = await diagnoseAuthFailure();
      throw new Error(
        `Test push → ${response.status}${serverMessage ? ` ("${serverMessage}")` : ''}. This route requires an org Owner/Admin. ${diagnosis}`
      );
    }
    throw new Error(`Test push failed (HTTP ${response.status})${serverMessage ? `: ${serverMessage}` : '.'}`);
  }
}
