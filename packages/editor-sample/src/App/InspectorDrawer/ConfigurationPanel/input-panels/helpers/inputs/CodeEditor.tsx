import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Chip, Dialog, IconButton, Stack, SxProps, Tooltip, Typography } from '@mui/material';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import { Check, Copy, Maximize2, Minimize2, Wand2, WrapText } from 'lucide-react';

hljs.registerLanguage('xml', xml);

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const FONT_SIZE = 12.5;
const LINE_HEIGHT = 20;
const PADDING_Y = 10;
const PADDING_X = 12;
const TAB = '  ';

/**
 * Styles that MUST be identical on the <textarea> and the highlighted <pre>
 * underneath it, otherwise the caret drifts away from the painted glyphs.
 */
const sharedTextSx = (wrap: boolean): SxProps => ({
  fontFamily: FONT_FAMILY,
  fontSize: `${FONT_SIZE}px`,
  lineHeight: `${LINE_HEIGHT}px`,
  letterSpacing: 'normal',
  tabSize: 2,
  padding: `${PADDING_Y}px ${PADDING_X}px`,
  margin: 0,
  border: 0,
  whiteSpace: wrap ? 'pre-wrap' : 'pre',
  wordBreak: wrap ? 'break-word' : 'normal',
  overflowWrap: wrap ? 'anywhere' : 'normal',
});

// github-light-ish token colors, scoped to this component instead of pulling
// in one of highlight.js' global stylesheets.
const HLJS_TOKEN_SX = {
  '& .hljs-tag': { color: '#24292e' },
  '& .hljs-name': { color: '#22863a' },
  '& .hljs-attr': { color: '#6f42c1' },
  '& .hljs-string': { color: '#032f62' },
  '& .hljs-comment': { color: '#6a737d', fontStyle: 'italic' },
  '& .hljs-symbol, & .hljs-meta': { color: '#e36209' },
} as const;

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** Visible rows before the editor starts scrolling. */
  rows?: number;
  placeholder?: string;
  /** Hide the expand control when the editor already sits inside a dialog. */
  allowExpand?: boolean;
};

/**
 * Syntax-highlighted HTML editor: a transparent <textarea> layered over a
 * highlighted <pre>, with a line-number gutter, soft-wrap toggle and an
 * expanded mode for editing longer snippets.
 */
