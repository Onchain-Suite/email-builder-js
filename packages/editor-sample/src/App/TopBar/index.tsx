import React from 'react';

import { ArrowLeft } from 'lucide-react';
import { Box, Button, Chip, IconButton, Stack, Tooltip } from '@mui/material';

export default function TopBar() {

  return (
    <Box
      sx={{
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 'tooltip',
        backgroundColor: '#F0F7FF',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: '0px 2px 8px rgba(17, 24, 39, 0.06), 0px 1px 3px rgba(17, 24, 39, 0.04)',
        px: 2,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" height="100%">
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton>
            <ArrowLeft size={18} />
          </IconButton>
          <Stack direction="row" alignItems="center" spacing={1}>
            <img
              src="https://res.cloudinary.com/dwnkqkx8q/image/upload/v1761095341/full_logo_horizontal_coloured_dark_kpiv6u.png"
              alt="Onchain Suite"
              width={140}
              height={44}
            />
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Status">
            <Chip label="Message status: Idle" variant="outlined" size="small" />
          </Tooltip>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Button variant="contained" sx={{ fontWeight: 600 }}>Next</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
