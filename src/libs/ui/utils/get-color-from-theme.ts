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
// can extend more color types later here if needed (like FillColor etc.) the utility below can be generic and can work with all of them
export type Color = ContentColor | BackgroundColor;

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
    brandRed: theme.color.brandRed
  }[color];
}
