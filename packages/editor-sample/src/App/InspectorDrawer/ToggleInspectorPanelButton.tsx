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
    return (
      <IconButton onClick={handleClick}>
        <ChevronRight size={16} />
      </IconButton>
    );
  }
  return (
    <IconButton onClick={handleClick}>
      <PanelRightOpen size={16} />
    </IconButton>
  );
}
