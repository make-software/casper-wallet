import { keyframes } from 'styled-components';
import { withMedia } from './utils/match-media';

const PAGE_MIN_WIDTH = 320;
const PAGE_MAX_WIDTH = 1176;

export const themeConfig = {
  minWidth: PAGE_MIN_WIDTH,
  maxWidth: PAGE_MAX_WIDTH,
  // do not use for now, let's see if we need it at all
  // media: MediaQueries,
  withMedia: withMedia,
  zIndex: {
    dropdown: 10,
    modal: 15,
    tooltip: 20
  },
  typography: {
    fontFamily: {
      primary: '"Inter", sans-serif',
      mono: '"JetBrains Mono", serif'
    },
    fontWeight: {
      // thin: 100,
      // extraLight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      extraBold: 800
      // black: 900,
    }
  },
  color: {
    /* Text related */
    text: '#1A1919',
    textPlaceholder: '#8F9398',
    textDisabled: '#BABCBF',
    navigationLink: '#C4C4C4',
    contentViolet: '#8B5BF1',

    /* Primary */
    red: '#E6332A',
    redShade10: '#D23028',
    redShade20: '#BD2E27',
    redTint6: '#FCF2F2',
    redTint12: '#FCE7E5',
    blue: '#0021A5',
    blueBanner: '#294ACC',
    blueBanner2: '#2A5DB2',
    blueShade20: '#051F89',
    blueShade30: '#081F7B',
    blueTint5: 'rgba(0, 33, 165, 0.05)',
    blueTint10: 'rgba(0, 33, 165, 0.1)',
    darkBlue: '#181D40',
    green: '#31DE91',
    lightBlue: '#536ED9',
    yellow: '#F1BF0B',
    fillSecondaryRedHover: 'rgba(230, 51, 42, 0.08)',

    /* Gray */
    white: '#FFFFFF',
    gray0: '#F5F6F7',
    gray1: '#F2F3F5',
    gray2: '#DFE1E4',
    gray3: '#D2D5D9',
    gray4: '#BABCBF',
    gray5: '#8F9398',
    black: '#1A1919'
  },
  boxShadow: {
    unset: 'unset',
    block: '0px 2px 4px rgba(143, 144, 152, 0.15)',
    tooltip: '0px 4px 8px rgba(143, 144, 152, 0.2)'
  },
  border: {
    base: '2px solid #1FBA59',
    separator: '1px solid #F2F3F5',
    tableRowSeparator: '1px solid #F2F3F5'
  },
  borderRadius: {
    base: 6
  },
  padding: {
    2: '2em'
  },
  animations: {
    fadeIn: keyframes`
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    `
  }
};

type ThemeConfig = typeof themeConfig;

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig {}
}
