import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { PasswordDoesNotExistError } from '@src/errors';
import { getErrorMessageForIncorrectPassword } from '@src/utils';

import {
  UnlockResult,
  VERIFY_PASSWORD_REQUEST_TYPE
} from '@background/handlers/unlock-requests';
import { selectKeysDoesExist } from '@background/redux/keys/selectors';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  UnlockProtectedPageContent
} from '@libs/layout';
import { requestOverPort } from '@libs/messaging/background-port';
import { Button } from '@libs/ui/components';

interface BackupSecretPhrasePasswordPageType {
  setPasswordConfirmed?: () => void;
  onClick?: (password: string) => Promise<void>;
  isLoading?: boolean;
  // Set when this page renders in a dedicated window: it has a single history
  // entry, so the header gets a bare close action instead of back and the menu.
  onCloseWindow?: () => void;
}

export const PasswordProtectionPage = ({
  setPasswordConfirmed,
  onClick,
  isLoading = false,
  onCloseWindow
}: BackupSecretPhrasePasswordPageType) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();

  const keysDoesExist = useSelector(selectKeysDoesExist);

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

  const onSubmit = async () => {
    // The field stays read-only rather than disabled while verifying so it keeps
    // focus, which leaves Enter able to re-submit.
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { password } = getValues();

    try {
      const result = await requestOverPort<UnlockResult>({
        type: VERIFY_PASSWORD_REQUEST_TYPE,
        payload: { password, attemptId: crypto.randomUUID() }
      });

      if (result.status !== 'ok') {
        // A transport failure (caught below) must never be read as a wrong
        // password — that would burn a login attempt. Same for 'error' here.
        if (result.status === 'wrong') {
          setError('password', {
            message: t(getErrorMessageForIncorrectPassword(result.attemptsLeft))
          });
        } else if (result.status === 'error') {
          setError('password', {
            message: t('Something went wrong. Please try again.')
          });
        } else if (result.status === 'lockedOut') {
          // The broadcast normally swaps in the lockout screen first, but
          // `broadcastToReplicas` swallows delivery failures, so this is the fallback.
          setError('password', {
            message: t(
              'Too many failed attempts. Please wait before trying again.'
            )
          });
        }
        setIsSubmitting(false);
        return;
      }

      if (onClick) {
        await onClick(password);
      }
      if (setPasswordConfirmed) {
        setPasswordConfirmed();
      }
    } catch (error) {
      // The password is in scope but is deliberately not referenced here —
      // only a static message and the error object are logged.
      console.error('Password confirmation failed:', error);
      setError('password', {
        message: t('Something went wrong. Please try again.')
      });
      setIsSubmitting(false);
    }
  };

  const renderHeader = () =>
    onCloseWindow ? (
      <HeaderPopup
        renderSubmenuBarItems={() => (
          <HeaderSubmenuBarNavLink linkType="close" onClick={onCloseWindow} />
        )}
      />
    ) : (
      <HeaderPopup
        withNetworkSwitcher
        withMenu
        withConnectionStatus
        renderSubmenuBarItems={() => (
          <HeaderSubmenuBarNavLink linkType="back" />
        )}
      />
    );

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={renderHeader}
      renderContent={() => (
        <UnlockProtectedPageContent
          errors={errors}
          register={register}
          readOnly={isSubmitting || isLoading}
        />
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
