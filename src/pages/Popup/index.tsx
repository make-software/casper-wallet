import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { CreateVault } from '@src/pages/CreateVault';

import { themeConfig } from '@src/libs/ui/theme-config';
import { GlobalStyle } from '@src/styles/globalStyle';

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <CreateVault />
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
