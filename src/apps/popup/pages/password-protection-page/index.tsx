import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { loginRetryCountReseted } from '@background/redux/login-retry-count/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  UnlockProtectedPageContent
} from '@libs/layout';
import { Button } from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';

interface BackupSecretPhrasePasswordPageType {
  setPasswordConfirmed?: () => void;
  onClick?: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export const PasswordProtectionPage = ({
  setPasswordConfirmed,
  onClick,
  isLoading = false
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
    formState: { errors, isDirty },
    getValues
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  const onSubmit = () => {
    if (onClick) {
      const { password } = getValues();

      onClick(password).then(() => {
        if (setPasswordConfirmed) {
          setPasswordConfirmed();
        }
        dispatchToMainStore(loginRetryCountReseted());
      });
    } else {
      if (setPasswordConfirmed) {
        setPasswordConfirmed();
      }
      dispatchToMainStore(loginRetryCountReseted());
    }
  };

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <UnlockProtectedPageContent errors={errors} register={register} />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={isSubmitButtonDisabled || isLoading}>
            {isLoading ? t('Loading') : t('Continue')}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
