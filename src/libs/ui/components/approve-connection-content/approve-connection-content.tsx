import { getAccountHashFromPublicKey } from 'casper-wallet-core';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import React, { PropsWithChildren } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  ListItemClickableContainer,
  PageContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Account } from '@libs/types/account';
import { List, SvgIcon, Tile, Typography } from '@libs/ui/components';
import { AccountListItem } from '@libs/ui/components/account-list/account-list-item';
import { MaybeLink } from '@libs/ui/components/maybe-link/maybe-link';

const ListItemContainer = styled(ListItemClickableContainer)`
  cursor: unset;
  justify-content: unset;
`;

const Favicon = styled.img`
  width: 40px;
  height: 40px;

  object-fit: contain;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
`;

const RowContainer = styled(FlexColumn)`
  padding: 0 8px 0 0;
`;

const Container: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Tile style={{ marginTop: '12px' }}>
      <RowContainer>{children}</RowContainer>
    </Tile>
  );
};

interface ApproveConnectionContentProps {
  origin: string | null;
  activeOriginFavicon: string | null;
  account: Account;
  accountsInfo: Record<string, IAccountInfo>;
  accountLiquidBalance: string;
  isLoadingBalance: boolean;
}

export function ApproveConnectionContent({
  origin,
  activeOriginFavicon,
  account,
  accountsInfo,
  accountLiquidBalance,
  isLoadingBalance = false
}: ApproveConnectionContentProps) {
  const { t } = useTranslation();

  const listItems = [
    {
      id: 1,
      text: t('See address, balance, activity'),
      iconPath: 'assets/icons/show.svg'
    },
    {
      id: 2,
      text: t('Suggest transaction to approve'),
      iconPath: 'assets/icons/thumb-up.svg'
    }
  ];

  return (
    <PageContainer>
      <ContentContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            {activeOriginFavicon && (
              <div>
                <Favicon src={activeOriginFavicon} />
              </div>
            )}
            <FlexColumn flexGrow={1}>
              <Typography type="header">
                <Trans t={t}>Connection Request</Trans>
              </Typography>
              <MaybeLink link={origin}>
                <Typography
                  type="captionRegular"
                  color={'contentAction'}
                  ellipsis
                  style={{ maxWidth: '296px' }}
                >
                  <Trans t={t}>{origin}</Trans>
                </Typography>
              </MaybeLink>
            </FlexColumn>
          </AlignedFlexRow>
        </VerticalSpaceContainer>

        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <Typography
            type="labelMedium"
            uppercase
            color="contentSecondary"
            style={{ margin: '0 16px' }}
          >
            Account
          </Typography>
          <Container>
            <AccountListItem
              account={{
                ...account,
                accountHash: getAccountHashFromPublicKey(account.publicKey),
                id: account.publicKey
              }}
              isConnected={false}
              isActiveAccount={false}
              accountsInfo={accountsInfo}
              accountLiquidBalance={accountLiquidBalance}
              isLoadingBalance={isLoadingBalance}
              withMenu={false}
            />
          </Container>
        </VerticalSpaceContainer>

        <List
          headerLabel={t('allow this site to')}
          rows={listItems}
          contentTop={SpacingSize.Small}
          renderRow={listItem => (
            <ListItemContainer key={listItem.id}>
              <SvgIcon src={listItem.iconPath} color="contentDisabled" />
              <Typography type="body">{listItem.text}</Typography>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
