import React from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import { checkTitle, presendHeadline, TPresendBlock } from './presendBlock';

type PresendBlockedDialogProps = {
  block: TPresendBlock | null;
  onClose: () => void;
};

/**
 * Shown when the backend refuses a save because the email breaks a pre-send
 * content block. The edits stay in the editor; only the save did not happen.
 */
export default function PresendBlockedDialog({ block, onClose }: PresendBlockedDialogProps) {
  if (!block) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="presend-blocked-title">
      <DialogTitle id="presend-blocked-title">Not saved</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {presendHeadline(block)}
        </Alert>
        <Stack spacing={2}>
          {block.checks.map((check) => (
            <Box key={check.code} data-testid={`presend-check-${check.code}`}>
              <Typography variant="subtitle2" gutterBottom>
                {checkTitle(check.code)}
              </Typography>
              {check.message && (
                <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                  {check.message}
                </Typography>
              )}
              {check.links.length > 0 && (
                <Box component="ul" sx={{ m: 0, mb: 1, pl: 3 }}>
                  {check.links.map((link) => (
                    <Typography
                      key={link}
                      component="li"
                      variant="body2"
                      sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'error.main' }}
                    >
                      {link}
                    </Typography>
                  ))}
                </Box>
              )}
              {check.fix && (
                <Typography variant="body2" color="text.secondary">
                  <strong>How to fix:</strong> {check.fix}
                </Typography>
              )}
            </Box>
          ))}
          {block.checks.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {block.message}
            </Typography>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Your edits are still here. Fix the issue above, then save again.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Back to editing
        </Button>
      </DialogActions>
    </Dialog>
  );
}
