import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { WorkerResult, isWorkerError } from '@background/workers/types';

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
  data: WorkerResult<{
    passwordHash: string;
    passwordSaltHash: string;
    newEncryptionKeyHash: string;
    keyDerivationSaltHash: string;
    newVaultCipher: string;
  }>;
}

export const ChangePasswordPage = () => {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const vault = useSelector(selectVault);

  const workerRef = useRef<Worker | null>(null);
  const isMountedRef = useRef(true);

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
    control,
    setError
  } = useCreatePasswordForm();

  const password = useWatch({
    control,
    name: 'password'
  });

  // the back link stays live while scrypt runs; without this the rotation would
  // still commit from a stale closure and the old password would stop working
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty,
    isSubmitting
  });

  const onSubmit = (data: CreatePasswordFormValues) => {
    const worker = new Worker(
      new URL('@background/workers/create-password-worker.ts', import.meta.url)
    );

    workerRef.current = worker;
    setIsSubmitting(true);

    worker.postMessage({
      password: data.password,
      vault
    });

    const disposeWorker = () => {
      worker.terminate();
      workerRef.current = null;
    };

    const handleFailure = () => {
      disposeWorker();
      setError('password', {
        message: t('Something went wrong. Please try again.')
      });
      setIsSubmitting(false);
    };

    worker.onmessage = (event: CreatePasswordWorkerMessageEvent) => {
      if (!isMountedRef.current) {
        return;
      }

      if (isWorkerError(event.data)) {
        handleFailure();
        return;
      }

      const {
        passwordHash,
        passwordSaltHash,
        newEncryptionKeyHash,
        keyDerivationSaltHash,
        newVaultCipher
      } = event.data;

      disposeWorker();

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

      navigate(RouterPath.Home);
    };

    // only reached by a script load failure — a rejection inside the worker
    // arrives through onmessage instead
    worker.onerror = error => {
      console.error(error);

      if (!isMountedRef.current) {
        return;
      }

      handleFailure();
    };
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
            {isSubmitting ? t('Loading') : <Trans t={t}>Continue</Trans>}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
