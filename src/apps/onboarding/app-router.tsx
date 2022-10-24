import React, { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { SecretPhrase } from '@src/libs/crypto';
import { ErrorPath, TabErrorPage } from '@src/libs/layout/error';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/onboarding/router';

import { useSessionStorage } from '@src/apps/onboarding/hooks/use-session-storage';

import { UnlockWalletPage } from '@src/apps/onboarding/pages/unlock-wallet';
import { ResetWalletPage } from '@src/apps/onboarding/pages/reset-wallet';
import { WelcomePage } from '@src/apps/onboarding/pages/welcome';
import { CreateVaultPasswordPage } from '@src/apps/onboarding/pages/create-vault-password';
import { CreateSecretPhrasePage } from '@src/apps/onboarding/pages/create-secret-phrase';
import { RecoverFromSecretPhrasePage } from '@src/apps/onboarding/pages/recover-from-secret-phrase';
import { CreateSecretPhraseConfirmationPage } from '@src/apps/onboarding/pages/create-secret-phrase-confirmation';
import { WriteDownSecretPhrasePage } from '@src/apps/onboarding/pages/write-down-secret-phrase';
import { ConfirmSecretPhrasePage } from '@src/apps/onboarding/pages/confirm-secret-phrase';
import { ConfirmSecretPhraseSuccessPage } from '@src/apps/onboarding/pages/confirm-secret-phrase-success';
import { OnboardingSuccessPage } from '@src/apps/onboarding/pages/onboarding-success';

import { selectVaultDoesExist } from '@background/redux/vault/selectors';

export interface FormState {
  secretPhrase: SecretPhrase | null;
}

export type SetFormState = (name: keyof FormState, value: any) => void;

export function AppRouter() {
  const [onboardingFormState, setOnboardingFormState] = useState<FormState>({
    secretPhrase: null
  });

  const { loadIsLoggedIn, saveIsLoggedIn } = useSessionStorage();
  const isLoggedIn = loadIsLoggedIn();

  const setFormState: SetFormState = (name, value) =>
    setOnboardingFormState(prevOnboardingFormState => ({
      ...prevOnboardingFormState,
      [name]: value
    }));

  const doesVaultExists = useSelector(selectVaultDoesExist);

  if (doesVaultExists) {
    if (isLoggedIn) {
      return (
        <AuthorizedUserRoutes
          onboardingFormState={onboardingFormState}
          setFormState={setFormState}
        />
      );
    }

    return <UnauthorizedUserRoutes saveIsLoggedIn={saveIsLoggedIn} />;
  }

  return <NoVaultRoutes saveIsLoggedIn={saveIsLoggedIn} />;
}

type UnauthorizedRouterProps = {
  saveIsLoggedIn: (isLoggedInNextValue: boolean) => void;
};

function NoVaultRoutes({ saveIsLoggedIn }: UnauthorizedRouterProps) {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.Any} element={<WelcomePage />} />
        <Route
          path={RouterPath.CreateVaultPassword}
          element={<CreateVaultPasswordPage saveIsLoggedIn={saveIsLoggedIn} />}
        />
      </Routes>
    </HashRouter>
  );
}

function UnauthorizedUserRoutes({ saveIsLoggedIn }: UnauthorizedRouterProps) {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.Any}
          element={<UnlockWalletPage saveIsLoggedIn={saveIsLoggedIn} />}
        />
        <Route path={RouterPath.ResetWallet} element={<ResetWalletPage />} />
      </Routes>
    </HashRouter>
  );
}

type AuthorizedRouterProps = {
  onboardingFormState: FormState;
  setFormState: SetFormState;
};

function AuthorizedUserRoutes({
  setFormState,
  onboardingFormState
}: AuthorizedRouterProps) {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.Any}
          element={
            <CreateSecretPhraseConfirmationPage setFormState={setFormState} />
          }
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
          path={RouterPath.WriteDownSecretPhrase}
          element={
            <WriteDownSecretPhrasePage
              phrase={onboardingFormState.secretPhrase}
            />
          }
        />
        <Route
          path={RouterPath.ConfirmSecretPhrase}
          element={
            <ConfirmSecretPhrasePage
              phrase={onboardingFormState.secretPhrase}
            />
          }
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
          path={ErrorPath}
          element={
            <TabErrorPage
              createTypedLocation={useTypedLocation}
              createTypedNavigate={useTypedNavigate}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
