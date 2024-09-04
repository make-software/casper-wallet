import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { DeployStatus, SvgIcon, Typography } from '@libs/ui/components';
import { formatTimestampAge } from '@libs/ui/utils';

interface DeployContainerProps {
  children?: React.ReactNode;
  iconUrl: string;
  title: Maybe<string>;
  timestamp: string;
  deployStatus: { status: string; errorMessage: string | null };
}

const Dot = styled.div`
  height: 2px;
  width: 2px;
  background-color: ${props => props.theme.color.contentSecondary};
  border-radius: 50%;
  display: inline-block;
`;

const LogoImg = styled.img`
  width: 24px;
  height: 24px;
`;

export const DeployContainer = ({
  children,
  iconUrl,
  title,
  timestamp,
  deployStatus
}: DeployContainerProps) => {
  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      {iconUrl.endsWith('.svg') ? (
        <SvgIcon src={iconUrl || ''} alt={title || ''} size={24} />
      ) : (
        <LogoImg src={iconUrl} alt={title || ''} title={title || ''} />
      )}
      <FlexColumn>
        <AlignedFlexRow gap={SpacingSize.Small} style={{ maxWidth: '256px' }}>
          <Typography type="bodySemiBold" ellipsis>
            {title}
          </Typography>
          <DeployStatus deployResult={deployStatus} />
          <Dot />
          <Typography type="captionRegular" color="contentSecondary" noWrap>
            {formatTimestampAge(timestamp)}
          </Typography>
        </AlignedFlexRow>
        {children}
      </FlexColumn>
    </AlignedFlexRow>
  );
};
