import React, { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { ToggleButton } from '@mui/material';
import RadioGroupInput from './RadioGroupInput';
export default function TextAlignInput({ label, defaultValue, onChange }) {
    const [value, setValue] = useState(defaultValue !== null && defaultValue !== void 0 ? defaultValue : 'left');
    return (React.createElement(RadioGroupInput, { label: label, defaultValue: value, onChange: (value) => {
            setValue(value);
            onChange(value);
        } },
        React.createElement(ToggleButton, { value: "left" },
            React.createElement(AlignLeft, { size: 16 })),
        React.createElement(ToggleButton, { value: "center" },
            React.createElement(AlignCenter, { size: 16 })),
        React.createElement(ToggleButton, { value: "right" },
            React.createElement(AlignRight, { size: 16 }))));
}
//# sourceMappingURL=TextAlignInput.js.map