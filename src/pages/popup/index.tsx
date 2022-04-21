import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@src/libs/ui';

import { App } from '@src/app';

render(
  <Suspense fallback={null}>
    <ThemeProvider theme={themeConfig}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </Suspense>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
