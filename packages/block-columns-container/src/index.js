import React from 'react';
import { z } from 'zod';
const COLOR_SCHEMA = z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional();
const PADDING_SCHEMA = z
    .object({
    top: z.number(),
    bottom: z.number(),
    right: z.number(),
    left: z.number(),
})
    .optional()
    .nullable();
const FIXED_WIDTHS_SCHEMA = z
    .tuple([z.number().nullish(), z.number().nullish(), z.number().nullish()])
    .optional()
    .nullable();
const getPadding = (padding) => padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined;
export const ColumnsContainerPropsSchema = z.object({
    style: z
        .object({
        backgroundColor: COLOR_SCHEMA,
        padding: PADDING_SCHEMA,
    })
        .optional()
        .nullable(),
    props: z
        .object({
        fixedWidths: FIXED_WIDTHS_SCHEMA,
        columnsCount: z
            .union([z.literal(2), z.literal(3)])
            .optional()
            .nullable(),
        columnsGap: z.number().optional().nullable(),
        contentAlignment: z.enum(['top', 'middle', 'bottom']).optional().nullable(),
    })
        .optional()
        .nullable(),
});
const ColumnsContainerPropsDefaults = {
    columnsCount: 2,
    columnsGap: 0,
    contentAlignment: 'middle',
};
export function ColumnsContainer({ style, columns, props }) {
    var _d, _e, _u, _10;
    const wStyle = {
        backgroundColor: (_d = style === null || style === void 0 ? void 0 : style.backgroundColor) !== null && _d !== void 0 ? _d : undefined,
        padding: getPadding(style === null || style === void 0 ? void 0 : style.padding),
    };
    const blockProps = {
        columnsCount: (_e = props === null || props === void 0 ? void 0 : props.columnsCount) !== null && _e !== void 0 ? _e : ColumnsContainerPropsDefaults.columnsCount,
        columnsGap: (_u = props === null || props === void 0 ? void 0 : props.columnsGap) !== null && _u !== void 0 ? _u : ColumnsContainerPropsDefaults.columnsGap,
        contentAlignment: (_10 = props === null || props === void 0 ? void 0 : props.contentAlignment) !== null && _10 !== void 0 ? _10 : ColumnsContainerPropsDefaults.contentAlignment,
        fixedWidths: props === null || props === void 0 ? void 0 : props.fixedWidths,
    };
    return (React.createElement("div", { style: wStyle },
        React.createElement("table", { align: "center", width: "100%", cellPadding: "0", border: 0, style: { tableLayout: 'fixed', borderCollapse: 'collapse' } },
            React.createElement("tbody", { style: { width: '100%' } },
                React.createElement("tr", { style: { width: '100%' } },
                    React.createElement(TableCell, { index: 0, props: blockProps, columns: columns }),
                    React.createElement(TableCell, { index: 1, props: blockProps, columns: columns }),
                    React.createElement(TableCell, { index: 2, props: blockProps, columns: columns }))))));
}
function TableCell({ index, props, columns }) {
    var _d, _e, _u, _10, _11;
    const contentAlignment = (_d = props === null || props === void 0 ? void 0 : props.contentAlignment) !== null && _d !== void 0 ? _d : ColumnsContainerPropsDefaults.contentAlignment;
    const columnsCount = (_e = props === null || props === void 0 ? void 0 : props.columnsCount) !== null && _e !== void 0 ? _e : ColumnsContainerPropsDefaults.columnsCount;
    if (columnsCount === 2 && index === 2) {
        return null;
    }
    const style = {
        boxSizing: 'content-box',
        verticalAlign: contentAlignment,
        paddingLeft: getPaddingBefore(index, props),
        paddingRight: getPaddingAfter(index, props),
        width: (_10 = (_u = props.fixedWidths) === null || _u === void 0 ? void 0 : _u[index]) !== null && _10 !== void 0 ? _10 : undefined,
    };
    const children = (_11 = (columns && columns[index])) !== null && _11 !== void 0 ? _11 : null;
    return React.createElement("td", { style: style }, children);
}
function getPaddingBefore(index, { columnsGap, columnsCount }) {
    if (index === 0) {
        return 0;
    }
    if (columnsCount === 2) {
        return columnsGap / 2;
    }
    if (index === 1) {
        return columnsGap / 3;
    }
    return (2 * columnsGap) / 3;
}
function getPaddingAfter(index, { columnsGap, columnsCount }) {
    if (columnsCount === 2) {
        if (index === 0) {
            return columnsGap / 2;
        }
        return 0;
    }
    if (index === 0) {
        return (2 * columnsGap) / 3;
    }
    if (index === 1) {
        return columnsGap / 3;
    }
    return 0;
}
//# sourceMappingURL=index.js.map