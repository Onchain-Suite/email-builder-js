import React, { useRef, useState } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { HtmlProps, HtmlPropsSchema } from '@usewaypoint/block-html';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import CodeEditor from './helpers/inputs/CodeEditor';
import VariableTagButton from './helpers/inputs/VariableTagPicker';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type HtmlSidebarPanelProps = {
  data: HtmlProps;
  setData: (v: HtmlProps) => void;
};
export default function HtmlSidebarPanel({ data, setData }: HtmlSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            Content
          </Typography>
          <VariableTagButton onInsert={insertTagAtCursor} />
        </Stack>
        <CodeEditor
          ref={inputRef}
          value={data.props?.contents ?? ''}
          onChange={(contents) => updateData({ ...data, props: { ...data.props, contents } })}
          placeholder="<p>Your custom HTML…</p>"
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
