import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { AccountActivityPlate, List, Tile, Typography } from '@libs/ui';
import { useAccountTransactions, useInfinityScroll } from '@src/hooks';
import { selectAccountActivity } from '@background/redux/account-info/selectors';

export enum ActivityListDisplayContext {
  Home = 'home',
  TokenDetails = 'token-details'
}

interface ActivityListProps {
  displayContext: ActivityListDisplayContext;
}

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const ActivityList = ({ displayContext }: ActivityListProps) => {
  const activityList = useSelector(selectAccountActivity);

  const { fetchMoreTransactions } = useAccountTransactions();
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);
  const { t } = useTranslation();

  if (activityList == null || activityList?.length === 0) {
    return (
      <VerticalSpaceContainer
        top={
          displayContext === ActivityListDisplayContext.Home
            ? SpacingSize.None
            : SpacingSize.Small
        }
      >
        <Tile>
          <Container>
            <Typography type="body" color="contentSecondary">
              {activityList == null && (
                <Trans t={t}>Something went wrong</Trans>
              )}
              {activityList?.length === 0 && <Trans t={t}>No activity</Trans>}
            </Typography>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    );
  }

  return (
    <List
      contentTop={
        displayContext === ActivityListDisplayContext.Home
          ? SpacingSize.None
          : SpacingSize.Small
      }
      rows={activityList}
      renderRow={(transaction, index) => {
        if (index === activityList?.length - 1) {
          return (
            <AccountActivityPlate
              ref={observerElement}
              transactionInfo={transaction}
            />
          );
        }

        return <AccountActivityPlate transactionInfo={transaction} />;
      }}
      marginLeftForItemSeparatorLine={54}
    />
  );
};
