import { IDeploy } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Erc20TokenActionResult,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import { Tile, Typography } from '@libs/ui/components';

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const NoActivityView = ({
  activityList,
  top
}: {
  activityList:
    | (TransferResultWithId | Erc20TokenActionResult | IDeploy)[]
    | null;
  top?: SpacingSize;
  loading?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <VerticalSpaceContainer top={top || SpacingSize.Small}>
      <Tile>
        <Container>
          <Typography type="body" color="contentSecondary">
            {activityList == null && <Trans t={t}>Something went wrong</Trans>}
            {activityList?.length === 0 && <Trans t={t}>No activity</Trans>}
          </Typography>
        </Container>
      </Tile>
    </VerticalSpaceContainer>
  );
};
