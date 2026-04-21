import React, { useState } from 'react';
import { SpaceBarOutlined, VerticalAlignBottomOutlined, VerticalAlignCenterOutlined, VerticalAlignTopOutlined, } from '@mui/icons-material';
import { ToggleButton } from '@mui/material';
import ColumnsContainerPropsSchema from '../../../../documents/blocks/ColumnsContainer/ColumnsContainerPropsSchema';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColumnWidthsInput from './helpers/inputs/ColumnWidthsInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import SliderInput from './helpers/inputs/SliderInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
export default function ColumnsContainerPanel({ data, setData }) {
    var _d, _e, _u, _10, _11, _12;
    const [, setErrors] = useState(null);
    const updateData = (d) => {
        const res = ColumnsContainerPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    return (React.createElement(BaseSidebarPanel, { title: "Columns block" },
        React.createElement(RadioGroupInput, { label: "Number of columns", defaultValue: ((_d = data.props) === null || _d === void 0 ? void 0 : _d.columnsCount) === 2 ? '2' : '3', onChange: (v) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { columnsCount: v === '2' ? 2 : 3 }) }));
            } },
            React.createElement(ToggleButton, { value: "2" }, "2"),
            React.createElement(ToggleButton, { value: "3" }, "3")),
        React.createElement(ColumnWidthsInput, { defaultValue: (_e = data.props) === null || _e === void 0 ? void 0 : _e.fixedWidths, onChange: (fixedWidths) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { fixedWidths }) }));
            } }),
        React.createElement(SliderInput, { label: "Columns gap", iconLabel: React.createElement(SpaceBarOutlined, { sx: { color: 'text.secondary' } }), units: "px", step: 4, marks: true, min: 0, max: 80, defaultValue: (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.columnsGap) !== null && _10 !== void 0 ? _10 : 0, onChange: (columnsGap) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { columnsGap }) })) }),
        React.createElement(RadioGroupInput, { label: "Alignment", defaultValue: (_12 = (_11 = data.props) === null || _11 === void 0 ? void 0 : _11.contentAlignment) !== null && _12 !== void 0 ? _12 : 'middle', onChange: (contentAlignment) => {
                updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { contentAlignment }) }));
            } },
            React.createElement(ToggleButton, { value: "top" },
                React.createElement(VerticalAlignTopOutlined, { fontSize: "small" })),
            React.createElement(ToggleButton, { value: "middle" },
                React.createElement(VerticalAlignCenterOutlined, { fontSize: "small" })),
            React.createElement(ToggleButton, { value: "bottom" },
                React.createElement(VerticalAlignBottomOutlined, { fontSize: "small" }))),
        React.createElement(MultiStylePropertyPanel, { names: ['backgroundColor', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=ColumnsContainerSidebarPanel.js.map