import React, { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePage } from '@src/apps/onboarding/pages/welcome';
import { CreateVaultPasswordPage } from '@src/apps/onboarding/pages/create-vault-password';
import { CreateSecretPhrasePage } from '@src/apps/onboarding/pages/create-secret-phrase';
import { RecoverFromSecretPhrasePage } from '@src/apps/onboarding/pages/recover-from-secret-phrase';
import { CreateSecretPhraseConfirmationPage } from '@src/apps/onboarding/pages/create-secret-phrase-confirmation';
import { WriteDownSecretPhrasePage } from '@src/apps/onboarding/pages/write-down-secret-phrase';
import { ConfirmSecretPhrasePage } from '@src/apps/onboarding/pages/confirm-secret-phrase';
import { ConfirmSecretPhraseSuccessPage } from '@src/apps/onboarding/pages/confirm-secret-phrase-success';
import { OnboardingSuccessPage } from '@src/apps/onboarding/pages/onboarding-success';
import { OnboardingErrorPage } from '@src/apps/onboarding/pages/onboarding-error';

interface FormState {
  [key: string]: string[] | null;
}

export type SetNameAndValueToFormState = (
  name: keyof FormState,
  value: string[] | null
) => void;

export function AppRouter() {
  const [formState, setFormState] = useState<FormState>({
    phrase: null
  });

  const setNameAndValueToFormState: SetNameAndValueToFormState = (
    name,
    value
  ) => setFormState(prevFormState => ({ ...prevFormState, [name]: value }));

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
          path={RouterPath.RecoverFromSecretPhrase}
          element={<RecoverFromSecretPhrasePage />}
        />
        <Route
          path={RouterPath.CreateSecretPhraseConfirmation}
          element={
            <CreateSecretPhraseConfirmationPage
              setNameAndValueToFormState={setNameAndValueToFormState}
            />
          }
        />
        <Route
          path={RouterPath.WriteDownSecretPhrase}
          element={<WriteDownSecretPhrasePage phrase={formState.phrase} />}
        />
        <Route
          path={RouterPath.ConfirmSecretPhrase}
          element={<ConfirmSecretPhrasePage phrase={formState.phrase} />}
        />
        <Route
          path={RouterPath.ConfirmSecretPhraseSuccess}
          element={<ConfirmSecretPhraseSuccessPage />}
        />
        <Route
          path={RouterPath.OnboardingSuccess}
          element={<OnboardingSuccessPage />}
        />
        <Route
          path={RouterPath.OnboardingError}
          element={<OnboardingErrorPage />}
        />
      </Routes>
    </HashRouter>
  );
}
