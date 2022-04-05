import store from 'store';

import { light } from './light';
import { dark } from './dark';

import { themeKey } from '../constants';
import { Theme } from '../types';

export function getCurrentTheme(): Theme {
  const theme = store.get(themeKey);

  if (!theme) {
    const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;

    if (isDark) {
      store.set(themeKey, 'dark');
      // TODO: Implement dark theme and remove cast
      return dark as Theme;
    } else {
      store.set(themeKey, 'light');
      return light;
    }
  }

  return theme === 'dark' ? (dark as Theme) : light;
}

export const theme = {
  ...getCurrentTheme()
};
