import React, { useRef, useState } from 'react';

import { Box, Stack, TextField, ToggleButton } from '@mui/material';
import { HeadingProps, HeadingPropsDefaults, HeadingPropsSchema } from '@usewaypoint/block-heading';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import VariableTagButton from './helpers/inputs/VariableTagPicker';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type HeadingSidebarPanelProps = {
  data: HeadingProps;
  setData: (v: HeadingProps) => void;
};
export default function HeadingSidebarPanel({ data, setData }: HeadingSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateData = (d: unknown) => {
    const res = HeadingPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const insertTagAtCursor = (tagValue: string) => {
    const input = inputRef.current;
    const currentText = data.props?.text ?? HeadingPropsDefaults.text;
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
    <BaseSidebarPanel title="Heading block">
      <Box>
        <Stack direction="row" justifyContent="flex-end" mb={1}>
          <VariableTagButton onInsert={insertTagAtCursor} />
        </Stack>
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={3}
          variant="outlined"
          value={data.props?.text ?? HeadingPropsDefaults.text}
          onChange={(e) => updateData({ ...data, props: { ...data.props, text: e.target.value } })}
          inputRef={inputRef}
        />
      </Box>
      <RadioGroupInput
        label="Level"
        defaultValue={data.props?.level ?? HeadingPropsDefaults.level}
        onChange={(level) => {
          updateData({ ...data, props: { ...data.props, level } });
        }}
      >
        <ToggleButton value="h1">H1</ToggleButton>
        <ToggleButton value="h2">H2</ToggleButton>
        <ToggleButton value="h3">H3</ToggleButton>
      </RadioGroupInput>
      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
