import { create } from 'zustand';

/**
 * Runtime API session, populated by App/index.tsx from the host app
 * (HOST_CONFIG postMessage in embedded mode, or `?token=&orgId=&apiBaseUrl=`
 * query params in standalone mode). API modules read this at call time so
 * requests are authenticated the same way as the campaign save/load flow.
 */
type TApiSession = {
  apiUrl: string | null;
  token: string | null;
  orgId: string | null;
};

const apiSessionStore = create<TApiSession>(() => ({
  apiUrl: null,
  token: null,
  orgId: null,
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
