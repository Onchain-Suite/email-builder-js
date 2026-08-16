import React, { useEffect, useMemo, useRef, useState } from 'react';

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

  // Size the iframe to its content so the page (not the frame) scrolls.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const measure = () => {
      const body = iframe.contentDocument?.body;
      if (body) {
        setHeight(body.scrollHeight);
      }
    };
    measure();
    const t = window.setTimeout(measure, 60); // after fonts/images settle
    return () => window.clearTimeout(t);
  }, [html, screenSize]);

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
        onLoad={() => {
          const body = iframeRef.current?.contentDocument?.body;
          if (body) setHeight(body.scrollHeight);
        }}
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
