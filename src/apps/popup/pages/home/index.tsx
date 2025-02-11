import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { HomePageTabName, NetworkSetting } from '@src/constants';
import { isSafariBuild } from '@src/utils';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectActiveNetworkSetting, // selectShowCSPRNamePromotion,
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
  Button,
  SvgIcon,
  Tab,
  Tabs,
  Tile,
  Typography
} from '@libs/ui/components';

// import { CsprNameBanner } from '@libs/ui/components/cspr-name-banner/cspr-name-banner';
import { AccountBalance } from './components/account-balance';
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

  const state = location.state;

  const network = useSelector(selectActiveNetworkSetting);
  const activeAccount = useSelector(selectVaultActiveAccount);
  // const showCSPRNamePromotion = useSelector(selectShowCSPRNamePromotion);

  useEffect(() => {
    if (!state?.activeTabId) {
      const container = document.querySelector('#ms-container');

      container?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [state?.activeTabId]);

  // TODO CSPR.name
  return (
    <ContentContainer>
      {/*{showCSPRNamePromotion && <CsprNameBanner />}*/}
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
        <Tabs preferActiveTabId={state?.activeTabId}>
          <Tab tabName={HomePageTabName.Tokens}>
            <TokensList />
          </Tab>
          <Tab tabName={HomePageTabName.NFTs}>
            <NftList />
          </Tab>
          <Tab tabName={HomePageTabName.Deploys}>
            <DeploysList />
          </Tab>
        </Tabs>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
}
