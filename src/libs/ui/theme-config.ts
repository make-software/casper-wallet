import { withMedia } from './utils/match-media';
import { hexToRGBA } from './utils/hex-to-rgba';

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
      mono: '"JetBrains Mono", monospace'
    },
    fontWeight: {
      light: 200,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700
    }
  },
  borderRadius: {
    base: 6,
    eight: 8,
    ten: 10,
    twelve: 12,
    sixteen: 16,
    twenty: 20,
    eighty: 80,
    hundred: 100
  },
  padding: {
    1.2: '1.2rem',
    1.6: '1.6rem',
    2.4: '2.4rem',
    3.2: '3.2rem'
  }
};

export const lightTheme = {
  ...themeConfig,
  color: {
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F5F6F7',
    backgroundRed: {
      deg: '148deg',
      from: '#E93240 6.78%',
      to: '#C2000E 71.85%'
    },

    contentPrimary: '#1A1919',
    contentSecondary: '#84868C',
    contentDisabled: '#BCBDC1',
    contentAction: '#0A2EBF',
    contentActionCritical: '#CC000F',
    contentOnFill: '#FFFFFF',
    contentWarning: '#E0BB38',
    contentPositive: '#2DDC88',
    contentGreenStatus: '#77FFBE',
    contentLightBlue: '#7490FF',

    fillPrimary: '#0A2EBF',
    fillPrimaryHover: '#001C8C',
    fillPrimaryClick: '#001773',
    fillCritical: '#CC000F',
    fillCriticalHover: '#B2000D',
    fillCriticalClick: '#99000B',
    fillSecondary: {
      deg: '180deg',
      from: '#F5F5F7 0%',
      to: '#F0F0F2 100%'
    },
    fillSecondaryHover: {
      deg: '180deg',
      from: '#EFF0F2 0%',
      to: '#F5F6F7 100%'
    },
    fillNeutral: '#E8E9EC',
    fillPositive: '#2DDC88',

    borderPrimary: hexToRGBA('#1A1919', '0.12'),

    brandRed: '#FF0012',
    black: '#000000'
  },
  border: {
    separator: '0.5px solid #E8E9EC'
  },
  shadow: {
    contextMenu:
      '0 15px 50px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04)',
    tooltip: '0px 0px 10px 0px rgba(0, 0, 0, 0.08)'
  }
};

export const darkTheme = {
  ...themeConfig,
  color: {
    backgroundPrimary: '#262730',
    backgroundSecondary: '#18181F',
    backgroundRed: {
      deg: '148deg',
      from: '#B82832 6.78%',
      to: '#99000B 71.85%'
    },

    contentPrimary: '#FFFFFF',
    contentSecondary: '#A9AAAD',
    contentDisabled: '#84868C',
    contentAction: '#4D70FF',
    contentActionCritical: '#FF3342',
    contentOnFill: '#FFFFFF',
    contentWarning: '#FF9F0A',
    contentPositive: '#2DDC88',
    contentGreenStatus: '#77FFBE',
    contentLightBlue: '#7490FF',

    fillPrimary: '#153CD6',
    fillPrimaryHover: '#0929AC',
    fillPrimaryClick: '#07218A',
    fillCritical: '#C2000E',
    fillCriticalHover: '#B2000D',
    fillCriticalClick: '#99000B',
    fillSecondary: '#34363D',
    fillSecondaryHover: '#3D3F47',
    fillNeutral: '#3C3E47',
    fillPositive: '#2DDC88',

    borderPrimary: hexToRGBA('#FFF', '0.12'),

    brandRed: '#FF0012',
    black: '#000000'
  },
  border: {
    separator: '0.5px solid #3C3E47'
  },
  shadow: {
    contextMenu:
      '0px 15px 50px 0px rgba(0, 0, 0, 0.32), 0px 2px 10px 0px rgba(0, 0, 0, 0.12)',
    tooltip: '0px 0px 10px 0px rgba(0, 0, 0, 0.32)'
  }
};

export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;

declare module 'styled-components' {
  export interface DefaultTheme extends LightTheme, DarkTheme {}
}
