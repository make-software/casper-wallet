import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useSessionStorage } from '@onboarding/hooks/use-session-storage';
import { ConfirmSecretPhrasePage } from '@onboarding/pages/confirm-secret-phrase';
import { ConfirmSecretPhraseSuccessPage } from '@onboarding/pages/confirm-secret-phrase-success';
import { CreateSecretPhrasePage } from '@onboarding/pages/create-secret-phrase';
import { CreateSecretPhraseConfirmationPage } from '@onboarding/pages/create-secret-phrase-confirmation';
import { CreateVaultPasswordPage } from '@onboarding/pages/create-vault-password';
import { OnboardingSuccessPage } from '@onboarding/pages/onboarding-success';
import { RecoverFromSecretPhrasePage } from '@onboarding/pages/recover-from-secret-phrase';
import { ResetWalletPage } from '@onboarding/pages/reset-wallet';
import { UnlockWalletPage } from '@onboarding/pages/unlock-wallet';
import { WelcomePage } from '@onboarding/pages/welcome';
import { WriteDownSecretPhrasePage } from '@onboarding/pages/write-down-secret-phrase';
import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@onboarding/router';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectEncryptionKeyHash } from '@background/redux/session/selectors';

import { SecretPhrase } from '@libs/crypto';
import { ErrorPath, TabErrorPage } from '@libs/layout';

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

  const keysDoesExist = useSelector(selectKeysDoesExist);
  const encryptionKeyHash = useSelector(selectEncryptionKeyHash);

  if (keysDoesExist && encryptionKeyHash != null) {
    if (isLoggedIn) {
      return (
        <AuthorizedUserRoutes
          onboardingFormState={onboardingFormState}
          setFormState={setFormState}
        />
      );
    } else {
      return <UnlockUserRoutes saveIsLoggedIn={saveIsLoggedIn} />;
    }
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

function UnlockUserRoutes({ saveIsLoggedIn }: UnauthorizedRouterProps) {
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
        <Route path={RouterPath.Any} element={<CreateSecretPhrasePage />} />
        <Route
          path={RouterPath.CreateSecretPhraseConfirmation}
          element={
            <CreateSecretPhraseConfirmationPage setFormState={setFormState} />
          }
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
