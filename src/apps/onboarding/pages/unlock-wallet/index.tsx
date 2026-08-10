import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PasswordDoesNotExistError } from '@src/errors';

import { UnlockWalletPageContent } from '@onboarding/pages/unlock-wallet/content';
import { RouterPath, useTypedNavigate } from '@onboarding/router';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { loginRetryCountReseted } from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { usePrivateState } from '@hooks/use-private-state';

import {
  LayoutTab,
  PrivateStateErrorPage,
  TabFooterContainer as TabFooterContainerBase
} from '@libs/layout';
import { Button } from '@libs/ui/components';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';

// Design of this page is temporary. Should be changed after it will be done in Figma
const TabFooterContainer = styled(TabFooterContainerBase)`
  margin-top: 0;
`;

interface UnlockWalletPageProps {
  saveIsLoggedIn: (isLoggedIn: boolean) => void;
}

export function UnlockWalletPage({ saveIsLoggedIn }: UnlockWalletPageProps) {
  const {
    privateState,
    error: privateStateError,
    retry: retryPrivateState
  } = usePrivateState();
  const keysDoesExist = useSelector(selectKeysDoesExist);

  if (!keysDoesExist) {
    throw new PasswordDoesNotExistError();
  }

  if (privateStateError) {
    return <PrivateStateErrorPage layout="tab" onRetry={retryPrivateState} />;
  }

  // private state (hashes) arrives in ms; matches existing async-boot behavior
  if (privateState == null) {
    return null;
  }

  const { passwordHash, passwordSaltHash } = privateState;

  if (passwordHash == null || passwordSaltHash == null) {
    throw new PasswordDoesNotExistError();
  }

  return (
    <UnlockWalletForm
      passwordHash={passwordHash}
      passwordSaltHash={passwordSaltHash}
      saveIsLoggedIn={saveIsLoggedIn}
    />
  );
}

interface UnlockWalletFormProps extends UnlockWalletPageProps {
  passwordHash: string;
  passwordSaltHash: string;
}

// Inner component: the form hook needs the hashes at render time, so it is
// only mounted once the private state has arrived (keeps hook order legal)
function UnlockWalletForm({
  passwordHash,
  passwordSaltHash,
  saveIsLoggedIn
}: UnlockWalletFormProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const loginRetryCount = useSelector(selectLoginRetryCount);

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  function onSubmit() {
    dispatchToMainStore(loginRetryCountReseted());
    saveIsLoggedIn(true);
  }

  const retryLeft = 5 - loginRetryCount;

  if (retryLeft <= 0) {
    return (
      <LayoutTab
        layoutContext="withIllustration"
        minHeight="auto"
        renderContent={() => (
          <UnlockWalletPageContent
            register={register}
            errorMessage={errors.password?.message}
          >
            <Trans t={t}>You have 0 tries left</Trans>
          </UnlockWalletPageContent>
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button
              color="secondaryRed"
              onClick={() => navigate(RouterPath.ResetWallet)}
            >
              <Trans t={t}>Start again</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => (
          <UnlockWalletPageContent
            register={register}
            errorMessage={errors.password?.message}
          >
            <Trans
              defaults="Please enter your password to unlock. You have <bold>{{retryLeft}}</bold> tries left."
              values={{
                retryLeft
              }}
              components={{ bold: <strong /> }}
            />
          </UnlockWalletPageContent>
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button disabled={!isDirty} color="primaryRed">
              <Trans t={t}>Unlock wallet</Trans>
            </Button>
            <Button
              color="secondaryRed"
              onClick={() => navigate(RouterPath.ResetWallet)}
            >
              <Trans t={t}>Start again</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
