import React, { useState, useRef } from 'react';

import { Box, Button, Menu, MenuItem, TextField, ListSubheader, Tooltip, CircularProgress } from '@mui/material';
import { Braces } from 'lucide-react';
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import { useVariables } from '../../../../documents/editor/VariablesContext';

type TextSidebarPanelProps = {
  data: TextProps;
  setData: (v: TextProps) => void;
};

export default function TextSidebarPanel({ data, setData }: TextSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { variableGroups, loading } = useVariables();

  const updateData = (d: unknown) => {
    const res = TextPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const handleMergeTagClick = (tagValue: string) => {
    const input = inputRef.current;
    if (!input) return;

    const currentText = data.props?.text ?? '';
    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? currentText.length;

    const newText = currentText.substring(0, start) + tagValue + currentText.substring(end);
    
    updateData({ ...data, props: { ...data.props, text: newText } });
    setMenuAnchorEl(null);
    
    // Restore focus and cursor position (approximate)
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tagValue.length, start + tagValue.length);
    }, 0);
  };

  return (
    <BaseSidebarPanel title="Text block">
      <Box mb={2}>
        <Box display="flex" justifyContent="flex-start" alignItems="left" mb={3}>
          <Box /> {/* Spacer */}
          <Tooltip title="Insert Variable">
            <Button
              size="small"
              startIcon={loading ? <CircularProgress size={14} /> : <Braces size={14} />}
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
              disabled={loading}
              sx={{ textTransform: 'none', fontSize: '0.85rem' }}
            >
              Variable Tags
            </Button>
          </Tooltip>
        </Box>
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={5}
          variant="outlined"
          value={data.props?.text ?? ''}
          onChange={(e) => updateData({ ...data, props: { ...data.props, text: e.target.value } })}
          inputRef={inputRef}
        />
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{ sx: { maxHeight: 300, width: 200 } }}
        >
          {variableGroups.map((group) => [
            <ListSubheader key={group.id} sx={{ lineHeight: '32px', bgcolor: 'transparent', fontWeight: 'bold', color: 'text.primary' }}>
              {group.label}
            </ListSubheader>,
            ...group.items.map((item) => (
              <MenuItem 
                key={item.key} 
                onClick={() => handleMergeTagClick(item.key)}
                sx={{ fontSize: '0.85rem', py: 0.5, pl: 4 }}
              >
                {item.label}
              </MenuItem>
            )),
          ])}
        </Menu>
      </Box>

      <BooleanInput
        label="Markdown"
        defaultValue={data.props?.markdown ?? false}
        onChange={(markdown) => updateData({ ...data, props: { ...data.props, markdown } })}
      />

      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
