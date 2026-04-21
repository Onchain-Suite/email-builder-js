import React, { useMemo } from 'react';
import { FileDown } from 'lucide-react';
import { IconButton, Tooltip } from '@mui/material';
import { useDocument } from '../../../documents/editor/EditorContext';
export default function DownloadJson() {
    const doc = useDocument();
    const href = useMemo(() => {
        return `data:text/plain,${encodeURIComponent(JSON.stringify(doc, null, '  '))}`;
    }, [doc]);
    return (React.createElement(Tooltip, { title: "Download JSON file" },
        React.createElement(IconButton, { href: href, download: "emailTemplate.json" },
            React.createElement(FileDown, { size: 16 }))));
}
//# sourceMappingURL=index.js.map