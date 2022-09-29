import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { RouterPath } from '@onboarding/router';

import { WelcomePage } from '@onboarding/pages/welcome';
import { CreatePasswordPage } from '@onboarding/pages/create-password';
import { CreateSecretPhrasePage } from '@onboarding/pages/create-secret-phrase';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.Welcome} element={<WelcomePage />} />
        <Route
          path={RouterPath.CreatePassword}
          element={<CreatePasswordPage />}
        />
        <Route
          path={RouterPath.CreateSecretPhrase}
          element={<CreateSecretPhrasePage />}
        />
      </Routes>
    </HashRouter>
  );
}
