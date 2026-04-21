import React, { useState } from 'react';
import { FileUp } from 'lucide-react';
import { IconButton, Tooltip } from '@mui/material';
import ImportJsonDialog from './ImportJsonDialog';
export default function ImportJson() {
    const [open, setOpen] = useState(false);
    let dialog = null;
    if (open) {
        dialog = React.createElement(ImportJsonDialog, { onClose: () => setOpen(false) });
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(Tooltip, { title: "Import JSON" },
            React.createElement(IconButton, { onClick: () => setOpen(true) },
                React.createElement(FileUp, { size: 16 }))),
        dialog));
}
//# sourceMappingURL=index.js.map