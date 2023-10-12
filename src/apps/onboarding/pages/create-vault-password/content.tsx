import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { minPasswordLength } from '@libs/ui/forms/form-validation-rules';

interface CreatePasswordPageContentProps {
  children: React.ReactNode;
}

export function CreateVaultPasswordPageContent({
  children
}: CreatePasswordPageContentProps) {
  const { t } = useTranslation();

  const needToAddMoreCharacters = minPasswordLength - passwordLength;

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<PasswordInputType>('password');

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Create password</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            To ensure a strong password use at least{' '}
            <Typography type="bodySemiBold" color="contentPrimary">
              {{ minPasswordLength }} characters.
            </Typography>{' '}
            Think of a random and memorable passphrase. Avoid using personally
            identifiable information.
          </Trans>
        </Typography>
      </TabTextContainer>

      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="body" color="contentSecondary">
          {needToAddMoreCharacters <= 0 ? (
            <Trans t={t}>
              Your password length is -{' '}
              <Typography type="bodySemiBold" color="contentPrimary">
                {{ passwordLength }} characters.
              </Typography>
            </Trans>
          ) : (
            <Trans t={t}>
              You need to add at least{' '}
              <Typography type="bodySemiBold" color="contentPrimary">
                {{ needToAddMoreCharacters }} characters
              </Typography>{' '}
              more.
            </Trans>
          )}
        </Typography>
      </VerticalSpaceContainer>

      {children}
    </TabPageContainer>
  );
}
