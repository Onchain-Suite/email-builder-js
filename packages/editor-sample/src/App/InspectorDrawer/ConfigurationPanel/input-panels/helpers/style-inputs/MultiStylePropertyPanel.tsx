import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { TStyle } from '../../../../../../documents/blocks/helpers/TStyle';

import SingleStylePropertyPanel from './SingleStylePropertyPanel';

type MultiStylePropertyPanelProps = {
  names: (keyof TStyle)[];
  value: TStyle | undefined | null;
  onChange: (style: TStyle) => void;
};

/**
 * Groups all style controls into a labeled "Appearance" section so content
 * settings and visual settings read as two distinct areas in the sidebar.
 */
export default function MultiStylePropertyPanel({ names, value, onChange }: MultiStylePropertyPanelProps) {
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Appearance
      </Typography>
      <Stack spacing={3.5}>
        {names.map((name) => (
          <SingleStylePropertyPanel key={name} name={name} value={value || {}} onChange={onChange} />
        ))}
      </Stack>
    </Box>
  );
}
