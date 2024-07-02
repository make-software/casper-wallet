import * as Yup from 'yup';
import { Player } from '@lottiefiles/react-lottie-player';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnyObject } from 'yup/es/types';

import {
  ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED,
  LOGIN_RETRY_ATTEMPTS_LIMIT
} from '@src/constants';
import { getErrorMessageForIncorrectPassword } from '@src/utils';

import {
  selectKeyDerivationSaltHash,
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { loginRetryCountIncremented } from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { unlockVault } from '@background/redux/sagas/actions';
import { UnlockVault } from '@background/redux/sagas/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultCipher } from '@background/redux/vault-cipher/selectors';
import { VaultState } from '@background/redux/vault/types';

import { useLockWalletWhenNoMoreRetries } from '@hooks/use-lock-wallet-when-no-more-retries';

import unlockAnimation from '@libs/animations/unlock_animation.json';
import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow,
  LockedRouterPath,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import { Button, Typography } from '@libs/ui/components';
import { UnlockWalletFormValues } from '@libs/ui/forms/unlock-wallet';

import { UnlockVaultPageContent } from './content';

interface UnlockMessageEvent extends MessageEvent {
  data: UnlockVault;
}

interface UnlockVaultPageProps {
  popupLayout?: boolean;
}

interface VerifyPasswordMessageEvent extends MessageEvent {
  data: {
    isPasswordCorrect: Yup.StringSchema<
      string | undefined,
      AnyObject,
      string | undefined
    >;
  };
}

export const UnlockVaultPage = ({ popupLayout }: UnlockVaultPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);
  const keyDerivationSaltHash = useSelector(selectKeyDerivationSaltHash);
  const vaultCipher = useSelector(selectVaultCipher);
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const attemptsLeft =
    LOGIN_RETRY_ATTEMPTS_LIMIT -
    loginRetryCount -
    ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED;

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
    setError
  } = useForm({
    defaultValues: {
      password: ''
    }
  });

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    if (isLoading) return;

    setIsLoading(true);

    const verifyPasswordWorker = new Worker(
      new URL('@background/workers/verify-password-worker.ts', import.meta.url)
    );
    const unlockVaultWorker = new Worker(
      new URL('@background/workers/unlock-vault-worker.ts', import.meta.url)
    );

    if (keyDerivationSaltHash == null) {
      throw Error("Key derivation salt doesn't exist");
    }

    verifyPasswordWorker.postMessage({
      passwordHash,
      passwordSaltHash,
      password
    });

    verifyPasswordWorker.onmessage = (event: VerifyPasswordMessageEvent) => {
      const { isPasswordCorrect } = event.data;
      const errorMessage = getErrorMessageForIncorrectPassword(attemptsLeft);

      if (!isPasswordCorrect) {
        dispatchToMainStore(loginRetryCountIncremented());
        setError('password', {
          message: t(errorMessage)
        });
        setIsLoading(false);
      } else {
        unlockVaultWorker.postMessage({
          password,
          keyDerivationSaltHash,
          vaultCipher
        });
      }
    };

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

      // Mapping through vault accounts to update missing hidden property
      const updatedVaultWithHiddenProp = vault.accounts.map(acc => {
        // If the hidden property is undefined, set it to false
        if (acc.hidden === undefined) {
          return {
            ...acc,
            hidden: false
          };
        }

        return acc;
      });

      if (hasCheckSummedPublicKeys) {
        const updatedVault: VaultState = {
          ...vault,
          accounts: updatedVaultWithHiddenProp.map(acc => ({
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
            vault: { ...vault, accounts: updatedVaultWithHiddenProp },
            newKeyDerivationSaltHash,
            newVaultCipher,
            newEncryptionKeyHash
          })
        );
      }
    };

    verifyPasswordWorker.onerror = error => {
      console.error(error);
      setIsLoading(false);
    };

    unlockVaultWorker.onerror = error => {
      console.error(error);
      setIsLoading(false);
    };
  }

  useLockWalletWhenNoMoreRetries(resetField);

  const footer = (
    <FooterButtonsContainer>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Player
              renderer={'svg'}
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
    </FooterButtonsContainer>
  );

  return popupLayout ? (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(handleUnlockVault)}
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <UnlockVaultPageContent register={register} errors={errors} />
      )}
      renderFooter={() => footer}
    />
  ) : (
    <LayoutWindow
      variant="form"
      onSubmit={handleSubmit(handleUnlockVault)}
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <UnlockVaultPageContent register={register} errors={errors} />
      )}
      renderFooter={() => footer}
    />
  );
};
