import React from 'react';

import { BellRing, PencilLine, Eye } from 'lucide-react';
import { Tab, Tabs, Tooltip } from '@mui/material';

import { setSelectedMainTab, useSelectedMainTab } from '../../documents/editor/EditorContext';

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab();
  const handleChange = (_: unknown, v: unknown) => {
    switch (v) {
      case 'preview':
      case 'editor':
      case 'push':
        setSelectedMainTab(v);
        return;
      default:
        setSelectedMainTab('editor');
    }
  };

  return (
    <Tabs value={selectedMainTab} onChange={handleChange}>
      <Tab
        value="editor"
        label={
          <Tooltip title="Edit">
            <PencilLine size={16} />
          </Tooltip>
        }
      />
      <Tab
        value="preview"
        label={
          <Tooltip title="Preview">
            <Eye size={16} />
          </Tooltip>
        }
      />
      <Tab
        value="push"
        label={
          <Tooltip title="In-app push notification">
            <BellRing size={16} />
          </Tooltip>
        }
      />
    </Tabs>
  );
}
