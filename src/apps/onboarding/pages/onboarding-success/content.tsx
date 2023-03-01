import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui';

const TipContainer = styled.div`
  margin-top: 12px;
`;

export function OnboardingSuccessPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon src="assets/illustrations/success.svg" size={140} />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>
            Congrats! Your Casper Wallet is set up and ready to go
          </Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Remember, if you ever lose access to your account you can always
            reinstall Casper Wallet and import your secret recovery phrase to
            regain access. Store it in a safe place.
          </Trans>
        </Typography>
      </TabTextContainer>
      <TipContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Tip: If this is your first time using a cryptocurrency web wallet we
            highly recommend reading through the user guides on{' '}
            <Link
              color="fillBlue"
              target="_blank"
              href="https://www.casperwallet.io/"
            >
              casperwallet.io
            </Link>{' '}
            .
          </Trans>
        </Typography>
      </TipContainer>
    </TabPageContainer>
  );
}
