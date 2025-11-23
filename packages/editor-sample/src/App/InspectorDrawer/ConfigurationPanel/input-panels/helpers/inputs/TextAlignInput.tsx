import React, { useState } from 'react';

import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { ToggleButton } from '@mui/material';

import RadioGroupInput from './RadioGroupInput';

type Props = {
  label: string;
  defaultValue: string | null;
  onChange: (value: string | null) => void;
};
export default function TextAlignInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue ?? 'left');

  return (
    <RadioGroupInput
      label={label}
      defaultValue={value}
      onChange={(value) => {
        setValue(value);
        onChange(value);
      }}
    >
      <ToggleButton value="left">
        <AlignLeft size={16} />
      </ToggleButton>
      <ToggleButton value="center">
        <AlignCenter size={16} />
      </ToggleButton>
      <ToggleButton value="right">
        <AlignRight size={16} />
      </ToggleButton>
    </RadioGroupInput>
  );
}
