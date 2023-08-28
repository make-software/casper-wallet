import React from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  Erc20TokenActionResult,
  ExtendedDeployWithId,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import {
  AccountActivityPlateContainer,
  ActivityPlateContentContainer,
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography } from '@libs/ui';
import Skeleton from 'react-loading-skeleton';

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const NoActivityView = ({
  activityList,
  top,
  loading
}: {
  activityList:
    | (TransferResultWithId | Erc20TokenActionResult | ExtendedDeployWithId)[]
    | null;
  top?: SpacingSize;
  loading?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <VerticalSpaceContainer top={top || SpacingSize.Small}>
      <Tile>
        {loading ? (
          <>
            <AccountActivityPlateContainer>
              <Skeleton
                width={28}
                height={28}
                circle={true}
                style={{ marginRight: '4px' }}
              />
              <ActivityPlateContentContainer>
                <Skeleton height={24} borderRadius={8} />
                <Skeleton height={24} borderRadius={8} />
              </ActivityPlateContentContainer>
            </AccountActivityPlateContainer>
            <AccountActivityPlateContainer>
              <Skeleton
                width={28}
                height={28}
                circle={true}
                style={{ marginRight: '4px' }}
              />
              <ActivityPlateContentContainer>
                <Skeleton height={24} borderRadius={8} />
                <Skeleton height={24} borderRadius={8} />
              </ActivityPlateContentContainer>
            </AccountActivityPlateContainer>
          </>
        ) : (
          <Container>
            <Typography type="body" color="contentSecondary">
              {activityList == null && (
                <Trans t={t}>Something went wrong</Trans>
              )}
              {activityList?.length === 0 && <Trans t={t}>No activity</Trans>}
            </Typography>
          </Container>
        )}
      </Tile>
    </VerticalSpaceContainer>
  );
};
