import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { lockVault } from '@background/redux/sagas/actions';
import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';

import { BackupSecretPhrasePasswordPageContent } from '@popup/pages/backup-secret-phrase-password/content';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button, PasswordInputType } from '@libs/ui';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

interface BackupSecretPhrasePasswordPageType {
  setPasswordConfirmed: () => void;
}

export const BackupSecretPhrasePasswordPage = ({
  setPasswordConfirmed
}: BackupSecretPhrasePasswordPageType) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  const loginRetryCount = useSelector(selectLoginRetryCount);
  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  const onSubmit = () => {
    setPasswordConfirmed();
  };

  const retryLeft = 5 - loginRetryCount;

  if (retryLeft <= 0) {
    dispatchToMainStore(lockVault());
  }

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <PopupHeader
          withLock
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <BackupSecretPhrasePasswordPageContent
          passwordInputType={passwordInputType}
          setPasswordInputType={setPasswordInputType}
          errors={errors}
          register={register}
          retryLeft={retryLeft}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={isSubmitButtonDisabled}>
            <Trans t={t}>Continue</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
