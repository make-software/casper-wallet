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
  // Set when this page is rendered inside a dedicated window rather than the
  // extension popup (WALLET-1345). Such a window has a single history entry, so
  // the default "back" link is a no-op and would trap the user; it also has no
  // business showing the wallet menu / network switcher. Passing this swaps the
  // header for a bare one whose only action closes the window.
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
    // The field is now read-only rather than disabled while verifying (so it
    // keeps focus), which leaves Enter able to re-submit. Guard against that.
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { password } = getValues();

    try {
      const result = await requestOverPort<UnlockResult>({
        type: VERIFY_PASSWORD_REQUEST_TYPE,
        payload: { password, attemptId: crypto.randomUUID() }
      });

      if (result.status !== 'ok') {
        // A transport failure (a rejected requestOverPort call, caught below)
        // must never be read as a wrong password — that would burn a login
        // attempt and eventually lock the wallet. Same for 'error' here.
        if (result.status === 'wrong') {
          setError('password', {
            message: t(getErrorMessageForIncorrectPassword(result.attemptsLeft))
          });
        } else if (result.status === 'error') {
          setError('password', {
            message: t('Something went wrong. Please try again.')
          });
        } else if (result.status === 'lockedOut') {
          // Normally the broadcast swaps the content to the lockout screen
          // before this is seen. `broadcastToReplicas` swallows delivery
          // failures though, so this is the only feedback if it's dropped.
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
