import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, SxProps } from '@mui/material';
import { renderToStaticMarkup, TReaderDocument } from '@usewaypoint/email-builder';

import makeResponsiveHtml from '../makeResponsiveHtml';

// A real phone content width, so the email's own `@media (max-width:…)` rules
// actually fire — the whole point of previewing in an iframe instead of a
// plain box (CSS media queries key off the iframe viewport, not a div's width).
const MOBILE_WIDTH = 375;

type PreviewFrameProps = {
  document: TReaderDocument;
  screenSize: 'desktop' | 'mobile';
};

/**
 * Renders the email exactly as it is exported (post-`makeResponsiveHtml`)
 * inside an <iframe>, so the preview is a true device viewport rather than a
 * scaled box. That is what lets responsive emails — native blocks or imported
 * HTML with their own media queries — reflow the way they will on a real
 * phone, instead of showing a clipped desktop layout.
 */
export default function PreviewFrame({ document, screenSize }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  const html = useMemo(() => {
    try {
      return makeResponsiveHtml(renderToStaticMarkup(document, { rootBlockId: 'root' }));
    } catch {
      return '<!doctype html><body></body>';
    }
  }, [document]);

  // Keep the iframe as tall as its content so the page (not the frame)
  // scrolls. A one-shot measure isn't enough: images and web fonts load
  // asynchronously and grow the layout after `load` fires, so a single
  // measurement leaves the frame too short and the email looks cut off.
  const remeasure = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const h = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
    if (h > 0) setHeight(h);
  }, []);

  // Wire up live height tracking against the CURRENT document. Called from the
  // iframe's onLoad, so it always binds to the freshly-parsed srcDoc (binding
  // in an effect would race the srcDoc reload and observe a doc about to be
  // replaced). The previous bindings are torn down first.
  const teardownRef = useRef<() => void>(() => {});
  const bindTracking = useCallback(() => {
    teardownRef.current();
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      teardownRef.current = () => {};
      return;
    }
    remeasure();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(remeasure);
      for (const el of [doc.documentElement, doc.body]) {
        if (el) observer.observe(el);
      }
    }
    // Late network images don't always trip the observer on every client —
    // remeasure when each finishes (error also changes layout).
    const images = Array.from(doc.images).filter((img) => !img.complete);
    images.forEach((img) => {
      img.addEventListener('load', remeasure);
      img.addEventListener('error', remeasure);
    });
    // Web fonts reflow text once they swap in.
    doc.fonts?.ready?.then(remeasure).catch(() => {});

    teardownRef.current = () => {
      observer?.disconnect();
      images.forEach((img) => {
        img.removeEventListener('load', remeasure);
        img.removeEventListener('error', remeasure);
      });
    };
  }, [remeasure]);

  // Same srcDoc across a desktop/mobile switch means no reload/onLoad — the
  // content just reflows to the new width, so remeasure directly.
  useEffect(() => {
    remeasure();
  }, [screenSize, remeasure]);

  useEffect(() => () => teardownRef.current(), []);

  const isMobile = screenSize === 'mobile';

  const frameSx: SxProps = isMobile
    ? {
        width: MOBILE_WIDTH,
        margin: '32px auto',
        borderRadius: 6,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 24px 48px rgba(33, 36, 67, 0.18)',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }
    : {
        maxWidth: 800,
        margin: '0 auto',
        px: { xs: 2, md: 6 },
        py: 5,
      };

  return (
    <Box sx={frameSx}>
      <Box
        component="iframe"
        ref={iframeRef}
        title="Email preview"
        srcDoc={html}
        onLoad={bindTracking}
        sx={{
          display: 'block',
          width: '100%',
          height,
          border: 0,
          borderRadius: isMobile ? 5 : 3,
          backgroundColor: '#FFFFFF',
          boxShadow: isMobile ? 'none' : '0 1px 2px rgba(33,36,67,0.08), 0 20px 48px rgba(33,36,67,0.12)',
        }}
      />
    </Box>
  );
}
