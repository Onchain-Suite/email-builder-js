import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Backdrop, Button, CircularProgress, Snackbar, Stack, useTheme } from '@mui/material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';

import { resetDocument, useDocument, useSamplesDrawerOpen } from '../documents/editor/EditorContext';
import { VariablesProvider } from '../documents/editor/VariablesContext';

import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './SamplesDrawer';
import TopBar from './TopBar';
import TemplatePanel from './TemplatePanel';

function renderTextVersionFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|table|section|article|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function buildEmailContent(document: any) {
  const html = renderToStaticMarkup(document, { rootBlockId: 'root' }).trim();
  const textVersion = renderTextVersionFromHtml(html);

  if (!html && !textVersion) {
    throw new Error('Unable to generate email HTML or text from the current template.');
  }

  return {
    html,
    json: document,
    textVersion,
  };
}

function getTemplateStorageKey(campaignId: string) {
  return `email-builder.saved-template.${campaignId}`;
}

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
  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  const initialEmbedded = useMemo(() => searchParams.get('embedded') === 'true' || isInIframe, [isInIframe, searchParams]);

  const normalizeToken = useCallback((value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^bearer\s+/i.test(trimmed)) return trimmed.replace(/^bearer\s+/i, '').trim() || null;
    return trimmed;
  }, []);

  const normalizeNonEmptyString = useCallback((value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }, []);

  const normalizeApiBaseUrl = useCallback((value: unknown) => {
    if (typeof value !== 'string') return null;
    let s = value.trim();
    if (!s) return null;
    s = s.replace(/^`+/, '').replace(/`+$/, '').trim();
    s = s.replace(/^"+/, '').replace(/"+$/, '').trim();
    s = s.replace(/^'+/, '').replace(/'+$/, '').trim();
    return s.replace(/\/+$/, '') || null;
  }, []);

  const normalizeCampaignId = useCallback(
    (value: unknown) => {
      const direct = normalizeNonEmptyString(value);
      if (direct) return direct;
      if (typeof value !== 'object' || value === null) return null;
      const v: any = value;
      return (
        normalizeNonEmptyString(v.id) ??
        normalizeNonEmptyString(v.campaignId) ??
        normalizeNonEmptyString(v.campaign_id) ??
        normalizeNonEmptyString(v.uuid) ??
        null
      );
    },
    [normalizeNonEmptyString]
  );

  const hostOriginAllowlist = useMemo(() => {
    const raw = (import.meta.env.VITE_HOST_ORIGIN_ALLOWLIST ?? import.meta.env.VITE_HOST_ORIGINS ?? '') as string;
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const [embedded, setEmbedded] = useState(initialEmbedded);
  const effectiveEmbedded = embedded || isInIframe;
  const [campaignId, setCampaignId] = useState<string | null>(() => {
    if (initialEmbedded) return null;
    return normalizeCampaignId(searchParams.get('campaign'));
  });
  const [token, setToken] = useState<string | null>(() => {
    if (initialEmbedded) return null;
    const raw = searchParams.get('token') ?? searchParams.get('sessionToken') ?? searchParams.get('editorToken');
    return normalizeToken(raw);
  });
  const [orgId, setOrgId] = useState<string | null>(() => {
    if (initialEmbedded) return null;
    return normalizeNonEmptyString(searchParams.get('orgId'));
  });

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedReusableTemplateId, setSavedReusableTemplateId] = useState<string | null>(null);
  const [savedReusableTemplateName, setSavedReusableTemplateName] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState(() => {
    if (initialEmbedded) return '';
    const raw = searchParams.get('apiBaseUrl') ?? searchParams.get('host') ?? import.meta.env.VITE_API_URL;
    return normalizeApiBaseUrl(raw) ?? '';
  });

  const [parentOrigin, setParentOrigin] = useState<string | null>(() => {
    const fromQuery = searchParams.get('parentOrigin');
    if (fromQuery) {
      if (hostOriginAllowlist.length > 0 && hostOriginAllowlist.indexOf(fromQuery) === -1) return null;
      return fromQuery;
    }
    try {
      if (!window.document.referrer) return null;
      const referrerOrigin = new URL(window.document.referrer).origin;
      if (hostOriginAllowlist.length > 0 && hostOriginAllowlist.indexOf(referrerOrigin) === -1) return null;
      return referrerOrigin;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    (window as any).__EMAIL_BUILDER_PARENT_ORIGIN__ = parentOrigin;
  }, [parentOrigin]);

  useEffect(() => {
    if (!campaignId) {
      setSavedReusableTemplateId(null);
      setSavedReusableTemplateName(null);
      return;
    }

    try {
      const raw = window.localStorage.getItem(getTemplateStorageKey(campaignId));
      if (!raw) {
        setSavedReusableTemplateId(null);
        setSavedReusableTemplateName(null);
        return;
      }

      const parsed = JSON.parse(raw) as { id?: unknown; name?: unknown };
      setSavedReusableTemplateId(normalizeNonEmptyString(parsed.id));
      setSavedReusableTemplateName(normalizeNonEmptyString(parsed.name));
    } catch {
      setSavedReusableTemplateId(null);
      setSavedReusableTemplateName(null);
    }
  }, [campaignId, normalizeNonEmptyString]);

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

  const isHostOriginAllowed = useCallback(
    (origin: string) => {
      if (!effectiveEmbedded) return true;
      if (hostOriginAllowlist.length === 0) return false;
      return hostOriginAllowlist.indexOf(origin) !== -1;
    },
    [effectiveEmbedded, hostOriginAllowlist]
  );

  const postToParent = useCallback(
    (message: any) => {
      if (!effectiveEmbedded) return;
      if (parentOrigin) {
        window.parent.postMessage(message, parentOrigin);
        return;
      }
      for (const origin of hostOriginAllowlist) {
        window.parent.postMessage(message, origin);
      }
    },
    [effectiveEmbedded, hostOriginAllowlist, parentOrigin]
  );

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
    if (!effectiveEmbedded) return;
    postToParent({ type: 'EDITOR_READY' });
    postToParent({ type: 'REQUEST_HOST_CONFIG' });
  }, [effectiveEmbedded, postToParent]);

  useEffect(() => {
    if (!effectiveEmbedded) return;
    if (campaignId && token && orgId && apiUrl) return;
    let count = 0;
    const interval = window.setInterval(() => {
      count += 1;
      postToParent({ type: 'REQUEST_HOST_CONFIG' });
      if (count >= 10) {
        window.clearInterval(interval);
      }
      if (campaignId && token && orgId && apiUrl) {
        window.clearInterval(interval);
      }
    }, 750);
    return () => window.clearInterval(interval);
  }, [apiUrl, campaignId, effectiveEmbedded, orgId, postToParent, token]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (!isHostOriginAllowed(event.origin)) return;
      if (parentOrigin && event.origin !== parentOrigin) return;

      const data = (event.data ?? {}) as any;
      if (data?.type !== 'HOST_CONFIG') return;

      const nextApiBaseUrl = normalizeApiBaseUrl(data.apiBaseUrl ?? data.apiUrl);

      const nextCampaignId = normalizeCampaignId(data.campaignId ?? data.campaign ?? data.campaign?.id);
      const nextToken = normalizeToken(data.token ?? data.sessionToken ?? data.editorToken);
      const nextOrgId = normalizeNonEmptyString(
        data.orgId ??
          data.organizationId ??
          data.org_id ??
          data.campaign?.orgId ??
          data.campaign?.organizationId ??
          data.campaign?.org_id
      );
      const nextEmbedded = typeof data.embedded === 'boolean' ? data.embedded : null;

      setParentOrigin(event.origin);
      if (nextCampaignId) setCampaignId(nextCampaignId);
      if (nextToken) setToken(nextToken);
      if (nextOrgId) setOrgId(nextOrgId);
      if (nextApiBaseUrl) setApiUrl(nextApiBaseUrl);
      if (nextEmbedded !== null) setEmbedded(nextEmbedded);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isHostOriginAllowed, normalizeApiBaseUrl, normalizeCampaignId, normalizeNonEmptyString, normalizeToken, parentOrigin]);

  useEffect(() => {
    if (!effectiveEmbedded) return;
    if (hostOriginAllowlist.length === 0) {
      setErrorMessage('Missing VITE_HOST_ORIGIN_ALLOWLIST. Refusing to accept host config in embedded mode.');
      return;
    }
    if (!orgId) {
      const t = window.setTimeout(() => {
        setErrorMessage('Missing orgId. Host app must provide orgId via HOST_CONFIG.');
      }, 2000);
      return () => window.clearTimeout(t);
    }
    if (!token) {
      const t = window.setTimeout(() => {
        setErrorMessage('Missing token. Host app must provide token via HOST_CONFIG.');
      }, 2000);
      return () => window.clearTimeout(t);
    }
    return;
  }, [effectiveEmbedded, hostOriginAllowlist.length, orgId, token]);

  const requestCredentials: RequestCredentials = effectiveEmbedded ? 'omit' : 'include';

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchTemplate = async () => {
      if (!campaignId) return;
      if (!apiUrl) {
        setErrorMessage('Missing apiBaseUrl; cannot load template.');
        return;
      }

      if (effectiveEmbedded && !token) {
        return;
      }
      if (effectiveEmbedded && !orgId) {
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
        if (orgId) {
          headers['x-org-id'] = orgId;
        }

        const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
          method: 'GET',
          headers,
          credentials: 'omit',
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401 && effectiveEmbedded) {
            postToParent({
              type: 'EMAIL_AUTH_DEBUG',
              payload: {
                campaignId,
                apiBaseUrl: apiUrl,
                hasAuthorization: Boolean(token),
                tokenLength: token?.length ?? 0,
                tokenDotCount: token ? token.split('.').length - 1 : 0,
                hasOrgId: Boolean(orgId),
              },
            });
            postToParent({ type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } });
          }
          throw await buildErrorFromResponse(res);
        }

        const data = (await res.json()) as any;
        if (data?.success === false) {
          throw new Error(data?.error?.message ?? data?.message ?? 'Failed to load template.');
        }
        const payload = (data?.data ?? data?.payload ?? data) as any;
        const fetchedDocument = (payload?.document ?? payload?.json ?? payload?.emailConfig ?? payload) as any;

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
  }, [apiUrl, buildErrorFromResponse, campaignId, effectiveEmbedded, orgId, postToParent, token]);

  const handleSaveTemplate = async () => {
    if (!campaignId) {
      setErrorMessage(
        effectiveEmbedded
          ? 'Missing campaignId. Host app must provide campaign via HOST_CONFIG.'
          : 'Missing campaign query param; cannot save template.'
      );
      return;
    }
    if (!apiUrl) {
      setErrorMessage('Missing apiBaseUrl; cannot save template.');
      return;
    }
    if (effectiveEmbedded && !token) {
      setErrorMessage('Missing token. Host app must provide token via HOST_CONFIG.');
      return;
    }
    if (effectiveEmbedded && !orgId) {
      setErrorMessage('Missing orgId. Host app must provide orgId via HOST_CONFIG.');
      return;
    }

    setSavingTemplate(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { html, textVersion, json } = buildEmailContent(document);

      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-editor-token'] = token;
      }
      if (orgId) {
        headers['x-org-id'] = orgId;
      }

      const res = await fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          html,
          json,
          textVersion,
        }),
        credentials: requestCredentials,
      });

      if (!res.ok) {
        if (res.status === 401 && effectiveEmbedded) {
          postToParent({
            type: 'EMAIL_AUTH_DEBUG',
            payload: {
              campaignId,
              apiBaseUrl: apiUrl,
              hasAuthorization: Boolean(token),
              tokenLength: token?.length ?? 0,
              tokenDotCount: token ? token.split('.').length - 1 : 0,
              hasOrgId: Boolean(orgId),
            },
          });
          postToParent({ type: 'EMAIL_AUTH_REQUIRED', payload: { campaignId } });
        }
        throw await buildErrorFromResponse(res);
      }

      setSuccessMessage('Template saved.');

      if (effectiveEmbedded) {
        postToParent({ type: 'EMAIL_SAVED', payload: { campaignId, document: json, html, textVersion } });
      }

      if (!orgId) {
        setSuccessMessage('Campaign saved. Reusable template skipped because orgId is missing.');
        return;
      }

      const templateHeaders: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      templateHeaders['x-org-id'] = orgId;
      if (token) {
        templateHeaders['Authorization'] = `Bearer ${token}`;
        templateHeaders['x-editor-token'] = token;
      }

      let reusableTemplateId = savedReusableTemplateId;
      let reusableTemplateName = savedReusableTemplateName;

      if (!reusableTemplateId) {
        const defaultTemplateName = savedReusableTemplateName ?? `Campaign ${campaignId} Template`;
        const requestedName = window.prompt('Reusable template name', defaultTemplateName)?.trim() ?? '';

        if (!requestedName) {
          setSuccessMessage('Campaign saved. Reusable template was skipped.');
          return;
        }

        const createRes = await fetch(`${apiUrl}/templates`, {
          method: 'POST',
          headers: templateHeaders,
          body: JSON.stringify({
            name: requestedName,
            content: { html, json, textVersion },
          }),
          credentials: requestCredentials,
        });

        if (!createRes.ok) {
          throw new Error(`Campaign saved, but reusable template creation failed: ${(await buildErrorFromResponse(createRes)).message}`);
        }

        const createData = (await createRes.json().catch(() => null)) as any;
        const createPayload = (createData?.data ?? createData?.payload ?? createData) as any;
        reusableTemplateId =
          normalizeNonEmptyString(createPayload?.id) ??
          normalizeNonEmptyString(createPayload?.templateId) ??
          normalizeNonEmptyString(createPayload?.template?.id);
        reusableTemplateName =
          normalizeNonEmptyString(createPayload?.name) ??
          normalizeNonEmptyString(createPayload?.template?.name) ??
          requestedName;

        if (!reusableTemplateId) {
          throw new Error('Campaign saved, but reusable template creation did not return a template id.');
        }
      } else {
        const updateRes = await fetch(`${apiUrl}/templates/${encodeURIComponent(reusableTemplateId)}`, {
          method: 'PUT',
          headers: templateHeaders,
          body: JSON.stringify({
            name: reusableTemplateName ?? undefined,
            content: { html, json, textVersion },
          }),
          credentials: requestCredentials,
        });

        if (!updateRes.ok) {
          throw new Error(`Campaign saved, but reusable template update failed: ${(await buildErrorFromResponse(updateRes)).message}`);
        }
      }

      window.localStorage.setItem(
        getTemplateStorageKey(campaignId),
        JSON.stringify({ id: reusableTemplateId, name: reusableTemplateName })
      );
      setSavedReusableTemplateId(reusableTemplateId);
      setSavedReusableTemplateName(reusableTemplateName);
      setSuccessMessage(
        reusableTemplateName
          ? `Campaign and reusable template "${reusableTemplateName}" saved.`
          : 'Campaign and reusable template saved.'
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save template.';
      setErrorMessage(message);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <VariablesProvider apiBaseUrl={apiUrl} token={token} orgId={orgId} embedded={effectiveEmbedded}>
      <PostMessageListener />
      {!effectiveEmbedded ? <TopBar /> : null}
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
