import React from 'react';
import { useTheme } from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Skeleton } from '@libs/ui/components';

export const SignatureRequestLoading: React.FC = () => {
  const theme = useTheme();

  return (
    <VerticalSpaceContainer
      top={SpacingSize.Medium}
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Skeleton
          width={40}
          height={40}
          circle={true}
          baseColor={theme.color.contentDisabled}
        />
        <FlexColumn flexGrow={1}>
          <Skeleton
            height={28}
            borderRadius={8}
            baseColor={theme.color.contentDisabled}
          />
          <Skeleton
            height={24}
            borderRadius={8}
            baseColor={theme.color.contentDisabled}
          />
        </FlexColumn>
      </AlignedFlexRow>

      <Skeleton
        height={100}
        borderRadius={8}
        style={{ marginBottom: 16, marginTop: 16 }}
        baseColor={theme.color.contentDisabled}
      />

      <Skeleton
        height={200}
        borderRadius={8}
        style={{ marginBottom: 16 }}
        baseColor={theme.color.contentDisabled}
      />

      <Skeleton
        height={56}
        borderRadius={8}
        baseColor={theme.color.contentDisabled}
      />
    </VerticalSpaceContainer>
  );
};
