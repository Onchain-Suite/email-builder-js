import React, { useState } from 'react';
import { HtmlPropsSchema } from '@usewaypoint/block-html';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function HtmlSidebarPanel({ data, setData }) {
    var _d, _e;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = HtmlPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    return (React.createElement(BaseSidebarPanel, { title: "Html block" },
        React.createElement(TextInput, { label: "Content", rows: 5, defaultValue: (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.contents) !== null && _e !== void 0 ? _e : '', onChange: (contents) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { contents }) })) }),
        React.createElement(MultiStylePropertyPanel, { names: ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=HtmlSidebarPanel.js.map