import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { darkTheme, GlobalStyle, lightTheme } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';

import { createMainStoreReplica, PopupState } from '@background/redux/utils';
import { popupWindowInit } from '@background/redux/windowManagement/actions';
import { selectDarkModeSetting } from '@background/redux/settings/selectors';

import { AppRouter } from './app-router';

// skeleton styles
import 'react-loading-skeleton/dist/skeleton.css';

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

  const isDarkMode = selectDarkModeSetting(store.getState());

  return (
    <Suspense fallback={null}>
      {/*// @ts-ignore*/}
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
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
