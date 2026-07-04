import React, { useRef, useState } from 'react';

import { BellRing } from 'lucide-react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  EMPTY_PUSH_CONTENT,
  isPushContentPresent,
  setPushContent,
  TPushContent,
  usePushContent,
} from '../../../documents/editor/EditorContext';
import VariableTagButton from '../../InspectorDrawer/ConfigurationPanel/input-panels/helpers/inputs/VariableTagPicker';
import { sendTestPush } from '../../api/inappPush';

const TITLE_SOFT_LIMIT = 65;
const BODY_SOFT_LIMIT = 180;

type FieldKey = 'title' | 'body' | 'ctaLabel' | 'ctaUrl';

function ToastPreview({ push }: { push: TPushContent }) {
  const title = push.title.trim() || 'Notification title';
  const body = push.body.trim() || 'The notification body will appear here.';
  const hasCta = push.ctaLabel.trim().length > 0;
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background:
          'radial-gradient(rgba(17,24,39,0.06) 1px, transparent 1px) 0 0 / 16px 16px, linear-gradient(180deg, #FAFAFB, #F2F3F6)',
        p: 2,
        pt: 6,
        minHeight: 260,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 320,
          maxWidth: '100%',
          borderRadius: 2.5,
          p: 1.75,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BellRing size={18} />
        </Box>
        <Stack gap={0.5} sx={{ minWidth: 0 }}>
          <Typography fontSize={14} fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
            {title}
          </Typography>
          <Typography fontSize={13} color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {body}
          </Typography>
          {hasCta && (
            <Box>
              <Button size="small" variant="contained" sx={{ mt: 0.5, textTransform: 'none' }}>
                {push.ctaLabel.trim()}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default function PushPanel() {
  const push = usePushContent();
  const inputRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});
  const [focusedField, setFocusedField] = useState<FieldKey>('body');

  const [testWallet, setTestWallet] = useState('');
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const update = (patch: Partial<TPushContent>) => setPushContent({ ...push, ...patch });

  const insertTagAtCursor = (tagValue: string) => {
    const key = focusedField;
    const input = inputRefs.current[key];
    const currentValue = push[key] ?? '';
    const start = input?.selectionStart ?? currentValue.length;
    const end = input?.selectionEnd ?? currentValue.length;
    update({ [key]: currentValue.substring(0, start) + tagValue + currentValue.substring(end) });
    setTimeout(() => {
      input?.focus();
      input?.setSelectionRange(start + tagValue.length, start + tagValue.length);
    }, 0);
  };

  const fieldProps = (key: FieldKey) => ({
    inputRef: (el: HTMLInputElement | null) => {
      inputRefs.current[key] = el;
    },
    onFocus: () => setFocusedField(key),
    value: push[key],
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => update({ [key]: ev.target.value }),
  });

  const canTest = isPushContentPresent(push) && testWallet.trim().length > 0 && !testBusy;

  const handleTestSend = async () => {
    setTestBusy(true);
    setTestResult(null);
    try {
      await sendTestPush({
        walletAddress: testWallet.trim(),
        title: push.title.trim(),
        body: push.body.trim(),
        ctaLabel: push.ctaLabel.trim() || undefined,
        ctaUrl: push.ctaUrl.trim() || undefined,
      });
      setTestResult({
        severity: 'success',
        message: 'Test push sent. It appears live anywhere that wallet is connected through the SDK.',
      });
    } catch (e) {
      setTestResult({ severity: 'error', message: e instanceof Error ? e.message : 'Test push failed.' });
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={3}
        sx={{ width: '100%', maxWidth: 980, alignItems: 'flex-start' }}
      >
        <Paper sx={{ p: 3, flex: 1, width: '100%', borderRadius: 3 }}>
          <Stack gap={2.5}>
            <Box>
              <Typography variant="h6" fontSize={17}>
                In-app push notification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saved with this campaign and delivered as a toast to wallets connected through the Onchain Suite SDK
                on your protocol&rsquo;s site. Variables are replaced per recipient at send time. Leave the title and
                body empty if this campaign should not send a push.
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="flex-end">
              <VariableTagButton onInsert={insertTagAtCursor} />
            </Stack>

            <TextField
              label="Title"
              fullWidth
              {...fieldProps('title')}
              helperText={`${push.title.length}/${TITLE_SOFT_LIMIT} — longer titles may truncate in the toast`}
              error={push.title.length > TITLE_SOFT_LIMIT}
            />
            <TextField
              label="Body"
              fullWidth
              multiline
              minRows={3}
              {...fieldProps('body')}
              helperText={`${push.body.length}/${BODY_SOFT_LIMIT}`}
              error={push.body.length > BODY_SOFT_LIMIT}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="CTA label" fullWidth {...fieldProps('ctaLabel')} placeholder="View details" />
              <TextField
                label="CTA URL"
                fullWidth
                {...fieldProps('ctaUrl')}
                placeholder="https://app.example.com/…"
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button
                size="small"
                color="inherit"
                onClick={() => setPushContent(EMPTY_PUSH_CONTENT)}
                disabled={!isPushContentPresent(push) && push.ctaLabel === '' && push.ctaUrl === ''}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack gap={3} sx={{ flex: 1, width: '100%' }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Live preview
            </Typography>
            <ToastPreview push={push} />
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Send a test
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              The wallet must be connected through the SDK somewhere right now to see it live.
            </Typography>
            {testResult && (
              <Alert severity={testResult.severity} onClose={() => setTestResult(null)} sx={{ mb: 2 }}>
                {testResult.message}
              </Alert>
            )}
            <Stack direction="row" gap={1.5}>
              <TextField
                size="small"
                fullWidth
                label="Wallet address"
                placeholder="0x…"
                value={testWallet}
                onChange={(ev) => setTestWallet(ev.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => void handleTestSend()}
                disabled={!canTest}
                sx={{ whiteSpace: 'nowrap', px: 3 }}
              >
                {testBusy ? <CircularProgress size={18} color="inherit" /> : 'Send test'}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
