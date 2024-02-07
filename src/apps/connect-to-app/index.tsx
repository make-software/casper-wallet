import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import { isSafariBuild, setCSPForSafari } from '@src/utils';

import { AppRouter } from '@connect-to-app/app-router';

import { createMainStoreReplica } from '@background/redux/get-main-store';
import { themeModeSettingChanged } from '@background/redux/settings/actions';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { PopupState } from '@background/redux/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { connectWindowInit } from '@background/redux/windowManagement/actions';

import { useSystemThemeDetector } from '@hooks/use-system-theme-detector';

import '@libs/i18n/i18n';
import { ErrorBoundary } from '@libs/layout';
import { GlobalStyle, darkTheme, lightTheme } from '@libs/ui';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  setCSPForSafari();

  const isSystemDarkTheme = useSystemThemeDetector();

  useSubscribeToRedux({
    windowInitAction: connectWindowInit,
    setPopupState: setState
  });

  if (state == null) {
    return null;
  }

  const store = createMainStoreReplica(state);

  const themeMode = selectThemeModeSetting(store.getState());

  // Set theme mode to system if it is no present in the store
  if (themeMode === undefined && !isSafariBuild) {
    dispatchToMainStore(themeModeSettingChanged(ThemeMode.SYSTEM));
  } else if (themeMode === undefined && isSafariBuild) {
    dispatchToMainStore(themeModeSettingChanged(ThemeMode.LIGHT));
  }

  const isDarkMode =
    themeMode === ThemeMode.SYSTEM
      ? isSystemDarkTheme
      : themeMode === ThemeMode.DARK;

  return (
    <Suspense fallback={null}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <GlobalStyle />
        <ReduxProvider store={store}>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </ReduxProvider>
      </ThemeProvider>
    </Suspense>
  );
};

render(<Tree />, document.querySelector('#app-container'));
