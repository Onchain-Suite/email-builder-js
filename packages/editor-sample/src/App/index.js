var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Backdrop, Button, CircularProgress, Snackbar, Stack, useTheme } from '@mui/material';
import { resetDocument, useDocument, useSamplesDrawerOpen } from '../documents/editor/EditorContext';
import { VariablesProvider } from '../documents/editor/VariablesContext';
import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './SamplesDrawer';
import TopBar from './TopBar';
import TemplatePanel from './TemplatePanel';
function useDrawerTransition(cssProperty, open) {
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
    const [campaignId, setCampaignId] = useState(null);
    const [embedded, setEmbedded] = useState(false);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const apiUrl = useMemo(() => {
        var _d;
        const raw = import.meta.env.VITE_API_URL;
        return (_d = raw === null || raw === void 0 ? void 0 : raw.replace(/\/+$/, '')) !== null && _d !== void 0 ? _d : '';
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
        const fetchTemplate = () => __awaiter(this, void 0, void 0, function* () {
            var _d, _e;
            if (!campaignId)
                return;
            if (!apiUrl) {
                setErrorMessage('Missing VITE_API_URL; cannot load template.');
                return;
            }
            setLoadingTemplate(true);
            setErrorMessage(null);
            try {
                const res = yield fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) {
                    const text = yield res.text().catch(() => '');
                    throw new Error(text || `Failed to load template (HTTP ${res.status})`);
                }
                const data = (yield res.json());
                const fetchedDocument = ((_e = (_d = data === null || data === void 0 ? void 0 : data.document) !== null && _d !== void 0 ? _d : data === null || data === void 0 ? void 0 : data.emailConfig) !== null && _e !== void 0 ? _e : data);
                if (!cancelled && fetchedDocument) {
                    resetDocument(fetchedDocument);
                }
            }
            catch (e) {
                if (!cancelled) {
                    const message = e instanceof Error ? e.message : 'Failed to load template.';
                    setErrorMessage(message);
                }
            }
            finally {
                if (!cancelled) {
                    setLoadingTemplate(false);
                }
            }
        });
        fetchTemplate();
        return () => {
            cancelled = true;
        };
    }, [apiUrl, campaignId]);
    const handleSaveTemplate = () => __awaiter(this, void 0, void 0, function* () {
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
            const res = yield fetch(`${apiUrl}/campaigns/${encodeURIComponent(campaignId)}/email`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(document),
            });
            if (!res.ok) {
                const text = yield res.text().catch(() => '');
                throw new Error(text || `Failed to save template (HTTP ${res.status})`);
            }
            setSuccessMessage('Template saved.');
            if (embedded) {
                window.parent.postMessage({
                    type: 'EMAIL_SAVED',
                    payload: { campaignId, document },
                }, '*');
            }
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to save template.';
            setErrorMessage(message);
        }
        finally {
            setSavingTemplate(false);
        }
    });
    return (React.createElement(VariablesProvider, null,
        React.createElement(PostMessageListener, null),
        !embedded ? React.createElement(TopBar, null) : null,
        React.createElement(SamplesDrawer, null),
        React.createElement(Stack, { sx: {
                marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
                transition: `${marginLeftTransition}`,
            } },
            React.createElement(TemplatePanel, null)),
        React.createElement(Button, { variant: "contained", onClick: handleSaveTemplate, disabled: savingTemplate || loadingTemplate, sx: {
                position: 'fixed',
                right: 16,
                bottom: 16,
                zIndex: 'tooltip',
                fontWeight: 700,
            } }, savingTemplate ? 'Saving…' : 'Save Template'),
        React.createElement(Backdrop, { open: loadingTemplate, sx: { zIndex: (theme) => theme.zIndex.modal + 1 } },
            React.createElement(Stack, { direction: "row", alignItems: "center", gap: 2 },
                React.createElement(CircularProgress, { color: "inherit", size: 22 }),
                React.createElement(Stack, null,
                    React.createElement(Alert, { severity: "info", sx: { background: 'transparent', p: 0, color: 'inherit' } }, "Loading template\u2026")))),
        React.createElement(Snackbar, { open: errorMessage !== null, autoHideDuration: 8000, onClose: () => setErrorMessage(null), anchorOrigin: { vertical: 'top', horizontal: 'center' } },
            React.createElement(Alert, { severity: "error", variant: "filled", onClose: () => setErrorMessage(null) }, errorMessage)),
        React.createElement(Snackbar, { open: successMessage !== null, autoHideDuration: 2500, onClose: () => setSuccessMessage(null), anchorOrigin: { vertical: 'top', horizontal: 'center' } },
            React.createElement(Alert, { severity: "success", variant: "filled", onClose: () => setSuccessMessage(null) }, successMessage))));
}
//# sourceMappingURL=index.js.map