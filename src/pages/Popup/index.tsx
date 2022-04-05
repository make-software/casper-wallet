import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { Popup } from '@src/shared/components/Popup';

import { theme } from '@src/styles/theme';
import { GlobalStyle } from '@src/styles/globalStyle';

render(
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <Popup />
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
