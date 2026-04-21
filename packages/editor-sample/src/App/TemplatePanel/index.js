import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Paper } from '@mui/material';
import { Reader } from '@usewaypoint/email-builder';
import EditorBlock from '../../documents/editor/EditorBlock';
import { setSelectedScreenSize, useDocument, useSelectedMainTab, useSelectedScreenSize, } from '../../documents/editor/EditorContext';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';
import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import ImportJson from './ImportJson';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';
export default function TemplatePanel() {
    const document = useDocument();
    const selectedMainTab = useSelectedMainTab();
    const selectedScreenSize = useSelectedScreenSize();
    let mainBoxSx = {
        height: '100%',
        px: 20,
        py: 5,
    };
    if (selectedScreenSize === 'mobile') {
        mainBoxSx = Object.assign(Object.assign({}, mainBoxSx), { margin: '32px auto', width: 370, height: 800, boxShadow: 'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px', p: 3 });
    }
    const handleScreenSizeChange = (_, value) => {
        switch (value) {
            case 'mobile':
            case 'desktop':
                setSelectedScreenSize(value);
                return;
            default:
                setSelectedScreenSize('desktop');
        }
    };
    const renderMainPanel = () => {
        switch (selectedMainTab) {
            case 'editor':
                return (React.createElement(Box, { sx: mainBoxSx },
                    React.createElement(Paper, { sx: { p: 2 } },
                        React.createElement(EditorBlock, { id: "root" }))));
            case 'preview':
                return (React.createElement(Box, { sx: mainBoxSx },
                    React.createElement(Paper, { sx: { p: 2 } },
                        React.createElement(Reader, { document: document, rootBlockId: "root" }))));
            case 'html':
                return React.createElement(HtmlPanel, null);
            case 'json':
                return React.createElement(JsonPanel, null);
        }
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(Stack, { sx: {
                height: 49,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'white',
                boxShadow: '0px 2px 8px rgba(17, 24, 39, 0.06), 0px 1px 3px rgba(17, 24, 39, 0.04)',
                transition: 'box-shadow 300ms ease-out, backdrop-filter 300ms ease-out',
                position: 'sticky',
                top: 0,
                zIndex: 'appBar',
                px: 1,
            }, direction: "row", justifyContent: "space-between", alignItems: "center" },
            React.createElement(ToggleSamplesPanelButton, null),
            React.createElement(Stack, { px: 2, direction: "row", gap: 2, width: "100%", justifyContent: "space-between", alignItems: "center" },
                React.createElement(Stack, { direction: "row", spacing: 2 },
                    React.createElement(MainTabsGroup, null)),
                React.createElement(Stack, { direction: "row", spacing: 2 },
                    React.createElement(DownloadJson, null),
                    React.createElement(ImportJson, null),
                    React.createElement(ToggleButtonGroup, { value: selectedScreenSize, exclusive: true, size: "small", onChange: handleScreenSizeChange },
                        React.createElement(ToggleButton, { value: "desktop" },
                            React.createElement(Tooltip, { title: "Desktop view" },
                                React.createElement(Monitor, { size: 16 }))),
                        React.createElement(ToggleButton, { value: "mobile" },
                            React.createElement(Tooltip, { title: "Mobile view" },
                                React.createElement(Smartphone, { size: 16 })))),
                    React.createElement(ShareButton, null)))),
        React.createElement(Box, { sx: { height: 'calc(100vh - 49px)', overflow: 'auto', minWidth: 370 } }, renderMainPanel())));
}
//# sourceMappingURL=index.js.map