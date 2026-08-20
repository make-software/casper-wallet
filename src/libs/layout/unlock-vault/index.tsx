import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PasswordDoesNotExistError } from '@src/errors';
import { getErrorMessageForIncorrectPassword } from '@src/utils';

import {
  UNLOCK_REQUEST_TYPE,
  UnlockResult
} from '@background/handlers/unlock-requests';
import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';

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
import { requestOverPort } from '@libs/messaging/background-port';
import { Button, Typography } from '@libs/ui/components';
import { LottiePlayer } from '@libs/ui/components/lottie-player';
import { UnlockWalletFormValues } from '@libs/ui/forms/unlock-wallet';

import { UnlockVaultPageContent } from './content';
import { shouldClearPasswordField } from './should-clear-password-field';

interface UnlockVaultPageProps {
  popupLayout?: boolean;
}

export const UnlockVaultPage = ({ popupLayout }: UnlockVaultPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const keysDoesExist = useSelector(selectKeysDoesExist);

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
    if (
      shouldClearPasswordField(wasLockedOut.current, hasLoginRetryLockoutTime)
    ) {
      resetField('password');
    }
    wasLockedOut.current = hasLoginRetryLockoutTime;
  }, [hasLoginRetryLockoutTime, resetField]);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await requestOverPort<UnlockResult>({
        type: UNLOCK_REQUEST_TYPE,
        payload: { password, attemptId: crypto.randomUUID() }
      });

      if (result.status === 'wrong') {
        setError('password', {
          message: t(getErrorMessageForIncorrectPassword(result.attemptsLeft))
        });
      } else if (result.status === 'error') {
        setError('password', {
          message: t('Something went wrong. Please try again.')
        });
      } else if (result.status === 'lockedOut') {
        // Normally the broadcast swaps the content to the lockout screen before
        // this is seen. `broadcastToReplicas` swallows delivery failures though,
        // so this is the only feedback if that broadcast is dropped.
        setError('password', {
          message: t(
            'Too many failed attempts. Please wait before trying again.'
          )
        });
      }
      // 'ok' unmounts this page via the broadcast, which needs no error here.
    } catch (error) {
      console.error('Unlock request failed:', error);
      setError('password', {
        message: t('Something went wrong. Please try again.')
      });
    } finally {
      setIsLoading(false);
    }
  }

  const footer = (
    <FooterButtonsContainer>
      <Button
        type="submit"
        style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
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
