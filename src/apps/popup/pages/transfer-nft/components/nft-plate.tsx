import { INft } from 'casper-wallet-core/src/domain';
import React from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Tile, Typography } from '@libs/ui/components';

import { NFTData } from '../utils';

const Container = styled.div`
  padding: 16px;
`;

const NftImage = styled.img`
  height: 60px;
  width: 60px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

interface NftPlateProps {
  nftToken: INft | undefined;
  nftData?: NFTData;
}

export const NFTPlate = ({ nftData, nftToken }: NftPlateProps) => {
  const name = nftToken?.metadata?.name;

  const isImage = nftData?.contentType?.startsWith('image');
  const isVideo = nftData?.contentType?.startsWith('video');
  const isAudio = nftData?.contentType?.startsWith('audio');

  return (
    <Tile>
      <Container>
        <AlignedFlexRow gap={SpacingSize.Medium}>
          {isImage && <NftImage src={nftData?.url as string} />}
          {isAudio && (
            <SvgIcon
              src="assets/icons/audio-nft-placeholder.svg"
              height={60}
              width={60}
            />
          )}
          {isVideo && (
            <SvgIcon
              src="assets/icons/video-nft-placeholder.svg"
              height={60}
              width={60}
            />
          )}
          <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
            <Typography type="subtitle">{name}</Typography>
            <Typography type="captionRegular" color="contentSecondary">
              {nftToken?.contactName}
            </Typography>
          </LeftAlignedFlexColumn>
        </AlignedFlexRow>
      </Container>
    </Tile>
  );
};
