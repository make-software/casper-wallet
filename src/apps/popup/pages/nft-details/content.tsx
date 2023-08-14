import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';
import ReactPlayer from 'react-player';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  CenteredFlexRow,
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Hash,
  HashVariant,
  List,
  SvgIcon,
  Tile,
  Typography,
  EmptyMediaPlaceholder,
  LoadingMediaPlaceholder
} from '@libs/ui';
import { NFTTokenResult } from '@libs/services/nft-service';
import {
  findMediaPreview,
  getImageProxyUrl,
  getMetadataKeyValue,
  getNftTokenMetadataWithLinks,
  isSafariExtension,
  MapNFTTokenStandardToName
} from '@src/utils';

const NftImageContainer = styled(CenteredFlexRow)`
  width: 100%;
  height: 100%;
  max-height: 328px;
  max-width: 328px;

  padding: 8px;
`;

const NftImage = styled.img`
  max-height: 312px;
  max-width: 312px;
  object-fit: contain;
  object-position: center;
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

const Container = styled(AlignedSpaceBetweenFlexRow)<{ withIcon: boolean }>`
  padding: ${({ withIcon }) => (withIcon ? '14px 16px' : '18px 16px')};
`;

const Player = styled(ReactPlayer)`
  max-height: 312px;
  max-width: 312px;

  video {
    max-width: 312px;
    max-height: 312px;
  }
`;

interface NftDetailsContentProps {
  nftToken: NFTTokenResult | null;
}

export const NftDetailsContent = ({
  nftToken: nftTokenParam
}: NftDetailsContentProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [showMedia, setShowMedia] = useState<boolean>(false);
  const [nftToken] = useState(nftTokenParam);

  const { t } = useTranslation();

  const nftTokenMetadataWithLinks = useMemo(
    () => getNftTokenMetadataWithLinks(nftToken),
    [nftToken]
  );

  const preview = nftTokenMetadataWithLinks?.find(findMediaPreview);
  const cachedUrl = getImageProxyUrl(preview?.value);

  const metadataKeyValue = useMemo(
    () => getMetadataKeyValue(nftTokenMetadataWithLinks),
    [nftTokenMetadataWithLinks]
  );

  const tokenStandard = nftToken
    ? MapNFTTokenStandardToName[nftToken.token_standard_id]
    : '';

  const tokenDetails = useMemo(
    () => [
      {
        id: 1,
        title: t('Contract'),
        value: nftToken?.contract_package?.contract_package_hash
      },
      {
        id: 2,
        title: t('Collection'),
        value: nftToken?.contract_package?.contract_name,
        image: nftToken?.contract_package?.icon_url
      },
      {
        id: 3,
        title: t('Token ID'),
        value: nftToken?.token_id
      },
      {
        id: 4,
        title: t('Standard'),
        value: tokenStandard
      },
      {
        id: 5,
        title: t('Description'),
        value: metadataKeyValue?.description,
        longValue: true
      }
    ],
    [
      metadataKeyValue?.description,
      nftToken?.contract_package?.contract_name,
      nftToken?.contract_package?.contract_package_hash,
      nftToken?.contract_package?.icon_url,
      nftToken?.token_id,
      t,
      tokenStandard
    ]
  );

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{metadataKeyValue?.name}</Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Tile>
          <NftImageContainer>
            {!showMedia && (
              <NftImage
                style={{ display: loading ? 'none' : 'inline-block' }}
                src={cachedUrl || preview?.value}
                alt={metadataKeyValue?.name || ''}
                onLoad={() => {
                  setLoading(false);
                }}
                onError={() => {
                  if (isSafariExtension) {
                    setError(true);
                    setLoading(false);
                  } else {
                    setShowMedia(true);
                  }
                }}
              />
            )}
            {showMedia && (
              <Player
                style={{ display: loading ? 'none' : 'block' }}
                url={cachedUrl || preview?.value}
                controls={true}
                volume={0.5}
                width="auto"
                height="auto"
                onError={() => setError(true)}
                onReady={() => setLoading(false)}
              />
            )}
            {loading && !error && <LoadingMediaPlaceholder />}
            {error && <EmptyMediaPlaceholder />}
          </NftImageContainer>
        </Tile>
      </VerticalSpaceContainer>
      <List
        contentTop={SpacingSize.Medium}
        rows={tokenDetails}
        renderRow={token => (
          <Container
            wrap="wrap"
            gap={SpacingSize.Small}
            withIcon={!!token.image}
          >
            <Typography type="captionRegular" color="contentSecondary">
              {token.title}
            </Typography>
            {token.title === 'Contract' ? (
              <Hash
                value={token.value || ''}
                variant={HashVariant.CaptionHash}
                truncated
                color="contentPrimary"
              />
            ) : token.image ? (
              <AlignedFlexRow gap={SpacingSize.Small}>
                <Typography
                  type="captionRegular"
                  color="contentPrimary"
                  ellipsis
                >
                  {token.value}
                </Typography>
                <SvgIcon src={token.image} size={32} />
              </AlignedFlexRow>
            ) : (
              <Typography
                type="captionRegular"
                color="contentPrimary"
                ellipsis={!token.longValue}
              >
                {token.value}
              </Typography>
            )}
          </Container>
        )}
        marginLeftForItemSeparatorLine={16}
      />
    </ContentContainer>
  );
};
