import React from 'react';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { ChangePasswordPageContent } from '@popup/pages/change-password/content';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { changePassword } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button, PasswordInputs } from '@libs/ui/components';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

export const ChangePasswordPage = () => {
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

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  const onSubmit = (data: CreatePasswordFormValues) => {
    dispatchToMainStore(changePassword({ password: data.password }));
    navigate(RouterPath.Home);
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
