import { useSelector } from 'react-redux';

import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';

import { useSystemThemeDetector } from '@hooks/use-system-theme-detector';

export const useIsDarkMode = () => {
  const themeMode = useSelector(selectThemeModeSetting);

  const isSystemDarkTheme = useSystemThemeDetector();

  return themeMode === ThemeMode.SYSTEM
    ? isSystemDarkTheme
    : themeMode === ThemeMode.DARK;
};
