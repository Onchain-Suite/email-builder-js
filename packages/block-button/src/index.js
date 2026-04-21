import React from 'react';
import { z } from 'zod';
const FONT_FAMILY_SCHEMA = z
    .enum([
    'MODERN_SANS',
    'BOOK_SANS',
    'ORGANIC_SANS',
    'GEOMETRIC_SANS',
    'HEAVY_SANS',
    'ROUNDED_SANS',
    'MODERN_SERIF',
    'BOOK_SERIF',
    'MONOSPACE',
])
    .nullable()
    .optional();
function getFontFamily(fontFamily) {
    switch (fontFamily) {
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
    return undefined;
}
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
const getPadding = (padding) => padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined;
export const ButtonPropsSchema = z.object({
    style: z
        .object({
        backgroundColor: COLOR_SCHEMA,
        fontSize: z.number().min(0).optional().nullable(),
        fontFamily: FONT_FAMILY_SCHEMA,
        fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
        textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
        padding: PADDING_SCHEMA,
    })
        .optional()
        .nullable(),
    props: z
        .object({
        buttonBackgroundColor: COLOR_SCHEMA,
        buttonStyle: z.enum(['rectangle', 'pill', 'rounded']).optional().nullable(),
        buttonTextColor: COLOR_SCHEMA,
        fullWidth: z.boolean().optional().nullable(),
        size: z.enum(['x-small', 'small', 'large', 'medium']).optional().nullable(),
        text: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
    })
        .optional()
        .nullable(),
});
function getRoundedCorners(props) {
    var _d;
    const buttonStyle = (_d = props === null || props === void 0 ? void 0 : props.buttonStyle) !== null && _d !== void 0 ? _d : ButtonPropsDefaults.buttonStyle;
    switch (buttonStyle) {
        case 'rectangle':
            return undefined;
        case 'pill':
            return 64;
        case 'rounded':
        default:
            return 4;
    }
}
function getButtonSizePadding(props) {
    var _d;
    const size = (_d = props === null || props === void 0 ? void 0 : props.size) !== null && _d !== void 0 ? _d : ButtonPropsDefaults.size;
    switch (size) {
        case 'x-small':
            return [4, 8];
        case 'small':
            return [8, 12];
        case 'large':
            return [16, 32];
        case 'medium':
        default:
            return [12, 20];
    }
}
export const ButtonPropsDefaults = {
    text: '',
    url: '',
    fullWidth: false,
    size: 'medium',
    buttonStyle: 'rounded',
    buttonTextColor: '#FFFFFF',
    buttonBackgroundColor: '#999999',
};
export function Button({ style, props }) {
    var _d, _e, _u, _10, _11, _12, _13, _14, _15;
    const text = (_d = props === null || props === void 0 ? void 0 : props.text) !== null && _d !== void 0 ? _d : ButtonPropsDefaults.text;
    const url = (_e = props === null || props === void 0 ? void 0 : props.url) !== null && _e !== void 0 ? _e : ButtonPropsDefaults.url;
    const fullWidth = (_u = props === null || props === void 0 ? void 0 : props.fullWidth) !== null && _u !== void 0 ? _u : ButtonPropsDefaults.fullWidth;
    const buttonTextColor = (_10 = props === null || props === void 0 ? void 0 : props.buttonTextColor) !== null && _10 !== void 0 ? _10 : ButtonPropsDefaults.buttonTextColor;
    const buttonBackgroundColor = (_11 = props === null || props === void 0 ? void 0 : props.buttonBackgroundColor) !== null && _11 !== void 0 ? _11 : ButtonPropsDefaults.buttonBackgroundColor;
    const padding = getButtonSizePadding(props);
    const textRaise = (padding[1] * 2 * 3) / 4;
    const wrapperStyle = {
        backgroundColor: (_12 = style === null || style === void 0 ? void 0 : style.backgroundColor) !== null && _12 !== void 0 ? _12 : undefined,
        textAlign: (_13 = style === null || style === void 0 ? void 0 : style.textAlign) !== null && _13 !== void 0 ? _13 : undefined,
        padding: getPadding(style === null || style === void 0 ? void 0 : style.padding),
    };
    const linkStyle = {
        color: buttonTextColor,
        fontSize: (_14 = style === null || style === void 0 ? void 0 : style.fontSize) !== null && _14 !== void 0 ? _14 : 16,
        fontFamily: getFontFamily(style === null || style === void 0 ? void 0 : style.fontFamily),
        fontWeight: (_15 = style === null || style === void 0 ? void 0 : style.fontWeight) !== null && _15 !== void 0 ? _15 : 'bold',
        backgroundColor: buttonBackgroundColor,
        borderRadius: getRoundedCorners(props),
        display: fullWidth ? 'block' : 'inline-block',
        padding: `${padding[0]}px ${padding[1]}px`,
        textDecoration: 'none',
    };
    return (React.createElement("div", { style: wrapperStyle },
        React.createElement("a", { href: url, style: linkStyle, target: "_blank" },
            React.createElement("span", { dangerouslySetInnerHTML: {
                    __html: `<!--[if mso]><i style="letter-spacing: ${padding[1]}px;mso-font-width:-100%;mso-text-raise:${textRaise}" hidden>&nbsp;</i><![endif]-->`,
                } }),
            React.createElement("span", null, text),
            React.createElement("span", { dangerouslySetInnerHTML: {
                    __html: `<!--[if mso]><i style="letter-spacing: ${padding[1]}px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]-->`,
                } }))));
}
//# sourceMappingURL=index.js.map