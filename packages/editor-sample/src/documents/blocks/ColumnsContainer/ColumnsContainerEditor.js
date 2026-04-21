var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import React from 'react';
import { ColumnsContainer as BaseColumnsContainer } from '@usewaypoint/block-columns-container';
import { useCurrentBlockId } from '../../editor/EditorBlock';
import { setDocument, setSelectedBlockId } from '../../editor/EditorContext';
import EditorChildrenIds from '../helpers/EditorChildrenIds';
import ColumnsContainerPropsSchema from './ColumnsContainerPropsSchema';
const EMPTY_COLUMNS = [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }];
export default function ColumnsContainerEditor({ style, props }) {
    var _d, _e, _u;
    const currentBlockId = useCurrentBlockId();
    const _10 = props !== null && props !== void 0 ? props : {}, { columns } = _10, restProps = __rest(_10, ["columns"]);
    const columnsValue = columns !== null && columns !== void 0 ? columns : EMPTY_COLUMNS;
    const updateColumn = (columnIndex, { block, blockId, childrenIds }) => {
        const nColumns = [...columnsValue];
        nColumns[columnIndex] = { childrenIds };
        setDocument({
            [blockId]: block,
            [currentBlockId]: {
                type: 'ColumnsContainer',
                data: ColumnsContainerPropsSchema.parse({
                    style,
                    props: Object.assign(Object.assign({}, restProps), { columns: nColumns }),
                }),
            },
        });
        setSelectedBlockId(blockId);
    };
    return (React.createElement(BaseColumnsContainer, { props: restProps, style: style, columns: [
            React.createElement(EditorChildrenIds, { childrenIds: (_d = columns === null || columns === void 0 ? void 0 : columns[0]) === null || _d === void 0 ? void 0 : _d.childrenIds, onChange: (change) => updateColumn(0, change) }),
            React.createElement(EditorChildrenIds, { childrenIds: (_e = columns === null || columns === void 0 ? void 0 : columns[1]) === null || _e === void 0 ? void 0 : _e.childrenIds, onChange: (change) => updateColumn(1, change) }),
            React.createElement(EditorChildrenIds, { childrenIds: (_u = columns === null || columns === void 0 ? void 0 : columns[2]) === null || _u === void 0 ? void 0 : _u.childrenIds, onChange: (change) => updateColumn(2, change) }),
        ] }));
}
//# sourceMappingURL=ColumnsContainerEditor.js.map