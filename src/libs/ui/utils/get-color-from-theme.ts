import { DefaultTheme } from 'styled-components';

export type ContentColor =
  | 'inherit'
  | 'contentPrimary'
  | 'contentSecondary'
  | 'contentDisabled'
  | 'contentAction'
  | 'contentActionCritical'
  | 'contentOnFill'
  | 'contentWarning'
  | 'contentPositive'
  | 'contentGreenStatus'
  | 'contentLightBlue'
  | 'contentLightRed'
  | 'brandRed'
  | 'black';

type BackgroundColor =
  | 'inherit'
  | 'backgroundPrimary'
  | 'backgroundSecondary'
  | 'backgroundWarning'
  | 'backgroundCritical';

type FillColor =
  | 'inherit'
  | 'fillPrimary'
  | 'fillPrimaryHover'
  | 'fillPrimaryClick'
  | 'fillCritical'
  | 'fillCriticalHover'
  | 'fillCriticalClick'
  | 'fillPositive'
  | 'fillNeutral';
export type Color = ContentColor | BackgroundColor | FillColor;

export function getColorFromTheme(theme: DefaultTheme, color: Color) {
  return {
    inherit: 'inherit',
    backgroundPrimary: theme.color.backgroundPrimary,
    backgroundSecondary: theme.color.backgroundSecondary,
    backgroundWarning: theme.color.backgroundWarning,
    backgroundCritical: theme.color.backgroundCritical,
    contentPrimary: theme.color.contentPrimary,
    contentSecondary: theme.color.contentSecondary,
    contentDisabled: theme.color.contentDisabled,
    contentOnFill: theme.color.contentOnFill,
    contentAction: theme.color.contentAction,
    contentActionCritical: theme.color.contentActionCritical,
    contentPositive: theme.color.contentPositive,
    contentGreenStatus: theme.color.contentGreenStatus,
    contentWarning: theme.color.contentWarning,
    contentLightBlue: theme.color.contentLightBlue,
    contentLightRed: theme.color.contentLightRed,
    brandRed: theme.color.brandRed,
    fillPrimary: theme.color.fillPrimary,
    fillCritical: theme.color.fillCritical,
    fillPositive: theme.color.fillPositive,
    fillPrimaryHover: theme.color.fillPrimaryHover,
    fillPrimaryClick: theme.color.fillPrimaryClick,
    fillCriticalHover: theme.color.fillCriticalHover,
    fillCriticalClick: theme.color.fillCriticalClick,
    fillNeutral: theme.color.fillNeutral,
    black: theme.color.black
  }[color];
}
