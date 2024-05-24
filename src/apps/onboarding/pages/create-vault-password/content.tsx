import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { Typography } from '@libs/ui/components';
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
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 1</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Create password</Trans>
        </Typography>
      </VerticalSpaceContainer>

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
