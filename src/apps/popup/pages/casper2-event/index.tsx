import { t } from 'i18next';
import React, { useCallback } from 'react';
import { Trans } from 'react-i18next';

import { Casper2EventIdForSeparateScreen } from '@src/constants';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { dismissAppEvent } from '@background/redux/app-events/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { FooterButtonsContainer, HeaderPopup, PopupLayout } from '@libs/layout';
import { Button } from '@libs/ui/components';

import { WalletQrCodePageContent } from './content';

export const Casper2EventPage = () => {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const appEvent = location?.state?.appEvent;

  const handleGoBackHome = useCallback(() => {
    if (appEvent?.id) {
      dispatchToMainStore(dismissAppEvent(Casper2EventIdForSeparateScreen));
    }

    navigate(RouterPath.Home);
  }, [appEvent?.id, navigate]);

  const handleClickLearnMore = useCallback(() => {
    if (appEvent?.url) {
      window.open(appEvent.url, '_blank');
    }

    handleGoBackHome();
  }, [appEvent?.url, handleGoBackHome]);

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
      )}
      renderContent={() => <WalletQrCodePageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={handleClickLearnMore}>
            <Trans t={t}>Learn more</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={handleGoBackHome}>
            <Trans t={t}>Maybe later</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
