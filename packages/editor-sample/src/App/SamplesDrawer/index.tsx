import React from 'react';

import { Box, Divider, Drawer, Stack, Tab, Tabs, Typography } from '@mui/material';

import { setSidebarTab, useSamplesDrawerOpen, useSelectedSidebarTab } from '../../documents/editor/EditorContext';

import ConfigurationPanel from '../InspectorDrawer/ConfigurationPanel';
import StylesPanel from '../InspectorDrawer/StylesPanel';
import SidebarButton from './SidebarButton';

export const SAMPLES_DRAWER_WIDTH = 240;

export default function SamplesDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const selectedSidebarTab = useSelectedSidebarTab();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration':
        return <ConfigurationPanel />;
      case 'styles':
        return <StylesPanel />;
      case 'history':
        return (
          <Stack spacing={2} sx={{ '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } }}>
            <Typography variant="overline" color="text.secondary">Templates</Typography>
            <Stack alignItems="flex-start">
              <SidebarButton href="#">Empty</SidebarButton>
              <SidebarButton href="#sample/welcome">Welcome email</SidebarButton>
            </Stack>
            <Divider />
          </Stack>
        );
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
        '& .MuiDrawer-paper': {
          top: 56,
          height: 'calc(100% - 56px)',
        },
      }}
    >
      <Stack spacing={0} width={SAMPLES_DRAWER_WIDTH} height="100%">
        <Box px={2} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedSidebarTab} onChange={(_: React.SyntheticEvent, v: any) => setSidebarTab(v)}>
            <Tab value="history" label="History" />
            <Tab value="styles" label="Styles" />
            <Tab value="block-configuration" label="Inspect" />
          </Tabs>
        </Box>
        <Box sx={{ height: 'calc(100% - 49px - 52px)', overflow: 'auto' }} p={2}>
          {renderCurrentSidebarPanel()}
        </Box>
      </Stack>
    </Drawer>
  );
}
