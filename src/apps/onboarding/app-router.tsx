import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { RouterPath } from '@onboarding/router';

import { WelcomePage } from '@onboarding/pages/welcome';
import { CreatePasswordPage } from '@onboarding/pages/create-password';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.Welcome} element={<WelcomePage />} />
        <Route
          path={RouterPath.CreatePassword}
          element={<CreatePasswordPage />}
        />
      </Routes>
    </HashRouter>
  );
}
