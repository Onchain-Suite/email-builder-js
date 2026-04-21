import React from 'react';
import { useCurrentBlockId } from '../../editor/EditorBlock';
import { setDocument, setSelectedBlockId, useDocument } from '../../editor/EditorContext';
import EditorChildrenIds from '../helpers/EditorChildrenIds';
function getFontFamily(fontFamily) {
    const f = fontFamily !== null && fontFamily !== void 0 ? fontFamily : 'MODERN_SANS';
    switch (f) {
        case 'MODERN_SANS':
            return '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif';
        case 'BOOK_SANS':
            return 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif';
        case 'ORGANIC_SANS':
            return 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif';
        case 'GEOMETRIC_SANS':
            return 'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif';
        case 'HEAVY_SANS':
            return 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif';
        case 'ROUNDED_SANS':
            return 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif';
        case 'MODERN_SERIF':
            return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';
        case 'BOOK_SERIF':
            return '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif';
        case 'MONOSPACE':
            return '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace';
    }
}
export default function EmailLayoutEditor(props) {
    var _d, _e, _u, _10, _11;
    const childrenIds = (_d = props.childrenIds) !== null && _d !== void 0 ? _d : [];
    const document = useDocument();
    const currentBlockId = useCurrentBlockId();
    return (React.createElement("div", { onClick: () => {
            setSelectedBlockId(null);
        }, style: {
            backgroundColor: (_e = props.backdropColor) !== null && _e !== void 0 ? _e : '#F5F5F5',
            color: (_u = props.textColor) !== null && _u !== void 0 ? _u : '#262626',
            fontFamily: getFontFamily(props.fontFamily),
            fontSize: '16px',
            fontWeight: '400',
            letterSpacing: '0.15008px',
            lineHeight: '1.5',
            margin: '0',
            padding: '32px 0',
            width: '100%',
            minHeight: '100%',
        } },
        React.createElement("table", { align: "center", width: "100%", style: {
                margin: '0 auto',
                maxWidth: '600px',
                backgroundColor: (_10 = props.canvasColor) !== null && _10 !== void 0 ? _10 : '#FFFFFF',
                borderRadius: (_11 = props.borderRadius) !== null && _11 !== void 0 ? _11 : undefined,
                border: (() => {
                    const v = props.borderColor;
                    if (!v) {
                        return undefined;
                    }
                    return `1px solid ${v}`;
                })(),
            }, role: "presentation", cellSpacing: "0", cellPadding: "0", border: 0 },
            React.createElement("tbody", null,
                React.createElement("tr", { style: { width: '100%' } },
                    React.createElement("td", null,
                        React.createElement(EditorChildrenIds, { childrenIds: childrenIds, onChange: ({ block, blockId, childrenIds }) => {
                                setDocument({
                                    [blockId]: block,
                                    [currentBlockId]: {
                                        type: 'EmailLayout',
                                        data: Object.assign(Object.assign({}, document[currentBlockId].data), { childrenIds: childrenIds }),
                                    },
                                });
                                setSelectedBlockId(blockId);
                            } })))))));
}
//# sourceMappingURL=EmailLayoutEditor.js.map