import { alpha, createTheme, darken, lighten } from '@mui/material/styles';

/**
 * Onchain Suite email builder — light editor chrome.
 * Soft cloud-grey backdrop, crisp white panels, a single azure accent for
 * all interactive states, and the email canvas presented as a bright sheet
 * with a soft floating shadow.
 */
const BRAND_NAVY = '#212443';
const BRAND_BLUE = '#0079CC';
const BRAND_GREEN = '#1F8466';
const BRAND_RED = '#E81212';
const BRAND_YELLOW = '#F6DC9F';
const BRAND_PURPLE = '#6C0E7C';
const BRAND_BROWN = '#CC996C';

const ACCENT_BLUE = BRAND_BLUE;

const CLOUD = '#F3F5F9'; // app backdrop
const SURFACE = '#FFFFFF'; // panels / paper
const LINE = 'rgba(17, 24, 39, 0.09)';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';

const STANDARD_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, Instrument Sans, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
const MONOSPACE_FONT_FAMILY =
  'ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace';

const BASE_THEME = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: CLOUD,
      paper: SURFACE,
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
    },
    divider: LINE,
  },
  typography: {
    fontFamily: 'Instrument Sans, ' + STANDARD_FONT_FAMILY,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 300,
      leavingScreen: 250,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

const THEME = createTheme(BASE_THEME, {
  palette: {
    brand: {
      navy: BRAND_NAVY,
      blue: BRAND_BLUE,
      red: BRAND_RED,
      green: BRAND_GREEN,
      yellow: BRAND_YELLOW,
      purple: BRAND_PURPLE,
      brown: BRAND_BROWN,
    },
    success: {
      main: BRAND_GREEN,
      light: lighten(BRAND_GREEN, 0.15),
      dark: darken(BRAND_GREEN, 0.15),
    },
    error: {
      main: BRAND_RED,
      light: lighten(BRAND_RED, 0.15),
      dark: darken(BRAND_RED, 0.15),
    },
    cadet: {
      100: '#F9FAFB',
      200: '#F2F5F7',
      300: '#DCE4EA',
      400: '#A8BBCA',
      500: '#6A8BA4',
    },
    highlight: {
      100: lighten(BRAND_YELLOW, 0.8),
      200: lighten(BRAND_YELLOW, 0.6),
      300: lighten(BRAND_YELLOW, 0.4),
      400: lighten(BRAND_YELLOW, 0.2),
      500: BRAND_YELLOW,
    },
    info: {
      main: ACCENT_BLUE,
    },
    primary: {
      main: ACCENT_BLUE,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        address {
          font-style: normal;
        }
        fieldset {
          border: none;
          padding: 0;
        }
        pre {
          font-family: ${MONOSPACE_FONT_FAMILY};
          white-space: pre-wrap;
          font-size: 12px;
          background: ${SURFACE};
          color: ${TEXT_PRIMARY};
          border-radius: 12px;
        }
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(17, 24, 39, 0.18);
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(17, 24, 39, 0.32);
          border: 2px solid transparent;
          background-clip: content-box;
        }
        body {
          background: radial-gradient(1400px at 15% -5%, ${alpha(BRAND_BLUE, 0.07)} 0, transparent 60%),
                      radial-gradient(1000px at 90% 0%, ${alpha(BRAND_PURPLE, 0.05)} 0, transparent 55%),
                      ${CLOUD};
          transition: background 300ms ${BASE_THEME.transitions.easing.easeOut};
        }
      `,
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: BASE_THEME.typography.pxToRem(14),
        },
        action: {
          paddingTop: 0,
          marginRight: 0,
        },
        filledSuccess: {
          backgroundColor: BRAND_GREEN,
          color: '#FFFFFF',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: BASE_THEME.typography.fontWeightMedium,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
      },
      styleOverrides: {
        paper: {
          border: `1px solid ${LINE}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: BASE_THEME.spacing(1),
          paddingBottom: BASE_THEME.spacing(2),
        },
      },
    },
    MuiDialogTitle: {
      defaultProps: {
        variant: 'h4',
      },
      styleOverrides: {
        root: {
          paddingTop: BASE_THEME.spacing(3),
          paddingBottom: BASE_THEME.spacing(1),
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${LINE}`,
          marginTop: BASE_THEME.spacing(2.5),
          padding: `${BASE_THEME.spacing(1.5)} ${BASE_THEME.spacing(3)}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          ...BASE_THEME.typography.body2,
          borderColor: LINE,
        },
        head: {
          ...BASE_THEME.typography.overline,
          fontWeight: BASE_THEME.typography.fontWeightMedium,
          letterSpacing: '0.075em',
          color: TEXT_SECONDARY,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontSize: BASE_THEME.typography.pxToRem(14),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        sizeSmall: {
          borderRadius: BASE_THEME.spacing(0.5),
          fontSize: 12,
        },
        iconSmall: {
          fontSize: 14,
          marginLeft: BASE_THEME.spacing(1),
        },
        colorSecondary: {
          borderColor: 'rgba(17,24,39,0.2)',
          color: TEXT_SECONDARY,
        },
        label: {
          fontWeight: BASE_THEME.typography.fontWeightMedium,
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        PaperProps: {
          elevation: 0,
        },
      },
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE,
          transition: `transform ${BASE_THEME.transitions.duration.enteringScreen}ms ${BASE_THEME.transitions.easing.easeOut}, opacity ${BASE_THEME.transitions.duration.enteringScreen}ms ${BASE_THEME.transitions.easing.easeOut}`,
          willChange: 'transform, opacity',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${LINE}`,
          boxShadow: '0px 12px 32px rgba(33, 36, 67, 0.12), 0px 2px 8px rgba(33, 36, 67, 0.08)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: BASE_THEME.typography.pxToRem(12),
          backgroundColor: alpha(TEXT_PRIMARY, 0.92),
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 1,
          color: ACCENT_BLUE,
        },
        track: {
          height: 1,
          border: 'none',
        },
        rail: {
          height: 1,
          backgroundColor: 'rgba(17,24,39,0.25)',
        },
        mark: {
          backgroundColor: 'rgba(17,24,39,0.25)',
        },
        markActive: {
          height: 0,
        },
        thumb: {
          height: 16,
          width: 16,
          cursor: 'col-resize',
          '&:hover, &.Mui-active, &.Mui-focusVisible': {
            boxShadow: `0 0 0 4px ${alpha(ACCENT_BLUE, 0.2)}`,
          },
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        square: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: true,
        focusRipple: true,
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        edgeStart: {
          marginLeft: BASE_THEME.spacing(-1),
        },
        colorSecondary: {
          color: TEXT_SECONDARY,
        },
        root: {
          borderRadius: 10,
          transition: `background-color ${BASE_THEME.transitions.duration.short}ms ${BASE_THEME.transitions.easing.easeOut}`,
          '&:hover': {
            backgroundColor: 'rgba(17,24,39,0.06)',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        textPrimary: {
          color: TEXT_PRIMARY,
        },
        textSecondary: {
          color: TEXT_SECONDARY,
        },
        outlinedPrimary: {
          borderColor: 'rgba(17,24,39,0.18)',
          color: TEXT_PRIMARY,
          '&:hover, &:active, &:focus': {
            borderColor: 'rgba(17,24,39,0.38)',
            backgroundColor: 'rgba(17,24,39,0.03)',
            color: TEXT_PRIMARY,
          },
        },
        containedPrimary: {
          fontWeight: 600,
        },
        containedSecondary: {
          backgroundColor: SURFACE,
          border: `1px solid rgba(17,24,39,0.18)`,
          color: TEXT_PRIMARY,
          '&:hover, &:active, &:focus': {
            backgroundColor: SURFACE,
            borderColor: 'rgba(17,24,39,0.38)',
            color: TEXT_PRIMARY,
          },
        },
        root: {
          transition: `all ${BASE_THEME.transitions.duration.short}ms ${BASE_THEME.transitions.easing.easeOut}`,
          borderRadius: 10,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          paddingLeft: BASE_THEME.spacing(1.5),
          paddingRight: BASE_THEME.spacing(1.5),
          borderRadius: 10,
          border: `1px solid ${LINE}`,
          color: TEXT_SECONDARY,
          '&.Mui-selected': {
            backgroundColor: alpha(ACCENT_BLUE, 0.1),
            color: ACCENT_BLUE,
            '&:hover': {
              backgroundColor: alpha(ACCENT_BLUE, 0.16),
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled, .Mui-error):before': {
            borderBottom: `1px solid rgba(17,24,39,0.24)`,
          },
          '&:hover:not(.Mui-disabled, .Mui-error):before': {
            borderBottom: `1px solid rgba(17,24,39,0.44) !important`,
          },
          '&:after': {
            borderBottom: `1px solid ${ACCENT_BLUE} !important`,
          },
          '&.MuiOutlinedInput-root:not(.Mui-error)': {
            '& fieldset': {
              borderColor: 'rgba(17,24,39,0.18)',
              transition: 'border-color 0.2s',
            },
          },
          '&.MuiOutlinedInput-root:not(.Mui-disabled, .Mui-error)': {
            '&:hover fieldset': {
              borderColor: 'rgba(17,24,39,0.32)',
            },
            '&.Mui-focused fieldset': {
              borderColor: ACCENT_BLUE,
              borderWidth: 1,
            },
          },
        },
        input: {
          fontSize: BASE_THEME.typography.pxToRem(14),
          '&.Mui-disabled': {
            WebkitTextFillColor: 'inherit',
            color: TEXT_SECONDARY,
          },
        },
        inputSizeSmall: {},
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          '& legend': {
            fontSize: '0.85em',
            maxWidth: '100%',
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          '& .MuiTypography-root': {
            fontSize: BASE_THEME.typography.pxToRem(14),
            color: TEXT_SECONDARY,
          },
        },
      },
    },
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
      styleOverrides: {
        shrink: {
          transform: 'scale(0.85)',
          fontWeight: BASE_THEME.typography.fontWeightMedium,
          '&.Mui-focused': {
            color: ACCENT_BLUE,
          },
          '&.MuiInputLabel-standard': {
            transform: 'translate(0, -4px) scale(0.85)',
            color: TEXT_SECONDARY,
          },
          '&.MuiInputLabel-outlined': {
            transform: 'translate(15px, -8px) scale(0.85)',
          },
        },
      },
    },
    MuiTabs: {
      defaultProps: {
        variant: 'scrollable',
      },
      styleOverrides: {
        indicator: {
          height: 2,
          backgroundColor: ACCENT_BLUE,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: BASE_THEME.spacing(2),
          paddingLeft: BASE_THEME.spacing(1.5),
          paddingRight: BASE_THEME.spacing(1.5),
          fontSize: BASE_THEME.typography.pxToRem(14),
          fontFamily: BASE_THEME.typography.fontFamily,
          lineHeight: 1.5,
          fontWeight: BASE_THEME.typography.fontWeightMedium,
          color: TEXT_SECONDARY,
          transition: `color ${BASE_THEME.transitions.duration.short}ms ${BASE_THEME.transitions.easing.easeOut}`,
          '&.Mui-selected': {
            color: TEXT_PRIMARY,
          },
          '&:hover': {
            color: TEXT_PRIMARY,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${LINE}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          fontSize: BASE_THEME.typography.pxToRem(18),
          fontWeight: BASE_THEME.typography.fontWeightMedium,
        },
      },
    },
  },
  typography: {
    fontFamily: BASE_THEME.typography.fontFamily,
    h1: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(40),
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      fontWeight: 600,
    },
    h2: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(32),
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      fontWeight: 600,
    },
    h3: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(24),
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    h4: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(20),
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    h5: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(18),
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    h6: {
      fontFamily: BASE_THEME.typography.fontFamily,
      fontSize: BASE_THEME.typography.pxToRem(16),
      lineHeight: 1.5,
      letterSpacing: '-0.005em',
      fontWeight: 600,
    },
    body1: {
      fontSize: BASE_THEME.typography.pxToRem(14),
      fontWeight: 400,
      lineHeight: 1.7,
    },
    body2: {
      fontSize: BASE_THEME.typography.pxToRem(12),
      fontWeight: 400,
      lineHeight: 1.7,
    },
    overline: {
      fontWeight: BASE_THEME.typography.fontWeightMedium,
      letterSpacing: '0.05em',
    },
    button: {
      textTransform: 'none',
      fontWeight: BASE_THEME.typography.fontWeightMedium,
      lineHeight: 1.5,
    },
    caption: {
      letterSpacing: 0,
      lineHeight: 1.5,
    },
  },
  shadows: [
    'none',
    '0px 4px 15px rgba(33, 36, 67, 0.04), 0px 0px 2px rgba(33, 36, 67, 0.04), 0px 0px 1px rgba(33, 36, 67, 0.04)',
    '0px 10px 20px rgba(33, 36, 67, 0.04), 0px 2px 6px rgba(33, 36, 67, 0.04), 0px 0px 1px rgba(33, 36, 67, 0.04)',
    '0px 16px 24px rgba(33, 36, 67, 0.05), 0px 2px 6px rgba(33, 36, 67, 0.05), 0px 0px 1px rgba(33, 36, 67, 0.05)',
    '0px 24px 32px rgba(33, 36, 67, 0.06), 0px 16px 24px rgba(33, 36, 67, 0.06), 0px 4px 8px rgba(33, 36, 67, 0.06)',
    ...Array(20).fill('none'),
  ],
});

export default THEME;
