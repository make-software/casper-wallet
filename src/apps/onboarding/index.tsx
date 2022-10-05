import React, { Suspense } from 'react';

import { render } from 'react-dom';
import { ErrorBoundary } from '@popup/error-boundary';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, themeConfig } from '@libs/ui';

import { AppRouter } from '@src/apps/onboarding/app-router';

render(
  <Suspense fallback={null}>
    <ErrorBoundary>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle />
        <AppRouter />
      </ThemeProvider>
    </ErrorBoundary>
  </Suspense>,
  document.querySelector('#app-container')
);
