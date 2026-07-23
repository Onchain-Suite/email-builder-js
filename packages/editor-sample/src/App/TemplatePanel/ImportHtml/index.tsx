import React, { useState } from 'react';

import { Button, Tooltip } from '@mui/material';
import { CodeXml } from 'lucide-react';

import ImportHtmlDialog from './ImportHtmlDialog';

export default function ImportHtml() {
  const [open, setOpen] = useState(false);

  let dialog = null;
  if (open) {
    dialog = <ImportHtmlDialog onClose={() => setOpen(false)} />;
  }

  return (
    <>
      <Tooltip title="Replace the template with pasted HTML">
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => setOpen(true)}
          startIcon={<CodeXml size={15} />}
          sx={{
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: 1.5,
            borderColor: 'divider',
            color: 'text.secondary',
            px: 1.25,
            '&:hover': { borderColor: 'primary.main', color: 'primary.main', backgroundColor: 'transparent' },
          }}
        >
          Import HTML
        </Button>
      </Tooltip>
      {dialog}
    </>
  );
}
