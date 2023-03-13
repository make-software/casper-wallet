import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { loginRetryCountReseted } from '@background/redux/login-retry-count/actions';

import { UnlockProtectedPageContent } from '@layout/unlock-protected-page-content';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

interface BackupSecretPhrasePasswordPageType {
  setPasswordConfirmed: () => void;
}

export const BackupSecretPhrasePasswordPage = ({
  setPasswordConfirmed
}: BackupSecretPhrasePasswordPageType) => {
  const { t } = useTranslation();

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
    dispatchToMainStore(loginRetryCountReseted());
  };

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <UnlockProtectedPageContent
          errors={errors}
          register={register}
          description={t('Enter your password to reveal your secret phrase.')}
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
