import React from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import {
  FormState,
  SetFormState,
  useOnboardingFormState
} from '@onboarding/hooks/use-onboarding-form-state';
import { useSessionStorage } from '@onboarding/hooks/use-session-storage';
import { ConfirmSecretPhrasePage } from '@onboarding/pages/confirm-secret-phrase';
import { ConfirmSecretPhraseSuccessPage } from '@onboarding/pages/confirm-secret-phrase-success';
import { CreateSecretPhrasePage } from '@onboarding/pages/create-secret-phrase';
import { CreateSecretPhraseConfirmationPage } from '@onboarding/pages/create-secret-phrase-confirmation';
import { CreateVaultPasswordPage } from '@onboarding/pages/create-vault-password';
import { OnboardingSuccessPage } from '@onboarding/pages/onboarding-success';
import { RecoverFromSecretPhrasePage } from '@onboarding/pages/recover-from-secret-phrase';
import { ResetWalletPage } from '@onboarding/pages/reset-wallet';
import { SelectAccountsToRecoverPage } from '@onboarding/pages/select-accounts-to-recover';
import { UnlockWalletPage } from '@onboarding/pages/unlock-wallet';
import { VaultLockedPage } from '@onboarding/pages/vault-locked';
import { WelcomePage } from '@onboarding/pages/welcome';
import { WriteDownSecretPhrasePage } from '@onboarding/pages/write-down-secret-phrase';
import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@onboarding/router';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectEncryptionKeyDoesExist } from '@background/redux/session/selectors';

import { ErrorPath, TabErrorPage } from '@libs/layout';

import { resolveOnboardingRoute } from './resolve-route';

export function AppRouter() {
  const { onboardingFormState, setFormState } = useOnboardingFormState();

  const { loadIsLoggedIn, saveIsLoggedIn } = useSessionStorage();
  const isLoggedIn = loadIsLoggedIn();

  const keysDoesExist = useSelector(selectKeysDoesExist);
  const encryptionKeyDoesExist = useSelector(selectEncryptionKeyDoesExist);

  const route = resolveOnboardingRoute({
    keysDoesExist,
    encryptionKeyDoesExist,
    isLoggedIn
  });

  if (route === 'authorized') {
    return (
      <AuthorizedUserRoutes
        onboardingFormState={onboardingFormState}
        setFormState={setFormState}
      />
    );
  }

  if (route === 'locked') {
    return <LockedVaultRoutes />;
  }

  if (route === 'reauth') {
    return <ReauthUserRoutes saveIsLoggedIn={saveIsLoggedIn} />;
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

function LockedVaultRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.Any} element={<VaultLockedPage />} />
        <Route path={RouterPath.ResetWallet} element={<ResetWalletPage />} />
      </Routes>
    </HashRouter>
  );
}

function ReauthUserRoutes({ saveIsLoggedIn }: UnauthorizedRouterProps) {
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
          path={RouterPath.SelectAccountsToRecover}
          element={<SelectAccountsToRecoverPage />}
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
