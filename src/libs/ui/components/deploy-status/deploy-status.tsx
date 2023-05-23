import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ExtendedDeployResult,
  LedgerLiveDeploysResult
} from '@libs/services/account-activity-service';
import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import {
  BackgroundColor,
  ContentColor,
  getColorFromTheme,
  SvgIcon,
  Tooltip,
  Typography
} from '@libs/ui';

export enum Status {
  Success = 'success',
  Error = 'error',
  Executed = 'executed',
  Pending = 'pending',
  Expired = 'expired'
}

const StatusIcons = {
  [Status.Success]: 'assets/icons/tick-in-circle.svg',
  [Status.Executed]: 'assets/icons/tick-in-circle.svg',
  [Status.Pending]: 'assets/icons/clock.svg',
  [Status.Error]: 'assets/icons/error.svg',
  [Status.Expired]: 'assets/icons/error.svg'
};

const StatusColors = {
  [Status.Success]: 'contentGreen',
  [Status.Executed]: 'contentGreen',
  [Status.Pending]: 'contentLightBlue',
  [Status.Error]: 'contentRed',
  [Status.Expired]: 'contentRed'
};

const StatusBackgroundColors = {
  [Status.Success]: 'backgroundLightGreen',
  [Status.Executed]: 'backgroundLightGreen',
  [Status.Pending]: 'backgroundLightBlue',
  [Status.Error]: 'backgroundLightRed',
  [Status.Expired]: 'backgroundLightRed'
};

const getDeployStatus = (
  deployResult?: ExtendedDeployResult | LedgerLiveDeploysResult | null
): Status => {
  if (
    deployResult &&
    deployResult?.status &&
    deployResult?.status !== Status.Executed
  ) {
    return deployResult?.status as Status;
  }

  if (deployResult?.error_message) {
    return Status.Error;
  }

  return Status.Success;
};

export interface DeployStatusProps {
  deployResult:
    | ExtendedDeployResult
    | LedgerLiveDeploysResult
    | null
    | undefined;
  textWithIcon?: boolean;
}

const StatusContainer = styled(AlignedFlexRow)<{ status: Status }>(
  ({ theme, status }) => ({
    padding: '4px 8px',

    backgroundColor: getColorFromTheme(
      theme,
      StatusBackgroundColors[status] as BackgroundColor
    ),
    borderRadius: theme.borderRadius.hundred
  })
);

export const DeployStatus = ({
  deployResult,
  textWithIcon
}: DeployStatusProps) => {
  const { t } = useTranslation();

  const StatusLabel = {
    [Status.Success]: t('Success'),
    [Status.Error]: t('Error'),
    [Status.Executed]: t('Executed'),
    [Status.Pending]: t('Pending'),
    [Status.Expired]: t('Expired')
  };

  const status = getDeployStatus(deployResult);
  const message = deployResult?.error_message || StatusLabel[status];

  if (textWithIcon) {
    return (
      <Tooltip title={message} placement="topRight">
        <StatusContainer status={status} gap={SpacingSize.Small}>
          <SvgIcon
            src={StatusIcons[status]}
            color={StatusColors[status] as ContentColor}
          />
          <Typography
            type="labelMedium"
            color={StatusColors[status] as ContentColor}
          >
            {StatusLabel[status]}
          </Typography>
        </StatusContainer>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={message} placement="bottomCenter">
      <Typography
        type="labelMedium"
        color={StatusColors[status] as ContentColor}
      >
        {StatusLabel[status]}
      </Typography>
    </Tooltip>
  );
};
