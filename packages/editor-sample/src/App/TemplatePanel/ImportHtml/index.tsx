import React, { useState } from 'react';

import { FileCode } from 'lucide-react';
import { IconButton, Tooltip } from '@mui/material';

import ImportHtmlDialog from './ImportHtmlDialog';

export default function ImportHtml() {
  const [open, setOpen] = useState(false);

  let dialog = null;
  if (open) {
    dialog = <ImportHtmlDialog onClose={() => setOpen(false)} />;
  }

  return (
    <>
      <Tooltip title="Import HTML">
        <IconButton onClick={() => setOpen(true)}>
          <FileCode size={16} />
        </IconButton>
      </Tooltip>
      {dialog}
    </>
  );
}
