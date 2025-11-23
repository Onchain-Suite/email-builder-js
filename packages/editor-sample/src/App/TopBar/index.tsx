import React, { useMemo, useState } from 'react';

import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Box, Button, Chip, IconButton, Menu, MenuItem, Snackbar, Stack, Tooltip, Typography } from '@mui/material';

import { setSidebarTab, toggleSamplesDrawerOpen } from '../../documents/editor/EditorContext';

export default function TopBar() {
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const open = Boolean(menuEl);
  const timestamp = useMemo(() => new Date().toLocaleString(), []);

  const handleOpenMenu: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (open) {
      setMenuEl(null);
    } else {
      setMenuEl(e.currentTarget);
    }
  };
  const handleCloseMenu = () => setMenuEl(null);

  const handleSaveTemplate = () => {
    setMessage('Template saved');
    handleCloseMenu();
  };
  const handleChangeTemplate = () => {
    setSidebarTab('history');
    toggleSamplesDrawerOpen();
    handleCloseMenu();
  };
  const handleCloseMessage = () => setMessage(null);

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
          <Button
            variant="outlined"
            endIcon={<ChevronDown size={16} />}
            onClick={handleOpenMenu}
            sx={{ fontWeight: 500 }}
          >
            Manage Template
          </Button>
          <Menu anchorEl={menuEl} open={open} onClose={handleCloseMenu}>
            <MenuItem onClick={handleSaveTemplate}>Save as template</MenuItem>
            <MenuItem onClick={handleChangeTemplate}>Change template</MenuItem>
          </Menu>
          <Button variant="contained" sx={{ fontWeight: 600 }}>Next</Button>
        </Stack>
      </Stack>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={message !== null}
        onClose={handleCloseMessage}
        message={message}
      />
    </Box>
  );
}