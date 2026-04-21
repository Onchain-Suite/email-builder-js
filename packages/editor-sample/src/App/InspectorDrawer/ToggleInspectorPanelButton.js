import React from 'react';
import { ChevronRight, PanelRightOpen } from 'lucide-react';
import { IconButton } from '@mui/material';
import { toggleInspectorDrawerOpen, useInspectorDrawerOpen } from '../../documents/editor/EditorContext';
export default function ToggleInspectorPanelButton() {
    const inspectorDrawerOpen = useInspectorDrawerOpen();
    const handleClick = () => {
        toggleInspectorDrawerOpen();
    };
    if (inspectorDrawerOpen) {
        return (React.createElement(IconButton, { onClick: handleClick },
            React.createElement(ChevronRight, { size: 16 })));
    }
    return (React.createElement(IconButton, { onClick: handleClick },
        React.createElement(PanelRightOpen, { size: 16 })));
}
//# sourceMappingURL=ToggleInspectorPanelButton.js.map