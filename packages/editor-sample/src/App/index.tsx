import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Backdrop, Button, CircularProgress, Snackbar, Stack, useTheme } from '@mui/material';

import { resetDocument, useDocument, useSamplesDrawerOpen } from '../documents/editor/EditorContext';
import { VariablesProvider } from '../documents/editor/VariablesContext';

import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './SamplesDrawer';
import TopBar from './TopBar';
import TemplatePanel from './TemplatePanel';

function useDrawerTransition(cssProperty: 'margin-left' | 'margin-right', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

import PostMessageListener from './PostMessageListener';

export default function App() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const document = useDocument();

  const marginLeftTransition = useDrawerTransition('margin-left', samplesDrawerOpen);

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [campaignId, setCampaignId] = useState<string | null>(searchParams.get('campaign'));
  const [embedded, setEmbedded] = useState(searchParams.get('embedded') === 'true');
  const [token, setToken] = useState<string | null>(
    searchParams.get('token') ?? searchParams.get('sessionToken') ?? searchParams.get('editorToken')
  );

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState(() => {
    const raw = searchParams.get('apiBaseUrl') ?? searchParams.get('host') ?? import.meta.env.VITE_API_URL;
    return raw?.replace(/\/+$/, '') ?? '';
  });

  const [parentOrigin, setParentOrigin] = useState<string | null>(() => {
    const fromQuery = searchParams.get('parentOrigin');
    if (fromQuery) return fromQuery;
    try {
      if (window.document.referrer) return new URL(window.document.referrer).origin;
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    (window as any).__EMAIL_BUILDER_PARENT_ORIGIN__ = parentOrigin;
  }, [parentOrigin]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const keysToStrip = ['token', 'sessionToken', 'editorToken'];
    let changed = false;
    for (const key of keysToStrip) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      const nextSearch = url.searchParams.toString();
      window.history.replaceState(null, '', `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`);
    }
  }, []);

  const resolveOriginFromApiBaseUrl = useCallback((apiBaseUrl: string | null) => {
    if (!apiBaseUrl) return null;
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return null;
    }
  }, []);

  const postToParent = useCallback((message: any) => {
    if (!embedded) return;
    if (!parentOrigin) return;
    window.parent.postMessage(message, parentOrigin);
  }, [embedded, parentOrigin]);

  const buildErrorFromResponse = useCallback(async (res: Response) => {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = (await res.json().catch(() => null)) as any;
      const message =
        data?.error?.message ??
        data?.message ??
        (typeof data?.error === 'string' ? data.error : null) ??
        `Request failed (HTTP ${res.status})`;
      return new Error(message);
    }

    const text = await res.text().catch(() => '');
    return new Error(text || `Request failed (HTTP ${res.status})`);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const data = (event.data ?? {}) as any;
      if (data?.type !== 'HOST_CONFIG') return;

      const nextApiBaseUrl = (data.apiBaseUrl ?? data.apiUrl ?? null) as string | null;
      const expectedOrigin = resolveOriginFromApiBaseUrl(nextApiBaseUrl) ?? resolveOriginFromApiBaseUrl(apiUrl);
      if (expectedOrigin && event.origin !== expectedOrigin) return;
      if (parentOrigin && event.origin !== parentOrigin) return;

      const nextCampaignId = (data.campaign ?? data.campaignId ?? null) as string | null;
      const nextToken = (data.token ?? data.sessionToken ?? data.editorToken ?? null) as string | null;
      const nextEmbedded = typeof data.embedded === 'boolean' ? data.embedded : null;

      setParentOrigin(event.origin);
      if (nextCampaignId !== null) setCampaignId(nextCampaignId);
      if (nextToken !== null) setToken(nextToken);
      if (nextApiBaseUrl) setApiUrl(nextApiBaseUrl.replace(/\/+$/, ''));
      if (nextEmbedded !== null) setEmbedded(nextEmbedded);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [apiUrl, parentOrigin, resolveOriginFromApiBaseUrl]);

  useEffect(() => {
    if (!embedded) return;
    if (!token) {
      const t = window.setTimeout(() => {
        setErrorMessage('Missing token. Host app must provide token via HOST_CONFIG or query string.');
      }, 2000);
      return () => window.clearTimeout(t);
    }
    return;
  }, [embedded, token]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchTemplate = async () => {
      if (!campaignId) return;
      if (!apiUrl) {
        setErrorMessage('Missing apiBaseUrl; cannot load template.');
        return;
      }

      if (embedded && !token) {
        return;
      }
      setLoadingTemplate(true);
      setErrorMessage(null);

      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-editor-token'] = token;
        }

        const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
          method: 'GET',
          headers,
          credentials: 'omit',
          signal: controller.signal,
        });


        if (!res.ok) {
          if (res.status === 401 && embedded) {
            postToParent({ type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } });
          }
          throw await buildErrorFromResponse(res);
        }

        const data = (await res.json()) as any;
        if (data?.success === false) {
          throw new Error(data?.error?.message ?? data?.message ?? 'Failed to load template.');
        }
        const payload = (data?.data ?? data?.payload ?? data) as any;
        const fetchedDocument = (payload?.document ?? payload?.emailConfig ?? payload) as any;

        if (!cancelled && fetchedDocument && typeof fetchedDocument === 'object' && fetchedDocument.root) {
          resetDocument(fetchedDocument);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load template.';
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplate(false);
        }
      }
    };

    fetchTemplate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiUrl, buildErrorFromResponse, campaignId, embedded, postToParent, token]);

  const handleSaveTemplate = async () => {
    if (!campaignId) {
      setErrorMessage('Missing campaign query param; cannot save template.');
      return;
    }
    if (!apiUrl) {
      setErrorMessage('Missing apiBaseUrl; cannot save template.');
      return;
    }
    if (embedded && !token) {
      setErrorMessage('Missing token. Host app must provide token via HOST_CONFIG or query string.');
      return;
    }

    setSavingTemplate(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-editor-token'] = token;
      }

      const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(document),
        credentials: 'omit',
      });

      if (!res.ok) {
        if (res.status === 401 && embedded) {
          postToParent({ type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } });
        }
        throw await buildErrorFromResponse(res);
      }

      setSuccessMessage('Template saved.');

      if (embedded) {
        postToParent({ type: 'EMAIL_SAVED', payload: { campaignId, document } });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save template.';
      setErrorMessage(message);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <VariablesProvider>
      <PostMessageListener />
      {!embedded ? <TopBar /> : null}
      <SamplesDrawer />

      <Stack
        sx={{
          marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: `${marginLeftTransition}`,
        }}
      >
        <TemplatePanel />
      </Stack>

      <Button
        variant="contained"
        onClick={handleSaveTemplate}
        disabled={savingTemplate || loadingTemplate}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 'tooltip',
          fontWeight: 700,
        }}
      >
        {savingTemplate ? 'Saving…' : 'Save Template'}
      </Button>

      <Backdrop open={loadingTemplate} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <CircularProgress color="inherit" size={22} />
          <Stack>
            <Alert severity="info" sx={{ background: 'transparent', p: 0, color: 'inherit' }}>
              Loading template…
            </Alert>
          </Stack>
        </Stack>
      </Backdrop>

      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={8000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={successMessage !== null}
        autoHideDuration={2500}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </VariablesProvider>
  );
}
