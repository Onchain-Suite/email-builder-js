import React, { useEffect, useMemo, useState } from 'react';

import { Maximize2, Minimize2, Monitor, Smartphone } from 'lucide-react';
import { Box, IconButton, Paper, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Reader } from '@usewaypoint/email-builder';

import EditorBlock from '../../documents/editor/EditorBlock';
import {
  setSelectedScreenSize,
  useDocument,
  useSelectedMainTab,
  useSelectedScreenSize,
} from '../../documents/editor/EditorContext';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import ImportJson from './ImportJson';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';

export default function TemplatePanel() {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();

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
    window.parent.postMessage(
      {
        type: 'EMAIL_FULLSCREEN_CHANGE',
        payload: { fullscreen: isFullscreenActive },
      },
      '*'
    );
  }, [isFullscreenActive]);

  const requestFullscreen = async () => {
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
  };

  const exitFullscreen = async () => {
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
  };

  const handleToggleFullscreen = async () => {
    if (getFullscreenElement() || isPseudoFullscreen) {
      await exitFullscreen();
      return;
    }
    await requestFullscreen();
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
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
  }, [isPseudoFullscreen]);

  let mainBoxSx: SxProps = {
    height: '100%',
    px: 20,
    py: 5,
  };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      height: 800,
      boxShadow:
        'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px',
      p: 3,
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

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case 'editor':
        return (
          <Box sx={mainBoxSx}>
            <Paper sx={{ p: 2 }}>
              <EditorBlock id="root" />
            </Paper>
          </Box>
        );
      case 'preview':
        return (
          <Box sx={mainBoxSx}>
            <Paper sx={{ p: 2 }}>
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
              backgroundColor: 'white',
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
          backgroundColor: 'white',
          boxShadow:
            '0px 2px 8px rgba(17, 24, 39, 0.06), 0px 1px 3px rgba(17, 24, 39, 0.04)',
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
        <ToggleSamplesPanelButton />
        <Stack px={2} direction="row" gap={2} width="100%" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <MainTabsGroup />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <DownloadJson />
            <ImportJson />
            <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
              <ToggleButton value="desktop">
                <Tooltip title="Desktop view">
                  <Monitor size={16} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="mobile">
                <Tooltip title="Mobile view">
                  <Smartphone size={16} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ShareButton />
            <IconButton onClick={handleToggleFullscreen} color={isFullscreenActive ? 'primary' : 'default'}>
              <Tooltip title={isFullscreenActive ? 'Exit full screen' : 'Full screen'}>
                {isFullscreenActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Tooltip>
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
      <Box sx={{ height: 'calc(100% - 49px)', overflow: 'auto', minWidth: 370, flex: 1 }}>{renderMainPanel()}</Box>
    </Box>
  );
}
