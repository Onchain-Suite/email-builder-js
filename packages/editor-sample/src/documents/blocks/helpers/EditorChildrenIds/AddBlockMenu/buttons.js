import React from 'react';
import { UserRound, Crop, Heading, Minus, Code2, Image, Box, FileText, SquareMousePointer, Columns, } from 'lucide-react';
export const BUTTONS = [
    {
        label: 'Heading',
        icon: React.createElement(Heading, { size: 18 }),
        block: () => ({
            type: 'Heading',
            data: {
                props: { text: 'Hello friend' },
                style: {
                    padding: { top: 16, bottom: 16, left: 24, right: 24 },
                },
            },
        }),
    },
    {
        label: 'Text',
        icon: React.createElement(FileText, { size: 18 }),
        block: () => ({
            type: 'Text',
            data: {
                props: { text: 'My new text block' },
                style: {
                    padding: { top: 16, bottom: 16, left: 24, right: 24 },
                    fontWeight: 'normal',
                },
            },
        }),
    },
    {
        label: 'Button',
        icon: React.createElement(SquareMousePointer, { size: 18 }),
        block: () => ({
            type: 'Button',
            data: {
                props: {
                    text: 'Button',
                    url: 'https://www.usewaypoint.com',
                },
                style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
            },
        }),
    },
    {
        label: 'Image',
        icon: React.createElement(Image, { size: 18 }),
        block: () => ({
            type: 'Image',
            data: {
                props: {
                    url: 'https://assets.usewaypoint.com/sample-image.jpg',
                    alt: 'Sample product',
                    contentAlignment: 'middle',
                    linkHref: null,
                },
                style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
            },
        }),
    },
    {
        label: 'Avatar',
        icon: React.createElement(UserRound, { size: 18 }),
        block: () => ({
            type: 'Avatar',
            data: {
                props: {
                    imageUrl: 'https://ui-avatars.com/api/?size=128',
                    shape: 'circle',
                },
                style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
            },
        }),
    },
    {
        label: 'Divider',
        icon: React.createElement(Minus, { size: 18 }),
        block: () => ({
            type: 'Divider',
            data: {
                style: { padding: { top: 16, right: 0, bottom: 16, left: 0 } },
                props: {
                    lineColor: '#CCCCCC',
                },
            },
        }),
    },
    {
        label: 'Spacer',
        icon: React.createElement(Crop, { size: 18 }),
        block: () => ({
            type: 'Spacer',
            data: {},
        }),
    },
    {
        label: 'Html',
        icon: React.createElement(Code2, { size: 18 }),
        block: () => ({
            type: 'Html',
            data: {
                props: { contents: '<strong>Hello world</strong>' },
                style: {
                    fontSize: 16,
                    textAlign: null,
                    padding: { top: 16, bottom: 16, left: 24, right: 24 },
                },
            },
        }),
    },
    {
        label: 'Columns',
        icon: React.createElement(Columns, { size: 18 }),
        block: () => ({
            type: 'ColumnsContainer',
            data: {
                props: {
                    columnsGap: 16,
                    columnsCount: 3,
                    columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }],
                },
                style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
            },
        }),
    },
    {
        label: 'Container',
        icon: React.createElement(Box, { size: 18 }),
        block: () => ({
            type: 'Container',
            data: {
                style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
            },
        }),
    },
    // { label: 'ProgressBar', icon: <ProgressBarOutlined />, block: () => ({}) },
    // { label: 'LoopContainer', icon: <ViewListOutlined />, block: () => ({}) },
];
//# sourceMappingURL=buttons.js.map