import React, { useCallback, useEffect, useState } from 'react';

import {
  AddOutlined,
  DeleteSweepOutlined,
  ExpandMoreOutlined,
  HistoryOutlined,
  PublicOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import { resetDocument } from '../../../documents/editor/EditorContext';
import EMPTY_EMAIL_MESSAGE from '../../../getConfiguration/sample/empty-email-message';
import {
  deleteTemplates,
  EmailTemplateSummary,
  fetchTemplateDocument,
  findDuplicateTemplates,
  listTemplates,
} from '../../api/emailTemplates';
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


export type TConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
};

function ConfirmDialog({ request, onClose }: { request: TConfirmRequest | null; onClose: () => void }) {
  return (
    <Dialog open={request !== null} onClose={onClose} maxWidth="xs">
      <DialogTitle>{request?.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {request?.message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            request?.action();
            onClose();
          }}
        >
          {request?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
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
  requestConfirm?: (request: TConfirmRequest) => void;
};

function TemplateSection({ title, icon, emptyMessage, access, loadingId, onOpen, requestConfirm }: TemplateSectionProps) {
  const [state, reload] = useTemplates(access);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleCleanup = async () => {
    if (!requestConfirm) return;
    setCleanupBusy(true);
    setCleanupMessage(null);
    try {
      const { keep, remove } = await findDuplicateTemplates();
      if (remove.length === 0) {
        setCleanupMessage('No duplicates found — every template has a unique name.');
        return;
      }
      requestConfirm({
        title: `Delete ${remove.length} duplicate template${remove.length === 1 ? '' : 's'}?`,
        message: `Templates sharing the same name will be removed, keeping only the most recent of each (${keep.length} kept). This cannot be undone.`,
        confirmLabel: 'Delete duplicates',
        action: () =>
          void (async () => {
            setCleanupBusy(true);
            try {
              const deleted = await deleteTemplates(remove);
              setCleanupMessage(`Deleted ${deleted} duplicate${deleted === 1 ? '' : 's'}.`);
              reload();
            } catch (e) {
              setCleanupMessage(e instanceof Error ? e.message : 'Cleanup failed.');
            } finally {
              setCleanupBusy(false);
            }
          })(),
      });
    } catch (e) {
      setCleanupMessage(e instanceof Error ? e.message : 'Cleanup failed.');
    } finally {
      setCleanupBusy(false);
    }
  };

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
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          pt: 1.5,
          pb: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover .section-chevron': { color: 'text.primary' },
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {icon}
        <Typography variant="overline" color="text.secondary" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {expanded && access === 'private' && requestConfirm && (
          <IconButton
            size="small"
            onClick={(ev) => {
              ev.stopPropagation();
              void handleCleanup();
            }}
            disabled={cleanupBusy}
            title="Remove duplicates (keeps the most recent of each name)"
          >
            {cleanupBusy ? <CircularProgress size={14} /> : <DeleteSweepOutlined fontSize="inherit" />}
          </IconButton>
        )}
        {expanded && (
          <IconButton
            size="small"
            onClick={(ev) => {
              ev.stopPropagation();
              reload();
            }}
            title="Refresh"
          >
            <RefreshOutlined fontSize="inherit" />
          </IconButton>
        )}
        <ButtonBase
          className="section-chevron"
          aria-label={expanded ? 'Collapse section' : 'Expand section'}
          sx={{
            color: 'text.secondary',
            borderRadius: 1,
            display: 'flex',
            transition: 'transform 200ms ease, color 150ms ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ExpandMoreOutlined fontSize="small" />
        </ButtonBase>
      </Stack>
      <Collapse in={expanded} timeout={200} unmountOnExit>
        {cleanupMessage && (
          <Alert severity="info" onClose={() => setCleanupMessage(null)} sx={{ mx: 1, mb: 1 }}>
            {cleanupMessage}
          </Alert>
        )}
        {body}
      </Collapse>
    </Box>
  );
}

export default function HistoryPanel() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<TConfirmRequest | null>(null);

  const openTemplate = async (template: EmailTemplateSummary) => {
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

  const handleOpen = (template: EmailTemplateSummary) => {
    setConfirmRequest({
      title: `Open "${template.name}"?`,
      message: 'It will replace what’s currently on the canvas. Unsaved changes will be lost.',
      confirmLabel: 'Open template',
      action: () => void openTemplate(template),
    });
  };

  return (
    <Box pb={2}>
      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
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
          onClick={() =>
            setConfirmRequest({
              title: 'Start a new template?',
              message: 'You’ll get a blank canvas. Unsaved changes to the current design will be lost.',
              confirmLabel: 'New template',
              action: () => resetDocument(EMPTY_EMAIL_MESSAGE),
            })
          }
        >
          New template
        </Button>
      </Box>
      <TemplateSection
        title="Your recent templates"
        icon={<HistoryOutlined fontSize="small" sx={{ color: 'text.secondary' }} />}
        emptyMessage="No templates yet. Save one and it will show up here."
        access="private"
        loadingId={loadingId}
        onOpen={handleOpen}
        requestConfirm={setConfirmRequest}
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
