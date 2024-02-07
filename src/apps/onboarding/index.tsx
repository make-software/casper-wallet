import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import { setCSPForSafari } from '@src/utils';

import { AppRouter } from '@onboarding/app-router';

import { createMainStoreReplica } from '@background/redux/get-main-store';
import { PopupState } from '@background/redux/types';
import { onboardingAppInit } from '@background/redux/windowManagement/actions';

import '@libs/i18n/i18n';
import { ErrorBoundary } from '@libs/layout';
import { GlobalStyle, lightTheme } from '@libs/ui';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  setCSPForSafari();

  useSubscribeToRedux({
    windowInitAction: onboardingAppInit,
    setPopupState: setState
  });

  if (state == null) {
    return null;
  }

  const store = createMainStoreReplica(state);

  return (
    <Suspense fallback={null}>
      <ThemeProvider theme={lightTheme}>
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
