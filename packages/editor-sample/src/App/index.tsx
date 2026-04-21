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

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL;
    return raw?.replace(/\/+$/, '') ?? '';
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaign = params.get('campaign');
    const embeddedValue = params.get('embedded');

    setCampaignId(campaign);
    setEmbedded(embeddedValue === 'true');
  }, []);

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
        const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Failed to load template (HTTP ${res.status})`);
        }

        const data = (await res.json()) as any;
        const fetchedDocument = (data?.document ?? data?.emailConfig ?? data) as any;

        if (!cancelled && fetchedDocument) {
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
      const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(document),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to save template (HTTP ${res.status})`);
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
