import 'mac-scrollbar/dist/mac-scrollbar.css';

import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';

import { createMainStoreReplica, PopupState } from '@background/redux/utils';
import { popupWindowInit } from '@background/redux/windowManagement/actions';

import { AppRouter } from './app-router';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  useSubscribeToRedux({
    windowInitAction: popupWindowInit,
    setPopupState: setState
  });

  if (state == null) {
    return null;
  }

  const store = createMainStoreReplica(state);

  return (
    <Suspense fallback={null}>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle />
        <ReduxProvider store={store}>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </ReduxProvider>
      </ThemeProvider>
    </Suspense>
  );
};

render(<Tree />, document.querySelector('#app-container'));
