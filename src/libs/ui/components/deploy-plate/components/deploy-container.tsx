import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon } from '@src/constants';
import { isBundledAssetPath } from '@src/utils';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { RemoteIcon, SvgIcon, Typography } from '@libs/ui/components';

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
      {isBundledAssetPath(iconUrl) ? (
        <SvgIcon src={iconUrl} alt={title || ''} size={24} />
      ) : (
        <RemoteIcon
          src={iconUrl}
          size={24}
          alt={title}
          title={title}
          fallbackSrc={DeployIcon.Generic}
        />
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
