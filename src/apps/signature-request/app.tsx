import React from 'react';

import { LayoutWindow, PopupHeader } from '@libs/layout';

import { SignatureRequestPage } from './pages/signature-request';
import { HashRouter, Route, Routes } from 'react-router-dom';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={'*'}
          element={
            <LayoutWindow
              Header={<PopupHeader />}
              Content={<SignatureRequestPage />}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
