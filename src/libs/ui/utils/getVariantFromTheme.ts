import { DefaultTheme } from 'styled-components';
import { ContentVariation } from '@src/libs/ui';

export function getContentVariationFromTheme(
  theme: DefaultTheme,
  variant: ContentVariation
) {
  return {
    inherit: 'inherit',
    contentPrimary: theme.color.contentPrimary,
    contentSecondary: theme.color.contentSecondary,
    contentTertiary: theme.color.contentTertiary,
    contentOnFill: theme.color.contentOnFill,
    contentBlue: theme.color.contentBlue,
    contentRed: theme.color.contentRed,
    contentGreen: theme.color.contentGreen,
    contentGreenOnFill: theme.color.contentGreenOnFill
  }[variant];
}
