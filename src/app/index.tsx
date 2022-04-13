import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { CreateVault } from '@src/pages/create-vault';

import { GlobalStyle } from '@src/libs/ui/global-style';
import { themeConfig } from '@src/libs/ui/theme-config';

import { Layout } from '@src/layout';

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <Layout>
      {/* TODO: Implement router */}
      <CreateVault />
    </Layout>
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
