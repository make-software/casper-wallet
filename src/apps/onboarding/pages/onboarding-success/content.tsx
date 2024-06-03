import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

export function OnboardingSuccessPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon
        src="assets/illustrations/wallet-ready.svg"
        width={230}
        height={120}
      />
      <TabTextContainer>
        <Typography type="headerBig">
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
      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Tip: If this is your first time using a cryptocurrency web wallet we
            highly recommend reading through the user guides on{' '}
            <Link
              color="contentAction"
              target="_blank"
              href="https://www.casperwallet.io/"
            >
              casperwallet.io
            </Link>
            .
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
