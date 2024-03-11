import { Player } from '@lottiefiles/react-lottie-player';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  selectKeyDerivationSaltHash,
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import { unlockVault } from '@background/redux/sagas/actions';
import { UnlockVault } from '@background/redux/sagas/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultCipher } from '@background/redux/vault-cipher/selectors';
import { VaultState } from '@background/redux/vault/types';

import { useLockWalletWhenNoMoreRetries } from '@hooks/use-lock-wallet-when-no-more-retries';

import unlockAnimation from '@libs/animations/unlock_animation.json';
import {
  AlignedFlexRow,
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  InputsContainer,
  LockedRouterPath,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  Button,
  Input,
  PasswordInputType,
  PasswordVisibilityIcon,
  SvgIcon,
  Typography
} from '@libs/ui/components';
import {
  UnlockWalletFormValues,
  useUnlockWalletForm
} from '@libs/ui/forms/unlock-wallet';

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
    formState: { errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    if (isLoading) return;

    setIsLoading(true);
    const unlockVaultWorker = new Worker(
      new URL('@background/workers/unlockVaultWorker.ts', import.meta.url)
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

      // We should not store checksummed public keys because of possible issues on connect apps
      // that does not migrate to the new casper SDK behavior
      const hasCheckSummedPublicKeys = vault.accounts.some(acc =>
        /[A-Z]/.test(acc.publicKey)
      );

      if (hasCheckSummedPublicKeys) {
        const updatedVault: VaultState = {
          ...vault,
          accounts: vault.accounts.map(acc => ({
            ...acc,
            publicKey: acc.publicKey.toLowerCase()
          }))
        };

        dispatchToMainStore(
          unlockVault({
            vault: updatedVault,
            newKeyDerivationSaltHash,
            newVaultCipher,
            newEncryptionKeyHash
          })
        );
      } else {
        dispatchToMainStore(
          unlockVault({
            vault,
            newKeyDerivationSaltHash,
            newVaultCipher,
            newEncryptionKeyHash
          })
        );
      }
    };

    unlockVaultWorker.onerror = error => {
      console.error(error);
      setIsLoading(false);
    };
  }

  useLockWalletWhenNoMoreRetries(resetField);

  if (hasLoginRetryLockoutTime) {
    return (
      <>
        <ContentContainer>
          <IllustrationContainer>
            <SvgIcon
              src="assets/illustrations/password-lock.svg"
              width={210}
              height={120}
            />
          </IllustrationContainer>
          <ParagraphContainer top={SpacingSize.XL}>
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
          <ParagraphContainer top={SpacingSize.Medium}>
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
          <SvgIcon
            src="assets/illustrations/locked-wallet.svg"
            width={200}
            height={120}
          />
        </IllustrationContainer>
        <ParagraphContainer top={SpacingSize.XL}>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Player
                renderer="svg"
                autoplay
                loop
                src={unlockAnimation}
                style={{ width: '24px', height: '24px' }}
              />
              <Typography type="bodySemiBold">
                <Trans t={t}>Unlocking...</Trans>
              </Typography>
            </AlignedFlexRow>
          ) : (
            <Typography type="bodySemiBold">
              <Trans t={t}>Unlock wallet</Trans>
            </Typography>
          )}
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
