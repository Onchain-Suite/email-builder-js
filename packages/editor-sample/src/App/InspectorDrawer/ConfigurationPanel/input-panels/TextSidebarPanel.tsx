import React, { useRef, useState } from 'react';

import { Box, Stack, TextField } from '@mui/material';
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import VariableTagButton from './helpers/inputs/VariableTagPicker';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type TextSidebarPanelProps = {
  data: TextProps;
  setData: (v: TextProps) => void;
};

export default function TextSidebarPanel({ data, setData }: TextSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateData = (d: unknown) => {
    const res = TextPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const insertTagAtCursor = (tagValue: string) => {
    const input = inputRef.current;
    const currentText = data.props?.text ?? '';
    const start = input?.selectionStart ?? currentText.length;
    const end = input?.selectionEnd ?? currentText.length;
    const newText = currentText.substring(0, start) + tagValue + currentText.substring(end);
    updateData({ ...data, props: { ...data.props, text: newText } });
    setTimeout(() => {
      input?.focus();
      input?.setSelectionRange(start + tagValue.length, start + tagValue.length);
    }, 0);
  };

  return (
    <BaseSidebarPanel title="Text block">
      <Box>
        <Stack direction="row" justifyContent="flex-end" mb={1}>
          <VariableTagButton onInsert={insertTagAtCursor} />
        </Stack>
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
