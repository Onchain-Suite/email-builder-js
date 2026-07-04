import React, { useRef, useState } from 'react';

import { Box, Stack, TextField } from '@mui/material';
import { HtmlProps, HtmlPropsSchema } from '@usewaypoint/block-html';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import VariableTagButton from './helpers/inputs/VariableTagPicker';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type HtmlSidebarPanelProps = {
  data: HtmlProps;
  setData: (v: HtmlProps) => void;
};
export default function HtmlSidebarPanel({ data, setData }: HtmlSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateData = (d: unknown) => {
    const res = HtmlPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const insertTagAtCursor = (tagValue: string) => {
    const input = inputRef.current;
    const currentContents = data.props?.contents ?? '';
    const start = input?.selectionStart ?? currentContents.length;
    const end = input?.selectionEnd ?? currentContents.length;
    const newContents = currentContents.substring(0, start) + tagValue + currentContents.substring(end);
    updateData({ ...data, props: { ...data.props, contents: newContents } });
    setTimeout(() => {
      input?.focus();
      input?.setSelectionRange(start + tagValue.length, start + tagValue.length);
    }, 0);
  };

  return (
    <BaseSidebarPanel title="Html block">
      <Box>
        <Stack direction="row" justifyContent="flex-end" mb={1}>
          <VariableTagButton onInsert={insertTagAtCursor} />
        </Stack>
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={8}
          maxRows={24}
          variant="outlined"
          value={data.props?.contents ?? ''}
          onChange={(e) => updateData({ ...data, props: { ...data.props, contents: e.target.value } })}
          inputRef={inputRef}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }}
        />
      </Box>
      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontSize', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
