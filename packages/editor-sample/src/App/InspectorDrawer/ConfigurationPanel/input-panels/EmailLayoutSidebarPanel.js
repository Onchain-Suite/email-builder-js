import React, { useState } from 'react';
import { RoundedCornerOutlined } from '@mui/icons-material';
import EmailLayoutPropsSchema from '../../../../documents/blocks/EmailLayout/EmailLayoutPropsSchema';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColorInput, { NullableColorInput } from './helpers/inputs/ColorInput';
import { NullableFontFamily } from './helpers/inputs/FontFamily';
import SliderInput from './helpers/inputs/SliderInput';
export default function EmailLayoutSidebarFields({ data, setData }) {
    var _d, _e, _u, _10, _11;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = EmailLayoutPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    return (React.createElement(BaseSidebarPanel, { title: "Global" },
        React.createElement(ColorInput, { label: "Backdrop color", defaultValue: (_d = data.backdropColor) !== null && _d !== void 0 ? _d : '#F5F5F5', onChange: (backdropColor) => updateData(Object.assign(Object.assign({}, data), { backdropColor })) }),
        React.createElement(ColorInput, { label: "Canvas color", defaultValue: (_e = data.canvasColor) !== null && _e !== void 0 ? _e : '#FFFFFF', onChange: (canvasColor) => updateData(Object.assign(Object.assign({}, data), { canvasColor })) }),
        React.createElement(NullableColorInput, { label: "Canvas border color", defaultValue: (_u = data.borderColor) !== null && _u !== void 0 ? _u : null, onChange: (borderColor) => updateData(Object.assign(Object.assign({}, data), { borderColor })) }),
        React.createElement(SliderInput, { iconLabel: React.createElement(RoundedCornerOutlined, null), units: "px", step: 4, marks: true, min: 0, max: 48, label: "Canvas border radius", defaultValue: (_10 = data.borderRadius) !== null && _10 !== void 0 ? _10 : 0, onChange: (borderRadius) => updateData(Object.assign(Object.assign({}, data), { borderRadius })) }),
        React.createElement(NullableFontFamily, { label: "Font family", defaultValue: "MODERN_SANS", onChange: (fontFamily) => updateData(Object.assign(Object.assign({}, data), { fontFamily })) }),
        React.createElement(ColorInput, { label: "Text color", defaultValue: (_11 = data.textColor) !== null && _11 !== void 0 ? _11 : '#262626', onChange: (textColor) => updateData(Object.assign(Object.assign({}, data), { textColor })) })));
}
//# sourceMappingURL=EmailLayoutSidebarPanel.js.map