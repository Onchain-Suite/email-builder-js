import { create } from 'zustand';

/**
 * Runtime API session, populated by App/index.tsx from the host app
 * (HOST_CONFIG postMessage in embedded mode, or `?token=&orgId=&apiBaseUrl=`
 * query params in standalone mode). API modules read this at call time so
 * requests are authenticated the same way as the campaign save/load flow.
 */
type TApiSession = {
  apiUrl: string | null;
  /** Editor token — only valid on campaign editor routes. */
  token: string | null;
  /**
   * Real user session token (BetterAuth) — used as Bearer auth on template
   * and asset endpoints when the session cookie can't travel into the
   * embedded iframe. Host apps pass it via HOST_CONFIG as `authToken`
   * (also accepted: `userToken`, `apiSessionToken`) or the `?authToken=`
   * query param.
   */
  authToken: string | null;
  orgId: string | null;
  /** Campaign the editor token was minted for — sent as ?campaignId= so the
   * backend can resolve the token's scope on template/config routes. */
  campaignId: string | null;
};

const apiSessionStore = create<TApiSession>(() => ({
  apiUrl: null,
  token: null,
  authToken: null,
  orgId: null,
  campaignId: null,
}));

export function setApiSession(session: Partial<TApiSession>) {
  apiSessionStore.setState(session);
}

export function getApiSession(): TApiSession {
  return apiSessionStore.getState();
}

/** Reactive hook — re-renders when the host delivers/refreshes credentials. */
export function useApiSession(): TApiSession {
  return apiSessionStore();
}
