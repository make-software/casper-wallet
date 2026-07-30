import React, { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { HomePageTabName, NetworkSetting } from '@src/constants';
import { isSafariBuild } from '@src/utils';

import { useHomeTab } from '@popup/hooks/use-home-tab';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectActiveNetworkSetting,
  selectDismissedAppEvents,
  selectVaultActiveAccount
} from '@background/redux/root-selector';

import {
  CenteredFlexColumn,
  CenteredFlexRow,
  ContentContainer,
  SpacingSize,
  TileContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  useExpiringCsprNames,
  useFetchCsprNameExpirations
} from '@libs/services/account-info';
import { useGetActiveAppMarketingEvent } from '@libs/services/app-events';
import {
  Button,
  SvgIcon,
  Tab,
  Tabs,
  Tile,
  Typography
} from '@libs/ui/components';
import { AppEventBanner } from '@libs/ui/components/app-event-banner/app-event-banner';

import { AccountBalance } from './components/account-balance';
import { CsprNameExpirationBanner } from './components/cspr-name-expiration-banner';
import { DeploysList } from './components/deploys-list';
import { MoreButtonsModal } from './components/more-buttons-modal';
import { NftList } from './components/nft-list';
import { TokensList } from './components/tokens-list';

const ButtonsContainer = styled(CenteredFlexRow)`
  margin-top: 24px;
`;

const ButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

const Container = styled(TileContainer)`
  margin-top: 24px;
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const location = useTypedLocation();
  const dismissedAppEventIds = useSelector(
    selectDismissedAppEvents,
    shallowEqual
  );
  const state = location.state;

  const { activeHomeTab, setActiveHomeTab } = useHomeTab();

  const handleTabChange = (tabName: string) => {
    // `Tabs` is name-addressed and generic over plain strings; on this page
    // the names are exactly the HomePageTabName members rendered below.
    setActiveHomeTab(tabName as HomePageTabName);
  };

  const network = useSelector(selectActiveNetworkSetting);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useFetchCsprNameExpirations();

  const { showExpirationBanner, dismissExpiringNames } = useExpiringCsprNames();

  // Latch for the whole popup session: dismissing the expiration banner must
  // not reveal the marketing banner until the popup is reopened (refs reset
  // on the next mount).
  const wasExpirationBannerShown = useRef(false);

  if (showExpirationBanner) {
    wasExpirationBannerShown.current = true;
  }

  useEffect(() => {
    if (!state?.activeTabId) {
      const container = document.querySelector('#ms-container');

      container?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [state?.activeTabId]);

  const { activeMarketingEvent } =
    useGetActiveAppMarketingEvent(dismissedAppEventIds);

  // At most one banner; the expiration banner wins over the marketing banner.
  const showMarketingBanner =
    Boolean(activeMarketingEvent) &&
    !showExpirationBanner &&
    !wasExpirationBannerShown.current;

  return (
    <ContentContainer>
      {showExpirationBanner && (
        <CsprNameExpirationBanner onDismiss={dismissExpiringNames} />
      )}
      {showMarketingBanner && activeMarketingEvent && (
        <AppEventBanner activeMarketingEvent={activeMarketingEvent} />
      )}
      {activeAccount && (
        <Tile>
          <Container>
            <AccountBalance />
            <ButtonsContainer gap={SpacingSize.XXXL}>
              {network === NetworkSetting.Mainnet && !isSafariBuild && (
                <ButtonContainer
                  gap={SpacingSize.Small}
                  onClick={() => navigate(RouterPath.BuyCSPR)}
                >
                  <Button circle>
                    <SvgIcon
                      src="assets/icons/card.svg"
                      color="contentOnFill"
                    />
                  </Button>
                  <Typography type="captionMedium" color="contentAction">
                    <Trans t={t}>Buy</Trans>
                  </Typography>
                </ButtonContainer>
              )}
              <ButtonContainer
                gap={SpacingSize.Small}
                onClick={() => navigate(RouterPath.Transfer)}
              >
                <Button circle>
                  <SvgIcon
                    src="assets/icons/transfer.svg"
                    color="contentOnFill"
                  />
                </Button>
                <Typography type="captionMedium" color="contentAction">
                  <Trans t={t}>Send</Trans>
                </Typography>
              </ButtonContainer>
              <MoreButtonsModal />
            </ButtonsContainer>
          </Container>
        </Tile>
      )}
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Tabs activeTabName={activeHomeTab} onTabChange={handleTabChange}>
          <Tab tabName={HomePageTabName.Tokens}>
            <TokensList />
          </Tab>
          <Tab tabName={HomePageTabName.NFTs}>
            <NftList />
          </Tab>
          <Tab tabName={HomePageTabName.Activity}>
            <DeploysList />
          </Tab>
        </Tabs>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
}
