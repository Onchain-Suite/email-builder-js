import React from 'react';

import { Box, ButtonBase, Stack, Typography } from '@mui/material';

import { appendBlockToRoot } from '../../documents/editor/EditorContext';
import { BUTTONS } from '../../documents/blocks/helpers/EditorChildrenIds/AddBlockMenu/buttons';

const LAYOUT_LABELS = new Set(['Columns', 'Container']);

function BlockCard({ label, icon, onClick }: { label: string; icon: JSX.Element; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        px: 1.25,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        alignItems: 'center',
        justifyContent: 'center',
        transition: (theme) =>
          theme.transitions.create(['border-color', 'transform', 'box-shadow'], { duration: 150 }),
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px rgba(33,36,67,0.1)',
          '& .block-card-icon': { color: 'primary.main' },
        },
      }}
    >
      <Box className="block-card-icon" sx={{ color: 'text.secondary', display: 'flex', transition: 'color 150ms' }}>
        {icon}
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 500, lineHeight: 1 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}

/**
 * Click-to-add block palette. Blocks are appended to the end of the email
 * and selected for immediate configuration.
 */
export default function BlocksPanel() {
  const contentBlocks = BUTTONS.filter((b) => !LAYOUT_LABELS.has(b.label));
  const layoutBlocks = BUTTONS.filter((b) => LAYOUT_LABELS.has(b.label));

  const renderGrid = (blocks: typeof BUTTONS) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      {blocks.map((button) => (
        <BlockCard
          key={button.label}
          label={button.label}
          icon={button.icon}
          onClick={() => appendBlockToRoot(button.block())}
        />
      ))}
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Blocks
        </Typography>
        {renderGrid(contentBlocks)}
      </Stack>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Layout
        </Typography>
        {renderGrid(layoutBlocks)}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Click a block to add it to the end of your email, or use the + buttons between blocks on the canvas.
      </Typography>
    </Stack>
  );
}
