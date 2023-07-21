import React from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  Erc20TokenActionResult,
  ExtendedDeployWithId,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography } from '@libs/ui';

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const NoActivityView = ({
  activityList
}: {
  activityList:
    | (TransferResultWithId | Erc20TokenActionResult | ExtendedDeployWithId)[]
    | null;
}) => {
  const { t } = useTranslation();

  return (
    <VerticalSpaceContainer top={SpacingSize.Small}>
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
