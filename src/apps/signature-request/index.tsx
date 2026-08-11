import { QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
// skeleton styles
import 'react-loading-skeleton/dist/skeleton.css';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import { isSafariBuild, setCSPForSafari } from '@src/utils';

import { createMainStoreReplica } from '@background/redux/create-main-store-replica';
import { themeModeSettingChanged } from '@background/redux/settings/actions';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { PopupState } from '@background/redux/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { signWindowInit } from '@background/redux/windowManagement/actions';

import { useSystemThemeDetector } from '@hooks/use-system-theme-detector';

import '@libs/i18n/i18n';
import { ErrorBoundary } from '@libs/layout';
import { newQueryClient } from '@libs/services/query-client';
import {
  CspStyleSheetManager,
  GlobalStyle,
  darkTheme,
  lightTheme
} from '@libs/ui';
import { SagaErrorBanner } from '@libs/ui/components/saga-error-banner/saga-error-banner';

import { AppRouter } from './app-router';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  setCSPForSafari();

  const isSystemDarkTheme = useSystemThemeDetector();

  useSubscribeToRedux({
    windowInitAction: signWindowInit,
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
      <CspStyleSheetManager>
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
          <GlobalStyle />
          <ReduxProvider store={store}>
            <SagaErrorBanner />
            <QueryClientProvider client={newQueryClient}>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
            </QueryClientProvider>
          </ReduxProvider>
        </ThemeProvider>
      </CspStyleSheetManager>
    </Suspense>
  );
};

const container = document.querySelector('#app-container');
const root = createRoot(container!);

root.render(<Tree />);
