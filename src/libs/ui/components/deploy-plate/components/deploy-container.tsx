import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

interface DeployContainerProps {
  children?: React.ReactNode;
  iconUrl: string;
  title: Maybe<string>;
}

const LogoImg = styled.img`
  width: 24px;
  height: 24px;
`;

export const DeployContainer = ({
  children,
  iconUrl,
  title
}: DeployContainerProps) => {
  return (
    <AlignedFlexRow gap={SpacingSize.Medium} flexGrow={1}>
      {iconUrl.endsWith('.svg') ? (
        <SvgIcon src={iconUrl || ''} alt={title || ''} size={24} />
      ) : (
        <LogoImg src={iconUrl} alt={title || ''} title={title || ''} />
      )}
      <FlexColumn>
        <AlignedFlexRow gap={SpacingSize.Small} style={{ maxWidth: '240px' }}>
          <Typography type="bodySemiBold" ellipsis>
            {title}
          </Typography>
        </AlignedFlexRow>
        {children}
      </FlexColumn>
    </AlignedFlexRow>
  );
};
