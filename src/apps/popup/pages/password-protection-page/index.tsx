import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED,
  LOGIN_RETRY_ATTEMPTS_LIMIT
} from '@src/constants';
import { PasswordDoesNotExistError } from '@src/errors';
import { getErrorMessageForIncorrectPassword } from '@src/utils';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { usePrivateState } from '@hooks/use-private-state';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  UnlockProtectedPageContent
} from '@libs/layout';
import { Button } from '@libs/ui/components';

interface BackupSecretPhrasePasswordPageType {
  setPasswordConfirmed?: () => void;
  onClick?: (password: string) => Promise<void>;
  isLoading?: boolean;
}

interface VerifyPasswordMessageEvent extends MessageEvent {
  data: {
    isPasswordCorrect: boolean;
  };
}

export const PasswordProtectionPage = ({
  setPasswordConfirmed,
  onClick,
  isLoading = false
}: BackupSecretPhrasePasswordPageType) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();

  const privateState = usePrivateState();
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
    getValues,
    setError
  } = useForm({
    defaultValues: {
      password: ''
    }
  });

  const onSubmit = () => {
    if (privateState == null) return;

    const { passwordHash, passwordSaltHash } = privateState;

    setIsSubmitting(true);

    const { password } = getValues();

    const worker = new Worker(
      new URL('@background/workers/verify-password-worker.ts', import.meta.url)
    );

    worker.postMessage({
      passwordHash,
      passwordSaltHash,
      password
    });

    worker.onmessage = (event: VerifyPasswordMessageEvent) => {
      const { isPasswordCorrect } = event.data;

      if (!isPasswordCorrect) {
        dispatchToMainStore(loginRetryCountIncremented());
        const errorMessage = getErrorMessageForIncorrectPassword(attemptsLeft);

        setError('password', {
          message: t(errorMessage)
        });
        setIsSubmitting(false);
      } else {
        if (onClick) {
          onClick(password).then(() => {
            if (setPasswordConfirmed) {
              setPasswordConfirmed();
            }
            dispatchToMainStore(loginRetryCountReseted());
          });
        } else {
          if (setPasswordConfirmed) {
            setPasswordConfirmed();
          }
          dispatchToMainStore(loginRetryCountReseted());
        }
      }
    };

    worker.onerror = error => {
      console.error(error);
      setIsSubmitting(false);
    };
  };

  // private state (hashes) arrives in ms; matches existing async-boot behavior
  if (privateState == null) {
    return null;
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
        <UnlockProtectedPageContent errors={errors} register={register} />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? t('Loading') : t('Continue')}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
