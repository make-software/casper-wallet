import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button, PasswordInputs } from '@libs/ui';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { dispatchToMainStore } from '@background/redux/utils';
import { changePassword } from '@background/redux/sagas/actions';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { ChangePasswordPageContent } from '@popup/pages/change-password/content';
import { useWatch } from 'react-hook-form';

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
