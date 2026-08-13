import { QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';
import { setCSPForSafari } from '@src/utils';

import { AppRouter } from '@onboarding/app-router';

import { createMainStoreReplica } from '@background/redux/create-main-store-replica';
import { PopupState } from '@background/redux/types';
import { onboardingAppInit } from '@background/redux/windowManagement/actions';

import '@libs/i18n/i18n';
import { ErrorBoundary } from '@libs/layout';
import { newQueryClient } from '@libs/services/query-client';
import { CspStyleSheetManager, GlobalStyle, lightTheme } from '@libs/ui';
import { SagaErrorBanner } from '@libs/ui/components/saga-error-banner/saga-error-banner';

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
      <CspStyleSheetManager>
        <ThemeProvider theme={lightTheme}>
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
