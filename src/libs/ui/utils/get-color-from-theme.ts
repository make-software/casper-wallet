import { DefaultTheme } from 'styled-components';

export type ContentColor =
  | 'inherit'
  | 'contentPrimary'
  | 'contentSecondary'
  | 'contentTertiary'
  | 'contentOnFill'
  | 'contentBlue'
  | 'contentRed'
  | 'contentGreen'
  | 'contentGreenOnFill'
  | 'contentLightBlue'
  | 'contentYellow'
  | 'brandRed';

export type BackgroundColor =
  | 'inherit'
  | 'backgroundPrimary'
  | 'backgroundSecondary'
  | 'backgroundBlue'
  | 'backgroundRed'
  | 'backgroundLightGreen'
  | 'backgroundLightBlue'
  | 'backgroundLightRed';

export type FillColor =
  | 'inherit'
  | 'fillBlue'
  | 'fillRed'
  | 'fillGreen'
  | 'fillBlueHover'
  | 'fillBlueClick'
  | 'fillRedHover'
  | 'fillRedClick'
  | 'fillWhite'
  | 'fillSecondary'
  | 'fillTertiary';
// can extend more color types later here if needed (like FillColor etc.) the utility below can be generic and can work with all of them
export type Color = ContentColor | BackgroundColor | FillColor;

export function getColorFromTheme(theme: DefaultTheme, color: Color) {
  return {
    inherit: 'inherit',
    backgroundPrimary: theme.color.backgroundPrimary,
    backgroundSecondary: theme.color.backgroundSecondary,
    backgroundBlue: theme.color.backgroundBlue,
    backgroundRed: theme.color.backgroundRed,
    backgroundLightGreen: theme.color.backgroundLightGreen,
    backgroundLightBlue: theme.color.backgroundLightBlue,
    backgroundLightRed: theme.color.backgroundLightRed,
    contentPrimary: theme.color.contentPrimary,
    contentSecondary: theme.color.contentSecondary,
    contentTertiary: theme.color.contentTertiary,
    contentOnFill: theme.color.contentOnFill,
    contentBlue: theme.color.contentBlue,
    contentRed: theme.color.contentRed,
    contentGreen: theme.color.contentGreen,
    contentGreenOnFill: theme.color.contentGreenOnFill,
    contentYellow: theme.color.contentYellow,
    contentLightBlue: theme.color.contentLightBlue,
    brandRed: theme.color.brandRed,
    fillBlue: theme.color.fillBlue,
    fillRed: theme.color.fillRed,
    fillGreen: theme.color.fillGreen,
    fillBlueHover: theme.color.fillBlueHover,
    fillBlueClick: theme.color.fillBlueClick,
    fillRedHover: theme.color.fillRedHover,
    fillRedClick: theme.color.fillRedClick,
    fillWhite: theme.color.fillWhite,
    fillSecondary: theme.color.fillSecondary,
    fillTertiary: theme.color.fillTertiary
  }[color];
}
