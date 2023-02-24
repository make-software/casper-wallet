import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
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
import { selectVaultCipher } from '@background/redux/vault-cipher/selectors';
import { UnlockVault } from '@background/redux/sagas/types';
import { useLockWalletWhenNoMoreRetries } from '@layout/unlock-protected-page-content/use-lock-wallet-when-no-more-retries';
import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';

import { LockedRouterPath } from '../locked-router';

interface UnlockMessageEvent extends MessageEvent {
  data: UnlockVault;
}

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);
  const keyDerivationSaltHash = useSelector(selectKeyDerivationSaltHash);
  const vaultCipher = useSelector(selectVaultCipher);
  const hasLoginRetryLockoutTime = useSelector(selectHasLoginRetryLockoutTime);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isDirty, isSubmitting, isValidating }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    setIsLoading(true);
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

    unlockVaultWorker.onmessage = (event: UnlockMessageEvent) => {
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
      setIsLoading(false);
    };
  }

  const submitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty,
    isSubmitting: isSubmitting || isValidating
  });

  useLockWalletWhenNoMoreRetries(resetField);

  if (hasLoginRetryLockoutTime) {
    return (
      <>
        <ContentContainer>
          <IllustrationContainer>
            <SvgIcon src="assets/illustrations/password-lock.svg" size={120} />
          </IllustrationContainer>
          <ParagraphContainer top={SpacingSize.Big}>
            <Typography type="header">
              <Trans t={t}>
                Please wait before the next attempt to unlock your wallet
              </Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                You’ve reached the maximum number of unlock attempts. For
                security reasons, you will need to wait a brief while before you
                can attempt again.
              </Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer gap="medium">
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                You can try again in <b>5 mins.</b>
              </Trans>
            </Typography>
          </ParagraphContainer>
        </ContentContainer>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleUnlockVault)}>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon src="assets/illustrations/locked-wallet.svg" size={120} />
        </IllustrationContainer>
        <ParagraphContainer top={SpacingSize.Big}>
          <Typography type="header">
            <Trans t={t}>Your wallet is locked</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>Please enter your password to unlock.</Trans>
          </Typography>
        </ParagraphContainer>
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
        <Button disabled={isLoading || submitButtonDisabled} type="submit">
          {isLoading ? t('Loading') : t('Unlock wallet')}
        </Button>
        <Button
          disabled={isLoading}
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
