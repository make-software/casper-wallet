import React from 'react';

import { SignatureRequestPage } from './pages/signature-request';
import { HashRouter, Route, Routes } from 'react-router-dom';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<SignatureRequestPage />} />
      </Routes>
    </HashRouter>
  );
}
