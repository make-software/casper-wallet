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

      {children}
    </TabPageContainer>
  );
}
