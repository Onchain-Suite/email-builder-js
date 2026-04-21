import React, { useState, useRef } from 'react';
import { Box, Button, Menu, MenuItem, TextField, ListSubheader, Tooltip, CircularProgress } from '@mui/material';
import { Braces } from 'lucide-react';
import { TextPropsSchema } from '@usewaypoint/block-text';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import { useVariables } from '../../../../documents/editor/VariablesContext';
export default function TextSidebarPanel({ data, setData }) {
    var _d, _e, _u, _10;
    const [, setErrors] = useState(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const inputRef = useRef(null);
    const { variableGroups, loading } = useVariables();
    const updateData = (d) => {
        const res = TextPropsSchema.safeParse(d);
        if (res.success) {
            setData(res.data);
            setErrors(null);
        }
        else {
            setErrors(res.error);
        }
    };
    const handleMergeTagClick = (tagValue) => {
        var _d, _e, _u, _10;
        const input = inputRef.current;
        if (!input)
            return;
        const currentText = (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.text) !== null && _e !== void 0 ? _e : '';
        const start = (_u = input.selectionStart) !== null && _u !== void 0 ? _u : currentText.length;
        const end = (_10 = input.selectionEnd) !== null && _10 !== void 0 ? _10 : currentText.length;
        const newText = currentText.substring(0, start) + tagValue + currentText.substring(end);
        updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { text: newText }) }));
        setMenuAnchorEl(null);
        // Restore focus and cursor position (approximate)
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + tagValue.length, start + tagValue.length);
        }, 0);
    };
    return (React.createElement(BaseSidebarPanel, { title: "Text block" },
        React.createElement(Box, { mb: 2 },
            React.createElement(Box, { display: "flex", justifyContent: "flex-start", alignItems: "left", mb: 3 },
                React.createElement(Box, null),
                " ",
                React.createElement(Tooltip, { title: "Insert Variable" },
                    React.createElement(Button, { size: "small", startIcon: loading ? React.createElement(CircularProgress, { size: 14 }) : React.createElement(Braces, { size: 14 }), onClick: (e) => setMenuAnchorEl(e.currentTarget), disabled: loading, sx: { textTransform: 'none', fontSize: '0.85rem' } }, "Variable Tags"))),
            React.createElement(TextField, { label: "Content", fullWidth: true, multiline: true, minRows: 5, variant: "outlined", value: (_e = (_d = data.props) === null || _d === void 0 ? void 0 : _d.text) !== null && _e !== void 0 ? _e : '', onChange: (e) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { text: e.target.value }) })), inputRef: inputRef }),
            React.createElement(Menu, { anchorEl: menuAnchorEl, open: Boolean(menuAnchorEl), onClose: () => setMenuAnchorEl(null), PaperProps: { sx: { maxHeight: 300, width: 200 } } }, variableGroups.map((group) => [
                React.createElement(ListSubheader, { key: group.id, sx: { lineHeight: '32px', bgcolor: 'transparent', fontWeight: 'bold', color: 'text.primary' } }, group.label),
                ...group.items.map((item) => (React.createElement(MenuItem, { key: item.key, onClick: () => handleMergeTagClick(item.key), sx: { fontSize: '0.85rem', py: 0.5, pl: 4 } }, item.label))),
            ]))),
        React.createElement(BooleanInput, { label: "Markdown", defaultValue: (_10 = (_u = data.props) === null || _u === void 0 ? void 0 : _u.markdown) !== null && _10 !== void 0 ? _10 : false, onChange: (markdown) => updateData(Object.assign(Object.assign({}, data), { props: Object.assign(Object.assign({}, data.props), { markdown }) })) }),
        React.createElement(MultiStylePropertyPanel, { names: ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding'], value: data.style, onChange: (style) => updateData(Object.assign(Object.assign({}, data), { style })) })));
}
//# sourceMappingURL=TextSidebarPanel.js.map