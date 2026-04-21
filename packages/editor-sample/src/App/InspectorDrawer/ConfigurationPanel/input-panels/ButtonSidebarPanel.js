import React, { useState } from 'react';
import { ToggleButton } from '@mui/material';
import { ButtonPropsDefaults, ButtonPropsSchema } from '@usewaypoint/block-button';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColorInput from './helpers/inputs/ColorInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function ButtonSidebarPanel({ data, setData }) {
    var _d, _e, _u, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = ButtonPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    const text = (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.text) !== null && _e !== void 0 ? _e : ButtonPropsDefaults.text;
    const url = (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.url) !== null && _10 !== void 0 ? _10 : ButtonPropsDefaults.url;
    const fullWidth = (_12 = (_11 = data.props) === null || _11 === void 0 ? void 0 : _11.fullWidth) !== null && _12 !== void 0 ? _12 : ButtonPropsDefaults.fullWidth;
    const size = (_14 = (_13 = data.props) === null || _13 === void 0 ? void 0 : _13.size) !== null && _14 !== void 0 ? _14 : ButtonPropsDefaults.size;
    const buttonStyle = (_16 = (_15 = data.props) === null || _15 === void 0 ? void 0 : _15.buttonStyle) !== null && _16 !== void 0 ? _16 : ButtonPropsDefaults.buttonStyle;
    const buttonTextColor = (_18 = (_17 = data.props) === null || _17 === void 0 ? void 0 : _17.buttonTextColor) !== null && _18 !== void 0 ? _18 : ButtonPropsDefaults.buttonTextColor;
    const buttonBackgroundColor = (_20 = (_19 = data.props) === null || _19 === void 0 ? void 0 : _19.buttonBackgroundColor) !== null && _20 !== void 0 ? _20 : ButtonPropsDefaults.buttonBackgroundColor;
    return (React.createElement(BaseSidebarPanel, { title: "Button block" },
        React.createElement(TextInput, { label: "Text", defaultValue: text, onChange: (text) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { text }) })) }),
        React.createElement(TextInput, { label: "Url", defaultValue: url, onChange: (url) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { url }) })) }),
        React.createElement(RadioGroupInput, { label: "Width", defaultValue: fullWidth ? 'FULL_WIDTH' : 'AUTO', onChange: (v) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { fullWidth: v === 'FULL_WIDTH' }) })) },
            React.createElement(ToggleButton, { value: "FULL_WIDTH" }, "Full"),
            React.createElement(ToggleButton, { value: "AUTO" }, "Auto")),
        React.createElement(RadioGroupInput, { label: "Size", defaultValue: size, onChange: (size) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { size }) })) },
            React.createElement(ToggleButton, { value: "x-small" }, "Xs"),
            React.createElement(ToggleButton, { value: "small" }, "Sm"),
            React.createElement(ToggleButton, { value: "medium" }, "Md"),
            React.createElement(ToggleButton, { value: "large" }, "Lg")),
        React.createElement(RadioGroupInput, { label: "Style", defaultValue: buttonStyle, onChange: (buttonStyle) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { buttonStyle }) })) },
            React.createElement(ToggleButton, { value: "rectangle" }, "Rectangle"),
            React.createElement(ToggleButton, { value: "rounded" }, "Rounded"),
            React.createElement(ToggleButton, { value: "pill" }, "Pill")),
        React.createElement(ColorInput, { label: "Text color", defaultValue: buttonTextColor, onChange: (buttonTextColor) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { buttonTextColor }) })) }),
        React.createElement(ColorInput, { label: "Button color", defaultValue: buttonBackgroundColor, onChange: (buttonBackgroundColor) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { buttonBackgroundColor }) })) }),
        React.createElement(MultiStylePropertyPanel, { names: ['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=ButtonSidebarPanel.js.map