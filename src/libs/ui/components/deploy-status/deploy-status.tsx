import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { SvgIcon, Tooltip, Typography } from '@libs/ui/components';
import { ContentColor } from '@libs/ui/utils';

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
  [Status.Success]: 'contentPositive',
  [Status.Executed]: 'contentPositive',
  [Status.Pending]: 'contentLightBlue',
  [Status.Error]: 'contentActionCritical',
  [Status.Expired]: 'contentActionCritical'
};

// TODO: replace with theme colors and use hexToRGBA
const StatusBackgroundColors = {
  [Status.Success]: 'rgba(119, 255, 190, 0.12)',
  [Status.Executed]: 'rgba(119, 255, 190, 0.12)',
  [Status.Pending]: 'rgba(116, 144, 255, 0.12)',
  [Status.Error]: 'rgba(204, 0, 15, 0.08)',
  [Status.Expired]: 'rgba(204, 0, 15, 0.08)'
};

const getDeployStatus = (
  deployResult?: { status: string; errorMessage: string | null } | null
): Status => {
  if (
    deployResult &&
    deployResult?.status &&
    deployResult?.status !== Status.Executed
  ) {
    return deployResult?.status as Status;
  }

  if (deployResult?.errorMessage) {
    return Status.Error;
  }

  return Status.Success;
};

export interface DeployStatusProps {
  deployResult:
    | { status: string; errorMessage: string | null }
    | null
    | undefined;
  textWithIcon?: boolean;
}

const StatusContainer = styled(AlignedFlexRow)<{ status: Status }>(
  ({ theme, status }) => ({
    padding: '4px 8px',

    backgroundColor: StatusBackgroundColors[status],
    borderRadius: theme.borderRadius.hundred
  })
);

export const isPendingStatus = (status: string) => status === Status.Pending;

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
  const message = deployResult?.errorMessage;

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
            uppercase
          >
            {StatusLabel[status]}
          </Typography>
        </StatusContainer>
      </Tooltip>
    );
  }

  if (status === Status.Success) {
    return null;
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
