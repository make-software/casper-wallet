import store from 'store';

import { light } from './light';
import { dark } from './dark';

import { themeKey } from '../constants';
// import { Theme } from '../types';

export function getCurrentTheme() {
  const theme = store.get(themeKey);

  if (!theme) {
    const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;

    if (isDark) {
      store.set(themeKey, 'dark');
      // TODO: Implement dark theme and remove cast
      return dark;
    } else {
      store.set(themeKey, 'light');
      return light;
    }
  }

  return theme === 'dark' ? dark : light;
}

export const theme = {
  ...getCurrentTheme()
};
