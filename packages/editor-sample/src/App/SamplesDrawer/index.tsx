import React from 'react';

import { Box, Drawer, Stack, Tab, Tabs } from '@mui/material';

import { setSidebarTab, useSamplesDrawerOpen, useSelectedSidebarTab } from '../../documents/editor/EditorContext';

import ConfigurationPanel from '../InspectorDrawer/ConfigurationPanel';
import HistoryPanel from '../InspectorDrawer/HistoryPanel';
import StylesPanel from '../InspectorDrawer/StylesPanel';
import BlocksPanel from './BlocksPanel';

export const SAMPLES_DRAWER_WIDTH = 260;

export default function SamplesDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const selectedSidebarTab = useSelectedSidebarTab();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'blocks':
        return (
          <Box p={2}>
            <BlocksPanel />
          </Box>
        );
      case 'block-configuration':
        return <ConfigurationPanel />;
      case 'styles':
        return <StylesPanel />;
      case 'history':
        return <HistoryPanel />;
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
          top: 'var(--editor-top-offset, 56px)',
          height: 'calc(100% - var(--editor-top-offset, 56px))',
          backgroundImage: 'none',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack spacing={0} width={SAMPLES_DRAWER_WIDTH} height="100%">
        <Box px={1.5} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedSidebarTab} onChange={(_: React.SyntheticEvent, v: any) => setSidebarTab(v)}>
            <Tab value="blocks" label="Blocks" />
            <Tab value="history" label="Templates" />
            <Tab value="styles" label="Styles" />
            <Tab value="block-configuration" label="Inspect" />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>{renderCurrentSidebarPanel()}</Box>
      </Stack>
    </Drawer>
  );
}
