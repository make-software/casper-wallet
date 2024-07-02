import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { FooterButtonsContainer, HeaderPopup, PopupLayout } from '@libs/layout';
import { Button } from '@libs/ui/components';

import { NoConnectedAccountPageContent } from './content';

export const NoConnectedAccountPage = () => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
      )}
      renderContent={() => <NoConnectedAccountPageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={() => navigate(RouterPath.Home)}>
            <Trans t={t}>Got it</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
