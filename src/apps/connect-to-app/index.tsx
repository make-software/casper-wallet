import '@libs/i18n/i18n';

import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { AppRouter } from '@src/apps/connect-to-app/app-router';
import { GlobalStyle, lightTheme, darkTheme } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';

import {
  createMainStoreReplica,
  dispatchToMainStore,
  PopupState
} from '@src/background/redux/utils';
import { connectWindowInit } from '@src/background/redux/windowManagement/actions';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { useSystemThemeDetector } from '@src/hooks';
import { themeModeSettingChanged } from '@background/redux/settings/actions';
import { ThemeMode } from '@background/redux/settings/types';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

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
  if (themeMode === undefined) {
    dispatchToMainStore(themeModeSettingChanged(ThemeMode.SYSTEM));
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
