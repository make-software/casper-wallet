import React from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, FlexRow, SpacingSize } from '@libs/layout';
import { DeployStatus, SvgIcon, Typography } from '@libs/ui/components';
import { formatTimestampAge } from '@libs/ui/utils';

const Dot = styled.div`
  height: 2px;
  width: 2px;
  background-color: ${props => props.theme.color.contentSecondary};
  border-radius: 50%;
  display: inline-block;
`;

export const DeployContainer = ({
  children,
  iconUrl,
  title,
  timestamp
}: {
  children?: React.ReactNode;
  iconUrl: string;
  title: string;
  timestamp: string;
}) => (
  <FlexRow gap={SpacingSize.Small}>
    <SvgIcon src={iconUrl} size={24} />
    <FlexColumn>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="bodySemiBold">{title}</Typography>
        {/*TODO: update props for deploy status */}
        <DeployStatus
          deployResult={{ status: 'pending', errorMessage: null }}
        />
        <Dot />
        <Typography type="captionRegular" color="contentSecondary" noWrap>
          {formatTimestampAge(timestamp)}
        </Typography>
      </AlignedFlexRow>
      {children}
    </FlexColumn>
  </FlexRow>
);
