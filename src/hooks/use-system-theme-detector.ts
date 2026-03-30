import { useEffect, useState } from 'react';

import { systemColorSchemeChanged } from '@background/redux/settings/actions';
import { dispatchToMainStore } from '@background/redux/utils';

export const useSystemThemeDetector = () => {
  const getCurrentTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());

  const mqListener = (e: MediaQueryListEvent) => {
    setIsDarkTheme(e.matches);
  };

  useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

    darkThemeMq.addEventListener('change', mqListener);

    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, []);

  useEffect(() => {
    dispatchToMainStore(
      systemColorSchemeChanged(isDarkTheme ? 'dark' : 'light')
    );
  }, [isDarkTheme]);

  return isDarkTheme;
};
