import {createTheme} from "@mui/material";

// La paleta sale del resaltado de sintaxis de un editor: la UI guarda código,
// así que cada estado usa el color de un tipo de token.
export const tokens = {
    ink: '#1D2433',
    inkMuted: '#5B6475',
    background: '#EEF1F6',
    surface: '#FFFFFF',
    border: '#D9DEE7',
    keyword: '#4338CA',
    string: '#0F766E',
    number: '#B45309',
    error: '#BE123C',
} as const

// Los mismos tokens, aclarados para leerse sobre la barra oscura
export const syntax = {
    keyword: '#A5B4FC',
    string: '#5EEAD4',
    punctuation: '#CBD5E1',
    caret: '#E2E8F0',
} as const

export const fonts = {
    sans: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
} as const

export const theme = createTheme({
    palette: {
        primary: {main: tokens.keyword},
        success: {main: tokens.string},
        warning: {main: tokens.number},
        error: {main: tokens.error},
        text: {primary: tokens.ink, secondary: tokens.inkMuted},
        background: {default: tokens.background, paper: tokens.surface},
        divider: tokens.border,
    },
    shape: {borderRadius: 8},
    typography: {
        fontFamily: fonts.sans,
        h3: {fontWeight: 600, letterSpacing: '-0.02em'},
        button: {textTransform: 'none', fontWeight: 600},
    },
    components: {
        MuiButton: {defaultProps: {disableElevation: true}},
        MuiAppBar: {styleOverrides: {root: {backgroundColor: tokens.ink}}},
    },
})
