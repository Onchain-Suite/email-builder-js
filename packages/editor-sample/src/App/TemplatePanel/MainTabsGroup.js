import React from 'react';
import { Code2, Braces, PencilLine, Eye } from 'lucide-react';
import { Tab, Tabs, Tooltip } from '@mui/material';
import { setSelectedMainTab, useSelectedMainTab } from '../../documents/editor/EditorContext';
export default function MainTabsGroup() {
    const selectedMainTab = useSelectedMainTab();
    const handleChange = (_, v) => {
        switch (v) {
            case 'json':
            case 'preview':
            case 'editor':
            case 'html':
                setSelectedMainTab(v);
                return;
            default:
                setSelectedMainTab('editor');
        }
    };
    return (React.createElement(Tabs, { value: selectedMainTab, onChange: handleChange },
        React.createElement(Tab, { value: "editor", label: React.createElement(Tooltip, { title: "Edit" },
                React.createElement(PencilLine, { size: 16 })) }),
        React.createElement(Tab, { value: "preview", label: React.createElement(Tooltip, { title: "Preview" },
                React.createElement(Eye, { size: 16 })) }),
        React.createElement(Tab, { value: "html", label: React.createElement(Tooltip, { title: "HTML output" },
                React.createElement(Code2, { size: 16 })) }),
        React.createElement(Tab, { value: "json", label: React.createElement(Tooltip, { title: "JSON output" },
                React.createElement(Braces, { size: 16 })) })));
}
//# sourceMappingURL=MainTabsGroup.js.map