const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(function CodeEditor(
  { value, onChange, rows = 14, placeholder, allowExpand = true },
  ref
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const [wrap, setWrap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatting, setFormatting] = useState(false);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    },
    [ref]
  );

  const lines = useMemo(() => value.split('\n'), [value]);

  const highlighted = useMemo(() => {
    try {
      return hljs.highlight(value, { language: 'xml' }).value;
    } catch {
      return null;
    }
  }, [value]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const syncScroll = () => {
    const ta = innerRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  const replaceSelection = (text: string, caretOffset = text.length) => {
    const ta = innerRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.substring(0, start) + text + value.substring(end);
    onChange(next);
    window.setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + caretOffset, start + caretOffset);
    }, 0);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    const ta = e.currentTarget;

    if (e.key === 'Tab') {
      e.preventDefault();
      replaceSelection(TAB);
      return;
    }

    // Keep the indentation of the current line on Enter, and add one level
    // when the caret sits right after an opening tag.
    if (e.key === 'Enter') {
      const start = ta.selectionStart;
      if (start !== ta.selectionEnd) return;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const indent = /^[ \t]*/.exec(currentLine)?.[0] ?? '';
      const opensTag = /<([a-zA-Z][^\s/>]*)(\s[^<>]*)?>$/.test(currentLine.trimEnd());
      const closesNext = /^<\//.test(value.substring(start).trimStart());
      e.preventDefault();
      if (opensTag && closesNext) {
        const inner = `\n${indent}${TAB}`;
        replaceSelection(`${inner}\n${indent}`, inner.length);
      } else {
        const nextIndent = opensTag ? indent + TAB : indent;
        replaceSelection(`\n${nextIndent}`);
      }
      return;
    }

    if (e.key === 'Escape' && expanded) {
      setExpanded(false);
    }
  };

  const handleFormat = async () => {
    if (!value.trim() || formatting) return;
    setFormatting(true);
    try {
      const [prettier, htmlPlugin] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/html'),
      ]);
      const formatted = await prettier.format(value, {
        parser: 'html',
        plugins: [htmlPlugin.default ?? htmlPlugin],
        printWidth: 80,
        tabWidth: 2,
        htmlWhitespaceSensitivity: 'ignore',
      });
      onChange(formatted.replace(/\n$/, ''));
    } catch {
      // Malformed markup — leave the user's code untouched.
    } finally {
      setFormatting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await window.navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const bodyHeight = expanded ? undefined : `${rows * LINE_HEIGHT + PADDING_Y * 2}px`;

  const surface = (
    <Box
      sx={{
        border: expanded ? 0 : '1px solid',
        borderColor: 'divider',
        borderRadius: expanded ? 0 : 1.5,
        overflow: 'hidden',
        backgroundColor: expanded ? '#FFFFFF' : '#FBFCFD',
        ...(expanded ? { display: 'flex', flexDirection: 'column', height: '100%' } : null),
        '&:focus-within': expanded ? null : { borderColor: 'primary.main' },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#F3F5F7',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          <Chip
            size="small"
            label="HTML"
            sx={{ height: 18, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, borderRadius: 0.75 }}
          />
          <Typography fontSize={11} color="text.secondary" noWrap>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0} sx={{ flexShrink: 0 }}>
          <Tooltip title="Format HTML">
            <span>
              <IconButton size="small" sx={{ p: 0.5 }} onClick={handleFormat} disabled={formatting || !value.trim()}>
                <Wand2 size={15} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={wrap ? 'Disable soft wrap' : 'Enable soft wrap'}>
            <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setWrap((w) => !w)} color={wrap ? 'primary' : 'default'}>
              <WrapText size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title={copied ? 'Copied' : 'Copy code'}>
            <IconButton size="small" sx={{ p: 0.5 }} onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </IconButton>
          </Tooltip>
          {allowExpand ? (
            <Tooltip title={expanded ? 'Collapse editor (Esc)' : 'Expand editor'}>
              <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setExpanded((v) => !v)}>
                {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', position: 'relative', height: bodyHeight, flex: expanded ? 1 : undefined, minHeight: 0 }}>
        {wrap ? null : (
          <Box
            ref={gutterRef}
            aria-hidden
            sx={{
              ...sharedTextSx(false),
              px: 1,
              flex: '0 0 auto',
              minWidth: 40,
              textAlign: 'right',
              color: 'text.disabled',
              backgroundColor: '#F7F9FA',
              borderRight: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              userSelect: 'none',
            }}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </Box>
        )}

        <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Box
            component="pre"
            ref={preRef}
            aria-hidden
            sx={{
              ...sharedTextSx(wrap),
              ...HLJS_TOKEN_SX,
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              color: '#24292e',
            }}
          >
            {highlighted === null ? (
              value
            ) : (
              <code dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }} />
            )}
          </Box>
          <Box
            component="textarea"
            ref={setRefs}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={placeholder}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            sx={{
              ...sharedTextSx(wrap),
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              resize: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'transparent',
              caretColor: '#111827',
              overflow: 'auto',
              display: 'block',
              '&::selection': { backgroundColor: 'rgba(56, 132, 255, 0.28)' },
              '&::placeholder': { color: 'text.disabled' },
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  if (expanded) {
    return (
      <Dialog
        open
        fullWidth
        maxWidth="md"
        onClose={() => setExpanded(false)}
        PaperProps={{ sx: { height: '85vh', overflow: 'hidden' } }}
      >
        {surface}
      </Dialog>
    );
  }

  return surface;
});

export default CodeEditor;
