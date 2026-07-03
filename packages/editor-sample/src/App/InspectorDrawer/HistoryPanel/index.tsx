import React, { useCallback, useEffect, useState } from 'react';

import {
  AddOutlined,
  DeleteOutlineOutlined,
  HistoryOutlined,
  PublicOutlined,
  RefreshOutlined,
  RestoreOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import { deleteSnapshot, useDesignSnapshots } from '../../../documents/editor/localHistory';
import EMPTY_EMAIL_MESSAGE from '../../../getConfiguration/sample/empty-email-message';
import { EmailTemplateSummary, fetchTemplateDocument, listTemplates } from '../../api/emailTemplates';
import { useApiSession } from '../../api/session';

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

function formatTime(iso: string): string {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function RecentWorkSection() {
  const snapshots = useDesignSnapshots();

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 2, pb: 0.5 }}>
        <RestoreOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="overline" color="text.secondary" sx={{ flexGrow: 1 }}>
          Recent work (this device)
        </Typography>
      </Stack>
      {snapshots.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
          Your changes are autosaved here as you edit.
        </Typography>
      ) : (
        <List dense disablePadding>
          {snapshots.map((snapshot) => (
            <ListItemButton
              key={snapshot.id}
              onClick={() => {
                if (window.confirm(`Restore "${snapshot.label}"? This will replace the current document.`)) {
                  resetDocument(snapshot.document);
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" noWrap>
                    {snapshot.label}
                  </Typography>
                }
                secondary={formatTime(snapshot.savedAt)}
              />
              <IconButton
                size="small"
                edge="end"
                title="Delete snapshot"
                onClick={(ev) => {
                  ev.stopPropagation();
                  deleteSnapshot(snapshot.id);
                }}
              >
                <DeleteOutlineOutlined fontSize="inherit" />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

type SectionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; templates: EmailTemplateSummary[] };

function useTemplates(access: 'private' | 'public'): [SectionState, () => void] {
  const [state, setState] = useState<SectionState>({ status: 'loading' });
  // Host credentials can arrive after mount (HOST_CONFIG postMessage);
  // re-fetch whenever they change.
  const { token, apiUrl, orgId } = useApiSession();

  const load = useCallback(() => {
    setState({ status: 'loading' });
    listTemplates(access)
      .then((templates) => setState({ status: 'ready', templates }))
      .catch((e) => setState({ status: 'error', message: e instanceof Error ? e.message : 'Failed to load.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, token, apiUrl, orgId]);

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
      const document = await fetchTemplateDocument(template);
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
      <Box sx={{ px: 2, pt: 2 }}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<AddOutlined fontSize="small" />}
          onClick={() => {
            if (window.confirm('Start a new blank template? Your current work stays in "Recent work" below.')) {
              resetDocument(EMPTY_EMAIL_MESSAGE);
            }
          }}
        >
          New template
        </Button>
      </Box>
      <RecentWorkSection />
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
