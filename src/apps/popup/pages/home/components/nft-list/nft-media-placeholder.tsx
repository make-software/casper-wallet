import React from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { useTheme } from 'styled-components';

import { SvgIcon } from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

export const ImageContainer = styled(CenteredFlexRow)`
  width: 140px;
  height: 145px;

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

export const EmptyMediaPlaceholder = ({
  children
}: {
  children?: JSX.Element;
}) => (
  <ImageContainer>
    <SvgIcon src="assets/icons/media-placeholder.svg" size={132} />
    {children}
  </ImageContainer>
);

export const LoadingMediaPlaceholder = () => {
  const theme = useTheme();

  return (
    <EmptyMediaPlaceholder>
      <Skeleton
        height="100%"
        width="100%"
        baseColor="#ffffff00"
        highlightColor={theme.color.backgroundPrimary}
        borderRadius={18}
      />
    </EmptyMediaPlaceholder>
  );
};
