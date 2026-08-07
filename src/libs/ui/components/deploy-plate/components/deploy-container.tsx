import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';

import { DeployContainerIcon } from './deploy-container-icon';

interface DeployContainerProps {
  children?: React.ReactNode;
  iconUrl: string;
  title: Maybe<string>;
}

export const DeployContainer = ({
  children,
  iconUrl,
  title
}: DeployContainerProps) => {
  return (
    <AlignedFlexRow gap={SpacingSize.Medium} flexGrow={1}>
      <DeployContainerIcon iconUrl={iconUrl} title={title} />
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
