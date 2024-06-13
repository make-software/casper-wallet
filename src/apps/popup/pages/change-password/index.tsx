import React, { useCallback, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ChangePasswordPageContent } from '@popup/pages/change-password/content';
import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { keysUpdated } from '@background/redux/keys/actions';
import { encryptionKeyHashCreated } from '@background/redux/session/actions';
import { dispatchToMainStore } from '@background/redux/utils';
import { vaultCipherCreated } from '@background/redux/vault-cipher/actions';
import { selectVault } from '@background/redux/vault/selectors';

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

interface CreatePasswordWorkerMessageEvent extends MessageEvent {
  data: {
    passwordHash: string;
    passwordSaltHash: string;
    newEncryptionKeyHash: string;
    keyDerivationSaltHash: string;
    newVaultCipher: string;
  };
}

export const ChangePasswordPage = () => {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const vault = useSelector(selectVault);

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

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  const onSubmit = (data: CreatePasswordFormValues) => {
    const worker = new Worker(
      new URL('@background/workers/create-password-worker.ts', import.meta.url)
    );

    worker.postMessage({
      password: data.password,
      vault
    });

    worker.onmessage = (event: CreatePasswordWorkerMessageEvent) => {
      const {
        passwordHash,
        passwordSaltHash,
        newEncryptionKeyHash,
        keyDerivationSaltHash,
        newVaultCipher
      } = event.data;

      dispatchToMainStore(
        keysUpdated({
          passwordHash,
          passwordSaltHash,
          keyDerivationSaltHash
        })
      );

      dispatchToMainStore(
        encryptionKeyHashCreated({ encryptionKeyHash: newEncryptionKeyHash })
      );

      dispatchToMainStore(
        vaultCipherCreated({
          vaultCipher: newVaultCipher
        })
      );
    };

    worker.onerror = error => {
      console.error(error);
    };

    navigate(RouterPath.Home);
  };

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage setPasswordConfirmed={setPasswordConfirmed} />
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
