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
  border: {
    separator: '0.5px solid #E8E9EC'
  },
  borderRadius: {
    base: 6
  },
  padding: {
    1.6: '1.6rem'
  }
};

type ThemeConfig = typeof themeConfig;

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig {}
}
