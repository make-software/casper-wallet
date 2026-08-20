import React, { useCallback, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { ChangePasswordPageContent } from '@popup/pages/change-password/content';
import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { CHANGE_PASSWORD_REQUEST_TYPE } from '@background/handlers/privileged-port';
import { changePassword } from '@background/redux/sagas/actions';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { requestOverPort } from '@libs/messaging/background-port';
import { Button, PasswordInputs } from '@libs/ui/components';
import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

export const ChangePasswordPage = () => {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  // The saga re-verifies it before re-keying, so the plaintext has to survive
  // the confirmation screen — the stored hash it is checked against is
  // readable by any extension page, and so replayable, while this is not.
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
    control
  } = useCreatePasswordForm();

  const password = useWatch({
    control,
    name: 'password'
  });

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  const holdCurrentPassword = useCallback(async (password: string) => {
    setCurrentPassword(password);
  }, []);

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  const onSubmit = (data: CreatePasswordFormValues) => {
    if (currentPassword == null) return;

    requestOverPort({
      type: CHANGE_PASSWORD_REQUEST_TYPE,
      payload: { currentPassword, password: data.password }
    })
      .then(() => {
        clearUiError('dispatch-failed', changePassword.type);
      })
      .catch((error: unknown) => {
        console.error('Password change request failed:', error);
        reportUiError('dispatch-failed', changePassword.type);
      });

    navigate(RouterPath.Home);
  };

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage
        setPasswordConfirmed={setPasswordConfirmed}
        onClick={holdCurrentPassword}
      />
    );
  }

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
        <ChangePasswordPageContent>
          <PasswordInputs
            register={register}
            errors={errors}
            passwordLength={password?.length || 0}
          />
        </ChangePasswordPageContent>
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
