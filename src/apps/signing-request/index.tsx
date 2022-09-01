import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalScrollbar } from 'mac-scrollbar';

import { GlobalStyle, themeConfig } from '@libs/ui';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { App } from './app';

render(
  <Suspense fallback={false}>
    <ThemeProvider theme={themeConfig}>
      <GlobalStyle />
      <GlobalScrollbar />
      <App />
    </ThemeProvider>
  </Suspense>,
  document.querySelector('#signing-request-app-container')
);
