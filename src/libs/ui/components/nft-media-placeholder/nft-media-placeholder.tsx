import React from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { useTheme } from 'styled-components';

import { SvgIcon } from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

export const ImageContainer = styled(CenteredFlexRow)`
  position: relative;

  width: 140px;
  height: 140px;

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

const SvgIconWrapper = styled.span(({ theme }) => ({
  position: 'absolute',
  path: {
    fill: theme.color.backgroundSecondary
  }
}));

export const EmptyMediaPlaceholder = ({
  children
}: {
  children?: JSX.Element;
}) => (
  <ImageContainer>
    <SvgIconWrapper>
      <SvgIcon
        src="assets/icons/media-placeholder.svg"
        height={140}
        width={140}
      />
    </SvgIconWrapper>
    {children}
  </ImageContainer>
);

export const LoadingMediaPlaceholder = () => {
  const theme = useTheme();

  return (
    <EmptyMediaPlaceholder>
      <Skeleton
        height="140px"
        width="140px"
        baseColor="#ffffff00"
        highlightColor={theme.color.backgroundPrimary}
        borderRadius={18}
      />
    </EmptyMediaPlaceholder>
  );
};
