import React from 'react';
import { ChevronLeft, Menu } from 'lucide-react';
import { IconButton } from '@mui/material';
import { toggleSamplesDrawerOpen, useSamplesDrawerOpen } from '../../documents/editor/EditorContext';
function useIcon() {
    const samplesDrawerOpen = useSamplesDrawerOpen();
    if (samplesDrawerOpen) {
        return React.createElement(ChevronLeft, { size: 16 });
    }
    return React.createElement(Menu, { size: 16 });
}
export default function ToggleSamplesPanelButton() {
    const icon = useIcon();
    return React.createElement(IconButton, { onClick: toggleSamplesDrawerOpen }, icon);
}
//# sourceMappingURL=ToggleSamplesPanelButton.js.map