import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Box, Button, Chip, IconButton, Menu, MenuItem, Snackbar, Stack, Tooltip } from '@mui/material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { setSidebarTab, toggleSamplesDrawerOpen, useDocument } from '../../documents/editor/EditorContext';
export default function TopBar() {
    const [menuEl, setMenuEl] = useState(null);
    const [message, setMessage] = useState(null);
    const document = useDocument();
    const open = Boolean(menuEl);
    const timestamp = useMemo(() => new Date().toLocaleString(), []);
    const handleOpenMenu = (e) => {
        if (open) {
            setMenuEl(null);
        }
        else {
            setMenuEl(e.currentTarget);
        }
    };
    const handleCloseMenu = () => setMenuEl(null);
    const handleSaveTemplate = () => {
        // Generate HTML from the document
        const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
        // Send data back to host app
        window.parent.postMessage({
            type: 'EMAIL_BUILDER_SAVE',
            data: {
                json: document,
                html: html,
            }
        }, '*');
        setMessage('Template saved & sent to host app');
        handleCloseMenu();
    };
    const handleChangeTemplate = () => {
        setSidebarTab('history');
        toggleSamplesDrawerOpen();
        handleCloseMenu();
    };
    const handleCloseMessage = () => setMessage(null);
    return (React.createElement(Box, { sx: {
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 'tooltip',
            backgroundColor: '#F0F7FF',
            borderBottom: 1,
            borderColor: 'divider',
            boxShadow: '0px 2px 8px rgba(17, 24, 39, 0.06), 0px 1px 3px rgba(17, 24, 39, 0.04)',
            px: 2,
        } },
        React.createElement(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", height: "100%" },
            React.createElement(Stack, { direction: "row", alignItems: "center", spacing: 1 },
                React.createElement(IconButton, null,
                    React.createElement(ArrowLeft, { size: 18 })),
                React.createElement(Stack, { direction: "row", alignItems: "center", spacing: 1 },
                    React.createElement("img", { src: "https://res.cloudinary.com/dwnkqkx8q/image/upload/v1761095341/full_logo_horizontal_coloured_dark_kpiv6u.png", alt: "Onchain Suite", width: 140, height: 44 }))),
            React.createElement(Stack, { direction: "row", alignItems: "center", spacing: 2 },
                React.createElement(Tooltip, { title: "Status" },
                    React.createElement(Chip, { label: "Message status: Idle", variant: "outlined", size: "small" }))),
            React.createElement(Stack, { direction: "row", alignItems: "center", spacing: 2 },
                React.createElement(Button, { variant: "outlined", endIcon: React.createElement(ChevronDown, { size: 16 }), onClick: handleOpenMenu, sx: { fontWeight: 500 } }, "Manage Template"),
                React.createElement(Menu, { anchorEl: menuEl, open: open, onClose: handleCloseMenu },
                    React.createElement(MenuItem, { onClick: handleSaveTemplate }, "Save as template"),
                    React.createElement(MenuItem, { onClick: handleChangeTemplate }, "Change template")),
                React.createElement(Button, { variant: "contained", sx: { fontWeight: 600 } }, "Next"))),
        React.createElement(Snackbar, { anchorOrigin: { vertical: 'top', horizontal: 'center' }, open: message !== null, onClose: handleCloseMessage, message: message })));
}
//# sourceMappingURL=index.js.map