import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@src/libs/ui';

import { App } from '@src/app';

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <App />
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
