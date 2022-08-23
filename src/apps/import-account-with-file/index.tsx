import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalScrollbar } from 'mac-scrollbar';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { App } from '@import-account-with-file/app';

render(
  <Suspense fallback={null}>
    <ThemeProvider theme={themeConfig}>
      <GlobalStyle />
      <GlobalScrollbar />
      <App />
    </ThemeProvider>
  </Suspense>,
  document.querySelector('#import-account-with-file-app-container')
);
