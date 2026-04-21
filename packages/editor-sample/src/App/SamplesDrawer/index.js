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
                return React.createElement(ConfigurationPanel, null);
            case 'styles':
                return React.createElement(StylesPanel, null);
            case 'history':
                return (React.createElement(Stack, { spacing: 2, sx: { '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } } },
                    React.createElement(Typography, { variant: "overline", color: "text.secondary" }, "Templates"),
                    React.createElement(Stack, { alignItems: "flex-start" },
                        React.createElement(SidebarButton, { href: "#" }, "Empty"),
                        React.createElement(SidebarButton, { href: "#sample/welcome" }, "Welcome email")),
                    React.createElement(Divider, null)));
        }
    };
    return (React.createElement(Drawer, { variant: "persistent", anchor: "left", open: samplesDrawerOpen, sx: {
            width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
            '& .MuiDrawer-paper': {
                top: 56,
                height: 'calc(100% - 56px)',
            },
        } },
        React.createElement(Stack, { spacing: 0, width: SAMPLES_DRAWER_WIDTH, height: "100%" },
            React.createElement(Box, { px: 2, sx: { borderBottom: 1, borderColor: 'divider' } },
                React.createElement(Tabs, { value: selectedSidebarTab, onChange: (_, v) => setSidebarTab(v) },
                    React.createElement(Tab, { value: "history", label: "History" }),
                    React.createElement(Tab, { value: "styles", label: "Styles" }),
                    React.createElement(Tab, { value: "block-configuration", label: "Inspect" }))),
            React.createElement(Box, { sx: { height: 'calc(100% - 49px - 52px)', overflow: 'auto' }, p: 2 }, renderCurrentSidebarPanel()))));
}
//# sourceMappingURL=index.js.map