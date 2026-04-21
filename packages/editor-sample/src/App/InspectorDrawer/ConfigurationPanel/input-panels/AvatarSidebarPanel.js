import React, { useState } from 'react';
import { AspectRatioOutlined } from '@mui/icons-material';
import { ToggleButton } from '@mui/material';
import { AvatarPropsDefaults, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import SliderInput from './helpers/inputs/SliderInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function AvatarSidebarPanel({ data, setData }) {
    var _d, _e, _u, _10, _11, _12, _13, _14;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = AvatarPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    const size = (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.size) !== null && _e !== void 0 ? _e : AvatarPropsDefaults.size;
    const imageUrl = (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.imageUrl) !== null && _10 !== void 0 ? _10 : AvatarPropsDefaults.imageUrl;
    const alt = (_12 = (_11 = data.props) === null || _11 === void 0 ? void 0 : _11.alt) !== null && _12 !== void 0 ? _12 : AvatarPropsDefaults.alt;
    const shape = (_14 = (_13 = data.props) === null || _13 === void 0 ? void 0 : _13.shape) !== null && _14 !== void 0 ? _14 : AvatarPropsDefaults.shape;
    return (React.createElement(BaseSidebarPanel, { title: "Avatar block" },
        React.createElement(SliderInput, { label: "Size", iconLabel: React.createElement(AspectRatioOutlined, { sx: { color: 'text.secondary' } }), units: "px", step: 3, min: 32, max: 256, defaultValue: size, onChange: (size) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { size }) }));
            } }),
        React.createElement(RadioGroupInput, { label: "Shape", defaultValue: shape, onChange: (shape) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { shape }) }));
            } },
            React.createElement(ToggleButton, { value: "circle" }, "Circle"),
            React.createElement(ToggleButton, { value: "square" }, "Square"),
            React.createElement(ToggleButton, { value: "rounded" }, "Rounded")),
        React.createElement(TextInput, { label: "Image URL", defaultValue: imageUrl, onChange: (imageUrl) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { imageUrl }) }));
            } }),
        React.createElement(TextInput, { label: "Alt text", defaultValue: alt, onChange: (alt) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { alt }) }));
            } }),
        React.createElement(MultiStylePropertyPanel, { names: ['textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=AvatarSidebarPanel.js.map