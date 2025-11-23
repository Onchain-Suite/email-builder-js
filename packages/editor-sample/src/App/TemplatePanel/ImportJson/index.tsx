import React, { useState } from 'react';

import { FileUp } from 'lucide-react';
import { IconButton, Tooltip } from '@mui/material';

import ImportJsonDialog from './ImportJsonDialog';

export default function ImportJson() {
  const [open, setOpen] = useState(false);

  let dialog = null;
  if (open) {
    dialog = <ImportJsonDialog onClose={() => setOpen(false)} />;
  }

  return (
    <>
      <Tooltip title="Import JSON">
        <IconButton onClick={() => setOpen(true)}>
          <FileUp size={16} />
        </IconButton>
      </Tooltip>
      {dialog}
    </>
  );
}
