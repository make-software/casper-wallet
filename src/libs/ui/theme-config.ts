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
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F5F6F7',
    backgroundBlue: '#0A2EBF',
    backgroundGreen: '#2DDC88',

    borderPrimary: '#E8E9EC',

    fillWhite: '#FFFFFF',
    fillRed: '#CC000F',
    fillRedHover: '#B2000D',
    fillRedClick: '#99000B',
    fillBlue: '#0A2EBF',
    fillBlueHover: '#001C8C',
    fillBlueClick: '#001773',
    fillGreen: '#2DDC88',
    fillGreyPrimary: '#BCBDC1',
    fillGreySecondary: '#E8E9EC',
    fillGradientIn: {
      from: '#EFF0F2',
      to: '#F5F6F7'
    },
    fillGradientOut: {
      from: '#F3F4F5',
      to: '#EFF0F2'
    },

    contentPrimary: '#1A1919',
    contentSecondary: '#84868C',
    contentBlue: '#0A2EBF',
    contentOnFill: '#ffffff'
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
