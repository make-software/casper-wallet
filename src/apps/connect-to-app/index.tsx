import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { RouterPath } from '@src/apps/connect-to-app/router';

import { ConnectToAppLayout } from './layout';

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.ConnectToApp}
          element={<ConnectToAppLayout Content={<div>Connect to App</div>} />}
        />
      </Routes>
    </HashRouter>
  </ThemeProvider>,
  document.querySelector('#connect-to-app-app-container')
);
