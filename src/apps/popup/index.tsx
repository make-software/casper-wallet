import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { darkTheme, GlobalStyle, lightTheme } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import {
  createMainStoreReplica,
  dispatchToMainStore,
  PopupState
} from '@background/redux/utils';
import { popupWindowInit } from '@background/redux/windowManagement/actions';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { useSystemThemeDetector } from '@src/hooks';
import { themeModeSettingChanged } from '@background/redux/settings/actions';
import { isSafariBuild } from '@src/utils';

import { AppRouter } from './app-router';

// skeleton styles
import 'react-loading-skeleton/dist/skeleton.css';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  const isSystemDarkTheme = useSystemThemeDetector();

  useSubscribeToRedux({
    windowInitAction: popupWindowInit,
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
