import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Maximize2, Minimize2, Monitor, Redo2, Smartphone, Undo2 } from 'lucide-react';
import { Box, Divider, IconButton, Paper, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Reader } from '@usewaypoint/email-builder';

import EditorBlock from '../../documents/editor/EditorBlock';
import {
  redo,
  setSelectedScreenSize,
  undo,
  useCanRedo,
  useCanUndo,
  useDocument,
  useSelectedMainTab,
  useSelectedScreenSize,
} from '../../documents/editor/EditorContext';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import ImportHtml from './ImportHtml';
import ImportJson from './ImportJson';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';

export default function TemplatePanel() {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Cmd/Ctrl+Z to undo, Shift+Cmd/Ctrl+Z or Ctrl+Y to redo.
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (isTyping) return;
      const mod = ev.metaKey || ev.ctrlKey;
      if (!mod) return;
      if (ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        if (ev.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (ev.key.toLowerCase() === 'y') {
        ev.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const getParentOrigin = useCallback(() => {
    const fromGlobal = (window as any).__EMAIL_BUILDER_PARENT_ORIGIN__ as string | undefined;
    if (fromGlobal) return fromGlobal;
    try {
      if (window.document.referrer) return new URL(window.document.referrer).origin;
    } catch {
      return null;
    }
    return null;
  }, []);

  const baseTopOffsetPx = useMemo(() => {
    const embeddedValue = new URLSearchParams(window.location.search).get('embedded');
    return embeddedValue === 'true' ? 0 : 56;
  }, []);

  const getFullscreenElement = () => {
    const d = window.document as any;
    return (d.fullscreenElement ?? d.webkitFullscreenElement ?? d.mozFullScreenElement ?? d.msFullscreenElement) as
      | Element
      | null;
  };

  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(getFullscreenElement()));
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const isFullscreenActive = isFullscreen || isPseudoFullscreen;

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(getFullscreenElement()));
    const d = window.document as any;
    window.document.addEventListener('fullscreenchange', onFullscreenChange);
    d.addEventListener?.('webkitfullscreenchange', onFullscreenChange);
    d.addEventListener?.('mozfullscreenchange', onFullscreenChange);
    d.addEventListener?.('MSFullscreenChange', onFullscreenChange);
    return () => {
      window.document.removeEventListener('fullscreenchange', onFullscreenChange);
      d.removeEventListener?.('webkitfullscreenchange', onFullscreenChange);
      d.removeEventListener?.('mozfullscreenchange', onFullscreenChange);
      d.removeEventListener?.('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const nextTopOffset = isFullscreenActive ? 0 : baseTopOffsetPx;
    window.document.documentElement.style.setProperty('--editor-top-offset', `${nextTopOffset}px`);
    const prevOverflow = window.document.body.style.overflow;
    if (isFullscreenActive) {
      window.document.body.style.overflow = 'hidden';
    } else {
      window.document.body.style.overflow = prevOverflow;
    }
    return () => {
      window.document.documentElement.style.setProperty('--editor-top-offset', `${baseTopOffsetPx}px`);
      window.document.body.style.overflow = prevOverflow;
    };
  }, [baseTopOffsetPx, isFullscreenActive]);

  useEffect(() => {
    const embeddedValue = new URLSearchParams(window.location.search).get('embedded');
    if (embeddedValue !== 'true') return;
    const parentOrigin = getParentOrigin();
    if (!parentOrigin) return;
    window.parent.postMessage({ type: 'EMAIL_FULLSCREEN_CHANGE', payload: { fullscreen: isFullscreenActive } }, parentOrigin);
  }, [getParentOrigin, isFullscreenActive]);

  const requestFullscreen = useCallback(async () => {
    const el = window.document.documentElement as any;
    const fn =
      el.requestFullscreen?.bind(el) ??
      el.webkitRequestFullscreen?.bind(el) ??
      el.mozRequestFullScreen?.bind(el) ??
      el.msRequestFullscreen?.bind(el);
    if (!fn) {
      setIsPseudoFullscreen(true);
      return;
    }

    try {
      const r = fn();
      if (r && typeof r.then === 'function') {
        await r;
      }
      setIsPseudoFullscreen(false);
    } catch {
      setIsPseudoFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const d = window.document as any;
    const fn =
      window.document.exitFullscreen?.bind(window.document) ??
      d.webkitExitFullscreen?.bind(window.document) ??
      d.mozCancelFullScreen?.bind(window.document) ??
      d.msExitFullscreen?.bind(window.document);
    if (!fn) {
      setIsPseudoFullscreen(false);
      return;
    }

    try {
      const r = fn();
      if (r && typeof r.then === 'function') {
        await r;
      }
      setIsPseudoFullscreen(false);
    } catch {
      setIsPseudoFullscreen(false);
    }
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (getFullscreenElement() || isPseudoFullscreen) {
      await exitFullscreen();
      return;
    }
    await requestFullscreen();
  }, [exitFullscreen, isPseudoFullscreen, requestFullscreen]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const parentOrigin = getParentOrigin();
      if (parentOrigin && event.origin !== parentOrigin) return;
      const type = (event.data as any)?.type;
      if (type === 'EMAIL_REQUEST_FULLSCREEN') {
        void requestFullscreen();
      }
      if (type === 'EMAIL_EXIT_FULLSCREEN') {
        void exitFullscreen();
      }
      if (type === 'EMAIL_TOGGLE_FULLSCREEN') {
        void handleToggleFullscreen();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [exitFullscreen, getParentOrigin, handleToggleFullscreen, isPseudoFullscreen, requestFullscreen]);

  let mainBoxSx: SxProps = {
    minHeight: '100%',
    maxWidth: 800,
    mx: 'auto',
    px: { xs: 2, md: 6 },
    py: 5,
  };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      minHeight: 0,
      height: 800,
      px: 0,
      py: 0,
      p: 1.5,
      borderRadius: 6,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 24px 48px rgba(33, 36, 67, 0.18)',
      overflow: 'auto',
    };
  }

  const handleScreenSizeChange = (_: unknown, value: unknown) => {
    switch (value) {
      case 'mobile':
      case 'desktop':
        setSelectedScreenSize(value);
        return;
      default:
        setSelectedScreenSize('desktop');
    }
  };

  const canvasPaperSx: SxProps = {
    p: 2,
    backgroundColor: '#FFFFFF',
    backgroundImage: 'none',
    color: '#111827',
    borderRadius: 3,
    boxShadow: '0 1px 2px rgba(33,36,67,0.08), 0 20px 48px rgba(33,36,67,0.12)',
  };

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case 'editor':
        return (
          <Box sx={mainBoxSx}>
            <Paper sx={canvasPaperSx}>
              <EditorBlock id="root" />
            </Paper>
          </Box>
        );
      case 'preview':
        return (
          <Box sx={mainBoxSx}>
            <Paper sx={canvasPaperSx}>
              <Reader document={document} rootBlockId="root" />
            </Paper>
          </Box>
        );
      case 'html':
        return <HtmlPanel />;
      case 'json':
        return <JsonPanel />;
    }
  };

  return (
    <Box
      sx={
        isFullscreenActive
          ? {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'background.default',
              zIndex: (theme) => theme.zIndex.modal + 2,
              display: 'flex',
              flexDirection: 'column',
            }
          : {
              display: 'flex',
              flexDirection: 'column',
            }
      }
    >
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          transition: 'box-shadow 300ms ease-out, backdrop-filter 300ms ease-out',
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          px: 1,
        }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Left zone: navigation — panel toggle + view tabs */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <ToggleSamplesPanelButton />
          <MainTabsGroup />
        </Stack>

        {/* Center zone: canvas controls — history + device preview */}
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Stack direction="row" spacing={0.25} alignItems="center">
            <Tooltip title="Undo (⌘Z / Ctrl+Z)">
              <span>
                <IconButton size="small" onClick={() => undo()} disabled={!canUndo}>
                  <Undo2 size={16} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (⇧⌘Z / Ctrl+Y)">
              <span>
                <IconButton size="small" onClick={() => redo()} disabled={!canRedo}>
                  <Redo2 size={16} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: 1.25 }} />
          <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
            <ToggleButton value="desktop" sx={{ gap: 0.75 }}>
              <Monitor size={15} />
              Desktop
            </ToggleButton>
            <ToggleButton value="mobile" sx={{ gap: 0.75 }}>
              <Smartphone size={15} />
              Mobile
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Right zone: file actions — import/export, share, fullscreen */}
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ flex: 1, minWidth: 0 }}>
          <ImportJson />
          <ImportHtml />
          <DownloadJson />
          <Divider orientation="vertical" flexItem sx={{ my: 1.25, mx: 0.5 }} />
          <ShareButton />
          <Tooltip title={isFullscreenActive ? 'Exit full screen' : 'Full screen'}>
            <IconButton onClick={handleToggleFullscreen} color={isFullscreenActive ? 'primary' : 'default'}>
              {isFullscreenActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Box
        sx={{
          height: 'calc(100% - 49px)',
          overflow: 'auto',
          minWidth: 370,
          flex: 1,
          backgroundImage: 'radial-gradient(rgba(17,24,39,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {renderMainPanel()}
      </Box>
    </Box>
  );
}
