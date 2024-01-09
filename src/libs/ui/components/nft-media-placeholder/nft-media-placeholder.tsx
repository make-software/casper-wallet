import React from 'react';
import styled from 'styled-components';

import { CenteredFlexRow } from '@libs/layout';
import { Skeleton, SvgIcon } from '@libs/ui/components';

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

export const AudioNftPlaceholder: React.FC = () => (
  <ImageContainer>
    <SvgIcon
      src="assets/icons/audio-nft-placeholder.svg"
      height={140}
      width={140}
    />
  </ImageContainer>
);

export const VideoNftPlaceholder: React.FC = () => (
  <ImageContainer>
    <SvgIcon
      src="assets/icons/video-nft-placeholder.svg"
      height={140}
      width={140}
    />
  </ImageContainer>
);

export const LoadingMediaPlaceholder = () => {
  return (
    <EmptyMediaPlaceholder>
      <Skeleton height="140px" width="140px" borderRadius={18} />
    </EmptyMediaPlaceholder>
  );
};
