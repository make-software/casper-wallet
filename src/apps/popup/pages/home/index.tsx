import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import browser from 'webextension-polyfill';

import {
  AlignedFlexRow,
  FlexColumn,
  HeaderSubmenuBarNavLink,
  IconCircleContainer,
  LinkType,
  SpacingSize
} from '@libs/layout';
import {
  CenteredFlexColumn,
  ContentContainer,
  FlexRow,
  LeftAlignedFlexColumn,
  SpaceBetweenFlexRow,
  TileContainer,
  VerticalSpaceContainer
} from '@src/libs/layout/containers';

import {
  AccountActionsMenuPopover,
  Avatar,
  DeploysList,
  getFontSizeBasedOnTextLength,
  Hash,
  HashVariant,
  SvgIcon,
  Tab,
  Tabs,
  Tile,
  Typography
} from '@libs/ui';

import { useCasperToken, useFetchAccountActivity } from '@src/hooks';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';
import {
  selectActiveNetworkSetting,
  selectCountOfAccounts,
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount
} from '@src/background/redux/root-selector';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { formatNumber, motesToCSPR } from '@src/libs/ui/utils/formatters';
import { selectAccountBalance } from '@background/redux/account-info/selectors';
import {
  ActivityListTransactionsType,
  getBuyWithTopperUrl,
  HomePageTabName,
  NetworkSetting
} from '@src/constants';

import { TokensList } from './components/tokens-list';

const DividerLine = styled.hr`
  margin: 16px 0;

  border-width: 0;
  height: 0.5px;
  background-color: ${({ theme }) => theme.color.borderPrimary};
`;

const ButtonsContainer = styled(AlignedFlexRow)`
  margin-top: 28px;
`;

const ButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;
`;

export const HomePageTabsId = {
  Tokens: 0,
  Deploys: 1,
  NFTs: 2
};

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

  useActiveAccountBalance();
  useFetchAccountActivity(ActivityListTransactionsType.All);

  const casperToken = useCasperToken();

  const handleBuyWithCSPR = useCallback(() => {
    if (activeAccount?.publicKey && network === NetworkSetting.Mainnet) {
      browser.tabs.create({
        url: getBuyWithTopperUrl(activeAccount.publicKey),
        active: true
      });
    }
  }, [activeAccount?.publicKey, network]);

  return (
    <ContentContainer>
      {activeAccount && (
        <Tile>
          <TileContainer>
            <SpaceBetweenFlexRow>
              <FlexRow gap={SpacingSize.Large}>
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
                  />
                </LeftAlignedFlexColumn>
              </FlexRow>
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
                <IconCircleContainer color="fillBlue">
                  <SvgIcon
                    src="assets/icons/transfer.svg"
                    color="contentOnFill"
                  />
                </IconCircleContainer>
                <Typography type="captionMedium" color="contentBlue">
                  <Trans t={t}>Send</Trans>
                </Typography>
              </ButtonContainer>
              <ButtonContainer
                gap={SpacingSize.Small}
                onClick={() =>
                  navigate(RouterPath.Receive, {
                    state: { tokenData: casperToken }
                  })
                }
              >
                <IconCircleContainer color="fillBlue">
                  <SvgIcon
                    src="assets/icons/receive.svg"
                    color="contentOnFill"
                  />
                </IconCircleContainer>
                <Typography type="captionMedium" color="contentBlue">
                  <Trans t={t}>Receive</Trans>
                </Typography>
              </ButtonContainer>
              <ButtonContainer
                gap={SpacingSize.Small}
                onClick={handleBuyWithCSPR}
              >
                <IconCircleContainer color="fillBlue">
                  <SvgIcon src="assets/icons/card.svg" color="contentOnFill" />
                </IconCircleContainer>
                <Typography type="captionMedium" color="contentBlue">
                  <Trans t={t}>Buy</Trans>
                </Typography>
              </ButtonContainer>
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
          <Tab tabName={HomePageTabName.NFTs} />
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
