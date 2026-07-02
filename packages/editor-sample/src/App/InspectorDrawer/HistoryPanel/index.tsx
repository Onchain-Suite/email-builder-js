import React, { useCallback, useEffect, useState } from 'react';

import { HistoryOutlined, PublicOutlined, RefreshOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import { resetDocument } from '../../../documents/editor/EditorContext';
import { EmailTemplateSummary, fetchTemplateDocument, listTemplates } from '../../api/emailTemplates';

function formatDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type SectionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; templates: EmailTemplateSummary[] };

function useTemplates(access: 'private' | 'public'): [SectionState, () => void] {
  const [state, setState] = useState<SectionState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    listTemplates(access)
      .then((templates) => setState({ status: 'ready', templates }))
      .catch((e) => setState({ status: 'error', message: e instanceof Error ? e.message : 'Failed to load.' }));
  }, [access]);

  useEffect(load, [load]);
  return [state, load];
}

type TemplateSectionProps = {
  title: string;
  icon: React.ReactNode;
  emptyMessage: string;
  access: 'private' | 'public';
  loadingId: string | null;
  onOpen: (template: EmailTemplateSummary) => void;
};

function TemplateSection({ title, icon, emptyMessage, access, loadingId, onOpen }: TemplateSectionProps) {
  const [state, reload] = useTemplates(access);

  let body: JSX.Element;
  switch (state.status) {
    case 'loading':
      body = (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={20} />
        </Box>
      );
      break;
    case 'error':
      body = (
        <Alert severity="error" sx={{ mx: 1 }}>
          {state.message}
        </Alert>
      );
      break;
    case 'ready':
      if (state.templates.length === 0) {
        body = (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            {emptyMessage}
          </Typography>
        );
      } else {
        body = (
          <List dense disablePadding>
            {state.templates.map((template) => {
              const date = formatDate(template.updatedAt);
              return (
                <ListItemButton
                  key={template.id}
                  disabled={loadingId !== null}
                  onClick={() => onOpen(template)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" noWrap>
                          {template.name}
                        </Typography>
                        {template.isRecommended && <Chip label="Recommended" size="small" color="primary" />}
                      </Stack>
                    }
                    secondary={[date, template.category].filter(Boolean).join(' · ') || null}
                  />
                  {loadingId === template.id && <CircularProgress size={16} />}
                </ListItemButton>
              );
            })}
          </List>
        );
      }
      break;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 2, pb: 0.5 }}>
        {icon}
        <Typography variant="overline" color="text.secondary" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={reload} title="Refresh">
          <RefreshOutlined fontSize="inherit" />
        </IconButton>
      </Stack>
      {body}
    </Box>
  );
}

export default function HistoryPanel() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const handleOpen = async (template: EmailTemplateSummary) => {
    if (!window.confirm(`Open "${template.name}"? This will replace the document you are currently editing.`)) {
      return;
    }
    setLoadingId(template.id);
    setOpenError(null);
    try {
      const document = await fetchTemplateDocument(template.id);
      resetDocument(document);
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : 'Could not open the template.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Box pb={2}>
      {openError && (
        <Alert severity="error" onClose={() => setOpenError(null)} sx={{ m: 1 }}>
          {openError}
        </Alert>
      )}
      <TemplateSection
        title="Your recent templates"
        icon={<HistoryOutlined fontSize="small" sx={{ color: 'text.secondary' }} />}
        emptyMessage="No templates yet. Save one and it will show up here."
        access="private"
        loadingId={loadingId}
        onOpen={handleOpen}
      />
      <TemplateSection
        title="Public templates"
        icon={<PublicOutlined fontSize="small" sx={{ color: 'text.secondary' }} />}
        emptyMessage="No public templates available."
        access="public"
        loadingId={loadingId}
        onOpen={handleOpen}
      />
    </Box>
  );
}
