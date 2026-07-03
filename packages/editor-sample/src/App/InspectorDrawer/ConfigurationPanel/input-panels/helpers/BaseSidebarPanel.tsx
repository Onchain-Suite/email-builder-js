import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

type SidebarPanelProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * Shared frame for the Inspect/Styles panels: an accent-marked header
 * followed by consistently spaced controls. Style controls are grouped
 * separately by MultiStylePropertyPanel's "Appearance" section.
 */
export default function BaseSidebarPanel({ title, children }: SidebarPanelProps) {
  return (
    <Box p={2.5}>
      <Stack direction="row" alignItems="center" spacing={1.25} mb={2.5}>
        <Box sx={{ width: 3, height: 16, borderRadius: 1, bgcolor: 'primary.main', flexShrink: 0 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={3.5} mb={3}>
        {children}
      </Stack>
    </Box>
  );
}
