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
      regular: 400,
      medium: 500,
      semiBold: 600
    },
    header: {
      fontWeight: {
        bold: 700
      }
    }
  },
  color: {
    text: '#1A1919',
    textPlaceholder: '#909299',
    textDisabled: '#909299',
    navigationLink: '#0A2EBF',

    red: '#E6332A', // CSPR red color
    green: '#2DDC88',

    blue0: '#0A2EBF', // button
    blue1: '#0021A5',
    blue2: '#001C8C', // button:hover
    blue3: '#001773', // button:active
    blue4: '#001A80',

    red0: '#CC000F', // button
    red1: '#B2000D', // button:hover
    red2: '#99000B', // button:active

    white: '#FFFFFF',
    gray0: '#EFF0F2',
    gray1: '#F5F6F7', // general background-color
    gray2: '#E8E9EC', // border-line color
    gray3: '#BCBDC1',
    gray4: '#909299',
    black: '#1A1919',
    blackHole: '#000000'
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
    1.333: '1.333em',
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
