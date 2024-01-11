import React, { forwardRef } from 'react';

import {
  AccountActivityPlateContainer,
  ActivityPlateContentContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Skeleton, Tile } from '@libs/ui/components';

type Ref = HTMLDivElement;

export const LoadingActivityView = forwardRef<Ref>((props, ref) => (
  <VerticalSpaceContainer top={SpacingSize.None} ref={ref}>
    <Tile>
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
    </Tile>
  </VerticalSpaceContainer>
));
