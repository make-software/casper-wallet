import '@libs/i18n/i18n';

import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { ErrorBoundary } from '@src/libs/layout/error';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { AppRouter } from '@src/apps/onboarding/app-router';

import { onboardingAppInit } from '@background/redux/windowManagement/actions';
import { createMainStoreReplica, PopupState } from '@background/redux/utils';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

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
      <ThemeProvider theme={themeConfig}>
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
