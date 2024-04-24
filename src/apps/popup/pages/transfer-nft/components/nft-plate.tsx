import React, { useMemo } from 'react';
import styled from 'styled-components';

import { getMetadataKeyValue, getNftTokenMetadataWithLinks } from '@src/utils';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { NFTTokenResult } from '@libs/services/nft-service';
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
  nftToken: NFTTokenResult | undefined;
  nftData?: NFTData;
}

export const NFTPlate = ({ nftData, nftToken }: NftPlateProps) => {
  const nftTokenMetadataWithLinks = useMemo(
    () => getNftTokenMetadataWithLinks(nftToken),
    [nftToken]
  );

  const metadataKeyValue = useMemo(
    () => getMetadataKeyValue(nftTokenMetadataWithLinks),
    [nftTokenMetadataWithLinks]
  );

  const isImage = nftData?.contentType?.startsWith('image');
  const isVideo = nftData?.contentType?.startsWith('video');
  const isAudio = nftData?.contentType?.startsWith('audio');

  return (
    <Tile>
      <Container>
        <AlignedFlexRow gap={SpacingSize.Medium}>
          {isImage && <NftImage src={nftData?.url} />}
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
            <Typography type="subtitle">{metadataKeyValue?.name}</Typography>
            <Typography type="captionRegular" color="contentSecondary">
              {nftToken?.contract_package?.contract_name}
            </Typography>
          </LeftAlignedFlexColumn>
        </AlignedFlexRow>
      </Container>
    </Tile>
  );
};
