import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { HomePageTabName, NetworkSetting } from '@src/constants';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectActiveNetworkSetting,
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount
} from '@background/redux/root-selector';

import {
  AlignedFlexRow,
  CenteredFlexColumn,
  CenteredFlexRow,
  ContentContainer,
  LeftAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  TileContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  AccountActionsMenuPopover,
  Avatar,
  Button,
  Hash,
  HashVariant,
  SvgIcon,
  Tab,
  Tabs,
  Tile,
  Typography
} from '@libs/ui/components';

import { AccountBalance } from './components/account-balance';
import { DeploysList } from './components/deploys-list';
import { MoreButtonsModal } from './components/more-buttons-modal';
import { NftList } from './components/nft-list';
import { TokensList } from './components/tokens-list';

const DividerLine = styled.hr`
  margin: 16px 0;

  border-width: 0;
  height: 0.5px;
  background-color: ${({ theme }) => theme.color.borderPrimary};
`;

const ButtonsContainer = styled(CenteredFlexRow)`
  margin-top: 24px;
`;

const ButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const location = useTypedLocation();

  const state = location.state;

  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithActiveOrigin
  );
  const network = useSelector(selectActiveNetworkSetting);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    if (!state?.activeTabId) {
      const container = document.querySelector('#ms-container');

      container?.scrollTo(0, 0);
    }
  }, [state?.activeTabId]);

  return (
    <ContentContainer>
      {activeAccount && (
        <Tile>
          <TileContainer>
            <SpaceBetweenFlexRow>
              <AlignedFlexRow gap={SpacingSize.Large}>
                <Avatar
                  size={44}
                  publicKey={activeAccount.publicKey}
                  withConnectedStatus
                  isConnected={isActiveAccountConnected}
                />
                <LeftAlignedFlexColumn>
                  <Typography type="bodySemiBold">
                    {activeAccount.name}
                  </Typography>
                  <Hash
                    value={activeAccount.publicKey}
                    variant={HashVariant.CaptionHash}
                    truncated
                    placement="bottomCenter"
                  />
                </LeftAlignedFlexColumn>
              </AlignedFlexRow>
              <AccountActionsMenuPopover account={activeAccount} />
            </SpaceBetweenFlexRow>
            <DividerLine />
            <AccountBalance />
            <ButtonsContainer gap={SpacingSize.XXXL}>
              {network === NetworkSetting.Mainnet && (
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
          </TileContainer>
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
