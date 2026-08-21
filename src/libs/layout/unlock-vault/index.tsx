import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED,
  LOGIN_RETRY_ATTEMPTS_LIMIT
} from '@src/constants';
import { PasswordDoesNotExistError } from '@src/errors';
import { getErrorMessageForIncorrectPassword } from '@src/utils';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { loginRetryCountIncremented } from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import { unlockVault } from '@background/redux/sagas/actions';
import { UnlockVault } from '@background/redux/sagas/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { VaultState } from '@background/redux/vault/types';
import { WorkerResult, isWorkerError } from '@background/workers/types';

import { usePrivateState } from '@hooks/use-private-state';

import unlockAnimation from '@libs/animations/unlock_animation.json';
import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow,
  LockedRouterPath,
  PopupLayout,
  PrivateStateErrorPage,
  SpacingSize
} from '@libs/layout';
import { Button, Typography } from '@libs/ui/components';
import { LottiePlayer } from '@libs/ui/components/lottie-player';
import { UnlockWalletFormValues } from '@libs/ui/forms/unlock-wallet';

import { UnlockVaultPageContent } from './content';
import { didLockoutArm } from './lockout-armed-edge';

interface UnlockMessageEvent extends MessageEvent {
  data: WorkerResult<UnlockVault>;
}

interface UnlockVaultPageProps {
  popupLayout?: boolean;
}

interface VerifyPasswordMessageEvent extends MessageEvent {
  data: WorkerResult<{
    isPasswordCorrect: boolean;
  }>;
}

export const UnlockVaultPage = ({ popupLayout }: UnlockVaultPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    privateState,
    error: privateStateError,
    retry: retryPrivateState
  } = usePrivateState();
  const keysDoesExist = useSelector(selectKeysDoesExist);
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const attemptsLeft =
    LOGIN_RETRY_ATTEMPTS_LIMIT -
    loginRetryCount -
    ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED;

  if (!keysDoesExist) {
    throw new PasswordDoesNotExistError();
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

  const hasLoginRetryLockoutTime = useSelector(selectHasLoginRetryLockoutTime);
  const wasLockedOut = useRef(hasLoginRetryLockoutTime);

  useEffect(() => {
    if (didLockoutArm(wasLockedOut.current, hasLoginRetryLockoutTime)) {
      resetField('password');
      setIsLoading(false);
    }
    wasLockedOut.current = hasLoginRetryLockoutTime;
  }, [hasLoginRetryLockoutTime, resetField]);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    // The saga refuses while a lockout is armed, and its refusal answers with a
    // banner only — nothing that would clear the spinner this would have set.
    if (isLoading || privateState == null || hasLoginRetryLockoutTime) return;

    const {
      passwordHash,
      passwordSaltHash,
      keyDerivationSaltHash,
      vaultCipher
    } = privateState;

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

    const disposeWorkers = () => {
      verifyPasswordWorker.terminate();
      unlockVaultWorker.terminate();
    };

    const handleWorkerFailure = () => {
      disposeWorkers();
      setError('password', {
        message: t('Something went wrong. Please try again.')
      });
      setIsLoading(false);
    };

    verifyPasswordWorker.postMessage({
      passwordHash,
      passwordSaltHash,
      password
    });

    verifyPasswordWorker.onmessage = (event: VerifyPasswordMessageEvent) => {
      if (isWorkerError(event.data)) {
        handleWorkerFailure();
        return;
      }

      const { isPasswordCorrect } = event.data;
      const errorMessage = getErrorMessageForIncorrectPassword(attemptsLeft);

      if (!isPasswordCorrect) {
        disposeWorkers();
        dispatchToMainStore(loginRetryCountIncremented());
        setError('password', {
          message: t(errorMessage)
        });
        setIsLoading(false);
      } else {
        verifyPasswordWorker.terminate();
        unlockVaultWorker.postMessage({
          password,
          keyDerivationSaltHash,
          vaultCipher
        });
      }
    };

    unlockVaultWorker.onmessage = (event: UnlockMessageEvent) => {
      if (isWorkerError(event.data)) {
        handleWorkerFailure();
        return;
      }

      const {
        vault,
        newKeyDerivationSaltHash,
        newVaultCipher,
        newEncryptionKeyHash
      } = event.data;

      unlockVaultWorker.terminate();

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

    // only reached by a script load failure — a rejection inside a worker
    // arrives through onmessage instead
    verifyPasswordWorker.onerror = error => {
      console.error(error);
      handleWorkerFailure();
    };

    unlockVaultWorker.onerror = error => {
      console.error(error);
      handleWorkerFailure();
    };
  }

  if (privateStateError) {
    return (
      <PrivateStateErrorPage
        layout={popupLayout ? 'popup' : 'window'}
        onRetry={retryPrivateState}
      />
    );
  }

  // private state (hashes + cipher) arrives in ms; matches existing async-boot behavior
  if (privateState == null) {
    return null;
  }

  const footer = (
    <FooterButtonsContainer>
      <Button
        type="submit"
        style={{
          pointerEvents: isLoading || hasLoginRetryLockoutTime ? 'none' : 'auto'
        }}
      >
        {isLoading ? (
          <AlignedFlexRow gap={SpacingSize.Small}>
            <LottiePlayer
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
