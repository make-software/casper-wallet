import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePage } from '@src/apps/onboarding/pages/welcome';
import { CreateVaultPasswordPage } from '@src/apps/onboarding/pages/create-vault-password';
import { CreateSecretPhrasePage } from '@src/apps/onboarding/pages/create-secret-phrase';
import { RecoverWalletFromSecretPhrasePage } from '@src/apps/onboarding/pages/recover-wallet-from-secret-phrase';
import { SecretPhraseSecurityNotesPage } from '@src/apps/onboarding/pages/secret-phrase-security-notes';
import { WriteSecretPhrasePage } from '@src/apps/onboarding/pages/write-secret-phrase';
import { ConfirmSecretPhrasePage } from '@src/apps/onboarding/pages/confirm-secret-phrase';
import { SecretPhraseConfirmedPage } from '@src/apps/onboarding/pages/secret-phrase-confirmed';
import { WalletCreatedPage } from '@src/apps/onboarding/pages/wallet-created';
import { ErrorPage } from '@src/apps/onboarding/pages/error';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.Welcome} element={<WelcomePage />} />
        <Route
          path={RouterPath.CreateVaultPassword}
          element={<CreateVaultPasswordPage />}
        />
        <Route
          path={RouterPath.CreateSecretPhrase}
          element={<CreateSecretPhrasePage />}
        />
        <Route
          path={RouterPath.RecoverWalletFromSecretPhrase}
          element={<RecoverWalletFromSecretPhrasePage />}
        />
        <Route
          path={RouterPath.SecretPhraseSecurityNotes}
          element={<SecretPhraseSecurityNotesPage />}
        />
        <Route
          path={RouterPath.WriteSecretPhrase}
          element={<WriteSecretPhrasePage />}
        />
        <Route
          path={RouterPath.ConfirmSecretPhrase}
          element={<ConfirmSecretPhrasePage />}
        />
        <Route
          path={RouterPath.SecretPhraseConfirmed}
          element={<SecretPhraseConfirmedPage />}
        />
        <Route
          path={RouterPath.WalletCreated}
          element={<WalletCreatedPage />}
        />
        <Route path={RouterPath.Error} element={<ErrorPage />} />
      </Routes>
    </HashRouter>
  );
}
