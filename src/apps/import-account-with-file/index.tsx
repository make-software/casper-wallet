import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { ErrorBoundary } from '@popup/error-boundary';
import { AppRouter } from './app-router';

render(
  <Suspense fallback={null}>
    <ErrorBoundary>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle />
        <AppRouter />
      </ThemeProvider>
    </ErrorBoundary>
  </Suspense>,
  document.querySelector('#import-account-with-file-app-container')
);
