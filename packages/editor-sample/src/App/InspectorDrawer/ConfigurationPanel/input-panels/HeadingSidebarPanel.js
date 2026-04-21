import React, { useState } from 'react';
import { ToggleButton } from '@mui/material';
import { HeadingPropsDefaults, HeadingPropsSchema } from '@usewaypoint/block-heading';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function HeadingSidebarPanel({ data, setData }) {
    var _d, _e, _u, _10;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = HeadingPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    return (React.createElement(BaseSidebarPanel, { title: "Heading block" },
        React.createElement(TextInput, { label: "Content", rows: 3, defaultValue: (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.text) !== null && _e !== void 0 ? _e : HeadingPropsDefaults.text, onChange: (text) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { text }) }));
            } }),
        React.createElement(RadioGroupInput, { label: "Level", defaultValue: (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.level) !== null && _10 !== void 0 ? _10 : HeadingPropsDefaults.level, onChange: (level) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { level }) }));
            } },
            React.createElement(ToggleButton, { value: "h1" }, "H1"),
            React.createElement(ToggleButton, { value: "h2" }, "H2"),
            React.createElement(ToggleButton, { value: "h3" }, "H3")),
        React.createElement(MultiStylePropertyPanel, { names: ['color', 'backgroundColor', 'fontFamily', 'fontWeight', 'textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=HeadingSidebarPanel.js.map