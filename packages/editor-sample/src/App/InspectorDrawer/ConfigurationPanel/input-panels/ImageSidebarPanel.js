import React, { useState } from 'react';
import { VerticalAlignBottomOutlined, VerticalAlignCenterOutlined, VerticalAlignTopOutlined, } from '@mui/icons-material';
import { Stack, ToggleButton } from '@mui/material';
import { ImagePropsSchema } from '@usewaypoint/block-image';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextDimensionInput from './helpers/inputs/TextDimensionInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function ImageSidebarPanel({ data, setData }) {
    var _d, _e, _u, _10, _11, _12, _13, _14, _15, _16;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = ImagePropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    return (React.createElement(BaseSidebarPanel, { title: "Image block" },
        React.createElement(TextInput, { label: "Source URL", defaultValue: (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.url) !== null && _e !== void 0 ? _e : '', onChange: (v) => {
                const url = v.trim().length === 0 ? null : v.trim();
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { url }) }));
            } }),
        React.createElement(TextInput, { label: "Alt text", defaultValue: (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.alt) !== null && _10 !== void 0 ? _10 : '', onChange: (alt) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { alt }) })) }),
        React.createElement(TextInput, { label: "Click through URL", defaultValue: (_12 = (_11 = data.props) === null || _11 === void 0 ? void 0 : _11.linkHref) !== null && _12 !== void 0 ? _12 : '', onChange: (v) => {
                const linkHref = v.trim().length === 0 ? null : v.trim();
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { linkHref }) }));
            } }),
        React.createElement(Stack, { direction: "row", spacing: 2 },
            React.createElement(TextDimensionInput, { label: "Width", defaultValue: (_13 = data.props) === null || _13 === void 0 ? void 0 : _13.width, onChange: (width) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { width }) })) }),
            React.createElement(TextDimensionInput, { label: "Height", defaultValue: (_14 = data.props) === null || _14 === void 0 ? void 0 : _14.height, onChange: (height) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { height }) })) })),
        React.createElement(RadioGroupInput, { label: "Alignment", defaultValue: (_16 = (_15 = data.props) === null || _15 === void 0 ? void 0 : _15.contentAlignment) !== null && _16 !== void 0 ? _16 : 'middle', onChange: (contentAlignment) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { contentAlignment }) })) },
            React.createElement(ToggleButton, { value: "top" },
                React.createElement(VerticalAlignTopOutlined, { fontSize: "small" })),
            React.createElement(ToggleButton, { value: "middle" },
                React.createElement(VerticalAlignCenterOutlined, { fontSize: "small" })),
            React.createElement(ToggleButton, { value: "bottom" },
                React.createElement(VerticalAlignBottomOutlined, { fontSize: "small" }))),
        React.createElement(MultiStylePropertyPanel, { names: ['backgroundColor', 'textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=ImageSidebarPanel.js.map