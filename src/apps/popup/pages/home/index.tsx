import React, { useCallback, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import browser from 'webextension-polyfill';

import {
  HomePageTabName,
  NetworkSetting,
  getBuyWithTopperUrl
} from '@src/constants';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { selectAccountBalance } from '@background/redux/account-info/selectors';
import {
  selectActiveNetworkSetting,
  selectCountOfAccounts,
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount
} from '@background/redux/root-selector';

import { useCasperToken } from '@hooks/use-casper-token';

import {
  AlignedFlexRow,
  CenteredFlexColumn,
  CenteredFlexRow,
  ContentContainer,
  FlexColumn,
  FlexRow,
  HeaderSubmenuBarNavLink,
  LeftAlignedFlexColumn,
  LinkType,
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
  Typography,
  getFontSizeBasedOnTextLength
} from '@libs/ui';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';

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
  margin-top: 16px;
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
  const balance = useSelector(selectAccountBalance);

  const casperToken = useCasperToken();

  const handleBuyWithCSPR = useCallback(() => {
    if (activeAccount?.publicKey && network === NetworkSetting.Mainnet) {
      browser.tabs.create({
        url: getBuyWithTopperUrl(activeAccount.publicKey),
        active: true
      });
    }
  }, [activeAccount?.publicKey, network]);

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
            <FlexColumn gap={SpacingSize.Tiny}>
              <FlexRow gap={SpacingSize.Small}>
                <Typography
                  type="CSPRBold"
                  fontSize={getFontSizeBasedOnTextLength(
                    balance.amountMotes?.length || 1
                  )}
                >
                  {balance.amountMotes == null
                    ? '-'
                    : formatNumber(motesToCSPR(balance.amountMotes), {
                        precision: { max: 5 }
                      })}
                </Typography>
                <Typography
                  type="CSPRLight"
                  color="contentSecondary"
                  fontSize={getFontSizeBasedOnTextLength(
                    balance.amountMotes?.length || 1
                  )}
                >
                  CSPR
                </Typography>
              </FlexRow>
              <Typography
                type="body"
                color="contentSecondary"
                loading={!balance.amountMotes}
              >
                {balance.amountFiat}
              </Typography>
            </FlexColumn>
            <ButtonsContainer gap={SpacingSize.XXXL}>
              {network === NetworkSetting.Mainnet && (
                <ButtonContainer
                  gap={SpacingSize.Small}
                  onClick={handleBuyWithCSPR}
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
                onClick={() =>
                  navigate(
                    casperToken?.id
                      ? RouterPath.Transfer.replace(
                          ':tokenContractPackageHash',
                          casperToken.id
                        ).replace(
                          ':tokenContractHash',
                          casperToken.contractHash || 'null'
                        )
                      : RouterPath.TransferNoParams
                  )
                }
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
              <MoreButtonsModal handleBuyWithCSPR={handleBuyWithCSPR} />
            </ButtonsContainer>
          </TileContainer>
        </Tile>
      )}
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Tabs preferActiveTabId={state?.activeTabId}>
          <Tab tabName={HomePageTabName.Tokens}>
            <TokensList />
          </Tab>
          <Tab tabName={HomePageTabName.Deploys}>
            <DeploysList />
          </Tab>
          <Tab tabName={HomePageTabName.NFTs}>
            <NftList />
          </Tab>
        </Tabs>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
}

interface HomePageHeaderSubmenuItemsProps {
  linkType: LinkType;
}

export function HomePageHeaderSubmenuItems({
  linkType
}: HomePageHeaderSubmenuItemsProps) {
  const { t } = useTranslation();
  const countOfAccounts = useSelector(selectCountOfAccounts);

  return (
    <>
      <LeftAlignedFlexColumn>
        <Typography type="body">
          <Trans t={t}>Accounts list</Trans>
        </Typography>

        <Typography type="listSubtext" color="contentSecondary">
          {countOfAccounts} {countOfAccounts > 1 ? t('accounts') : t('account')}
        </Typography>
      </LeftAlignedFlexColumn>

      <HeaderSubmenuBarNavLink linkType={linkType} />
    </>
  );
}
