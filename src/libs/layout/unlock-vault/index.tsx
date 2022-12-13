import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout/containers';
import {
  PasswordInputType,
  Typography,
  Input,
  Button,
  PasswordVisibilityIcon,
  SvgIcon
} from '@src/libs/ui';

import { dispatchToMainStore } from '@src/background/redux/utils';
import {
  UnlockWalletFormValues,
  useUnlockWalletForm
} from '@src/libs/ui/forms/unlock-wallet';
import { calculateSubmitButtonDisabled } from '@src/libs/ui/forms/get-submit-button-state-from-validation';
import {
  selectKeyDerivationSaltHash,
  selectPasswordHash,
  selectPasswordSaltHash
} from '@src/background/redux/keys/selectors';
import { unlockVault } from '@src/background/redux/sagas/actions';
import { selectLoginRetryCount } from '@src/background/redux/login-retry-count/selectors';
import { selectVaultCipher } from '@background/redux/vault-cipher/selectors';
import { UnlockVault } from '@background/redux/sagas/types';

import { LockedRouterPath } from '../locked-router';

interface UnlockVaultEventData extends MessageEvent {
  data: UnlockVault;
}

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const loginRetryCount = useSelector(selectLoginRetryCount);
  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);
  const keyDerivationSaltHash = useSelector(selectKeyDerivationSaltHash);
  const vaultCipher = useSelector(selectVaultCipher);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, isValidating }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    const unlockVaultWorker = new Worker(
      new URL('@src/background/workers/unlockVaultWorker.ts', import.meta.url)
    );

    if (keyDerivationSaltHash == null) {
      throw Error("Key derivation salt doesn't exist");
    }

    unlockVaultWorker.postMessage({
      password,
      keyDerivationSaltHash,
      vaultCipher
    });

    unlockVaultWorker.onmessage = (event: UnlockVaultEventData) => {
      const {
        vault,
        newKeyDerivationSaltHash,
        newVaultCipher,
        newEncryptionKeyHash
      } = event.data;

      dispatchToMainStore(
        unlockVault({
          vault,
          newKeyDerivationSaltHash,
          newVaultCipher,
          newEncryptionKeyHash
        })
      );
    };

    unlockVaultWorker.onerror = error => {
      console.error(error);
    };
  }

  const submitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty,
    isSubmitting: isSubmitting || isValidating
  });

  const retryLeft = 5 - loginRetryCount;

  if (retryLeft <= 0) {
    return (
      <>
        <ContentContainer>
          <IllustrationContainer>
            <SvgIcon src="assets/illustrations/locked-wallet.svg" size={120} />
          </IllustrationContainer>
          <TextContainer gap="big">
            <Typography type="header">
              <Trans t={t}>Your wallet is locked</Trans>
            </Typography>
          </TextContainer>
          <TextContainer gap="medium">
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                Please enter your password to unlock. You have{' '}
                <b>{{ retryLeft }}</b> tries left.
              </Trans>
            </Typography>
          </TextContainer>
          <InputsContainer>
            <Input
              type={passwordInputType}
              placeholder={t('Password')}
              error={!!errors.password}
              validationText={errors.password?.message}
              suffixIcon={
                <PasswordVisibilityIcon
                  passwordInputType={passwordInputType}
                  setPasswordInputType={setPasswordInputType}
                />
              }
              {...register('password')}
            />
          </InputsContainer>
        </ContentContainer>
        <FooterButtonsAbsoluteContainer>
          <Button
            type="button"
            color="secondaryRed"
            onClick={() => navigate(LockedRouterPath.ResetVault)}
          >
            {t('Reset wallet')}
          </Button>
        </FooterButtonsAbsoluteContainer>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleUnlockVault)}>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon src="assets/illustrations/locked-wallet.svg" size={120} />
        </IllustrationContainer>
        <TextContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Your wallet is locked</Trans>
          </Typography>
        </TextContainer>
        <TextContainer gap="medium">
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Please enter your password to unlock. You have {{ retryLeft }}{' '}
              tries left.
            </Trans>
          </Typography>
        </TextContainer>
        <InputsContainer>
          <Input
            type={passwordInputType}
            placeholder={t('Password')}
            error={!!errors.password}
            validationText={errors.password?.message}
            suffixIcon={
              <PasswordVisibilityIcon
                passwordInputType={passwordInputType}
                setPasswordInputType={setPasswordInputType}
              />
            }
            {...register('password')}
          />
        </InputsContainer>
      </ContentContainer>
      <FooterButtonsAbsoluteContainer>
        <Button disabled={submitButtonDisabled} type="submit">
          {t('Unlock wallet')}
        </Button>
        <Button
          type="button"
          color="secondaryRed"
          onClick={() => navigate(LockedRouterPath.ResetVault)}
        >
          {t('Reset wallet')}
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
