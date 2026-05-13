import React, { useEffect, useMemo, useState } from 'react';

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
  const [campaignId] = useState<string | null>(searchParams.get('campaign'));
  const [embedded] = useState(searchParams.get('embedded') === 'true');
  const [token] = useState<string | null>(searchParams.get('token'));

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = useMemo(() => {
    const host = searchParams.get('host');
    if (host) return host.replace(/\/+$/, '');
    const raw = import.meta.env.VITE_API_URL;
    return raw?.replace(/\/+$/, '') ?? '';
  }, [searchParams]);

  const buildErrorFromResponse = async (res: Response) => {
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
  };

  // Removed old useEffect for parsing params

  useEffect(() => {
    let cancelled = false;

    const fetchTemplate = async () => {
      if (!campaignId) return;
      if (!apiUrl) {
        setErrorMessage('Missing VITE_API_URL; cannot load template.');
        return;
      }

      setLoadingTemplate(true);
      setErrorMessage(null);

      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
          method: 'GET',
          headers,
          credentials: 'omit',
        });

        if (!res.ok) {
          if (res.status === 401 && embedded) {
            window.parent.postMessage(
              { type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } },
              '*'
            );
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
    };
  }, [apiUrl, campaignId]);

  const handleSaveTemplate = async () => {
    if (!campaignId) {
      setErrorMessage('Missing campaign query param; cannot save template.');
      return;
    }
    if (!apiUrl) {
      setErrorMessage('Missing VITE_API_URL; cannot save template.');
      return;
    }

    setSavingTemplate(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(document),
        credentials: 'omit',
      });

      if (!res.ok) {
        if (res.status === 401 && embedded) {
          window.parent.postMessage(
            { type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } },
            '*'
          );
        }
        throw await buildErrorFromResponse(res);
      }

      setSuccessMessage('Template saved.');

      if (embedded) {
        window.parent.postMessage(
          {
            type: 'EMAIL_SAVED',
            payload: { campaignId, document },
          },
          '*'
        );
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
