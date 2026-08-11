import { INft } from 'casper-wallet-core/src/domain';
import React, { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountTrackingIdOfSentNftTokensRemoved } from '@background/redux/account-info/actions';
import { selectAccountTrackingIdOfSentNftTokens } from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  CenteredFlexColumn,
  CenteredFlexRow,
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchSingleDeploy } from '@libs/services/deploys/use-fetch-single-deploy';
import { useFetchDeriveMediaType } from '@libs/services/nft-service';
import {
  Button,
  EmptyMediaPlaceholder,
  Hash,
  HashVariant,
  List,
  LoadingMediaPlaceholder,
  Status,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';

import { NftTokenDetailIcon } from './nft-token-detail-icon';

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

const AudioNftContainer = styled(CenteredFlexRow)`
  width: 100%;
  height: 120px;

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

// Without an explicit width this column shrink-to-fits the 120px placeholder icon,
// which collapses the player's `width: 100%` to 120px — narrow enough that the
// browser drops the seek bar and timestamp from the native controls.
const AudioNftWrapper = styled(CenteredFlexColumn)`
  width: 100%;
`;

interface AudioPlayerProps {
  isDarkMode: boolean;
}

// NFT audio previews are arbitrary third-party media with no caption track
// available, so this player is intentionally rendered without one.
const AudioPlayer = styled.audio<AudioPlayerProps>`
  width: 100%;

  color-scheme: ${({ isDarkMode }) => (isDarkMode ? 'dark' : 'light')};

  &::-webkit-media-controls-panel {
    background-color: ${({ theme }) => theme.color.backgroundSecondary};
  }
`;

const Container = styled(AlignedSpaceBetweenFlexRow)<{ withIcon: boolean }>`
  padding: ${({ withIcon }) => (withIcon ? '14px 16px' : '18px 16px')};
`;

const ButtonsContainer = styled(CenteredFlexRow)`
  margin: 20px 0;
`;

const ButtonContainer = styled(CenteredFlexColumn)<{ disabled: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

// NFT video previews are arbitrary third-party media with no caption track
// available, so this player is intentionally rendered without one.
//
// A plain <video> rather than react-player: the only sources that reach this
// branch are ones deriveNftMediaType resolved to a `video/*` content type (it
// returns 'unknown' for anything else, which renders EmptyMediaPlaceholder
// instead). An HLS or DASH manifest is served as application/vnd.apple.mpegurl
// or application/dash+xml, and an embed page as text/html, so react-player's
// streaming and oEmbed players — dashjs, hls.js and @mux/mux-player-react,
// 1.8 MB of the package between them — were unreachable here (WALLET-1380).
const VideoPlayer = styled.video`
  max-width: 312px;
  max-height: 312px;
`;

// Half volume, as react-player was configured to play these at.
const PREVIEW_VOLUME = 0.5;

interface NftDetailsContentProps {
  nftToken: INft | null;
}

export const NftDetailsContent = ({
  nftToken: nftTokenParam
}: NftDetailsContentProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [nftToken] = useState(nftTokenParam);

  const accountTrackingIdOfSentNftTokens = useSelector(
    selectAccountTrackingIdOfSentNftTokens
  );

  const isButtonDisabled = Boolean(
    accountTrackingIdOfSentNftTokens[nftToken?.trackingId!]
  );

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const isDarkMode = useIsDarkMode();

  const preview = nftToken?.previewUrl;
  const cachedUrl = nftToken?.proxyPreviewUrl;
  const name = nftToken?.metadata.name;

  const { contentType, isLoadingMediaType } =
    useFetchDeriveMediaType(cachedUrl);

  const deployHash = accountTrackingIdOfSentNftTokens[nftToken?.trackingId!];

  const { deployData } = useFetchSingleDeploy(deployHash);

  if (deployData) {
    if (deployData.status !== Status.Pending) {
      dispatchToMainStore(
        accountTrackingIdOfSentNftTokensRemoved(nftToken?.trackingId!)
      );
    }
  }

  const tokenStandard = nftToken?.standard || '';

  const tokenDetails = useMemo(
    () => [
      {
        id: 1,
        title: t('Contract'),
        value: nftToken?.contractPackageHash
      },
      {
        id: 2,
        title: t('Collection'),
        value: nftToken?.contactName,
        image:
          nftToken?.contractPackageIcon || 'assets/icons/nft-contract-icon.svg'
      },
      {
        id: 3,
        title: t('Token ID'),
        value: nftToken?.tokenId
      },
      {
        id: 4,
        title: t('Standard'),
        value: tokenStandard
      },
      {
        id: 5,
        title: t('Description'),
        value: nftToken?.metadata?.description,
        longValue: true
      }
    ],
    [
      nftToken?.metadata?.description,
      nftToken?.contactName,
      nftToken?.contractPackageHash,
      nftToken?.contractPackageIcon,
      nftToken?.tokenId,
      t,
      tokenStandard
    ]
  );

  const onLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  // `volume` is a DOM property with no HTML attribute behind it, so React never
  // writes it from JSX — it has to be set on the element once it mounts.
  const applyPreviewVolume = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      node.volume = PREVIEW_VOLUME;
    }
  }, []);

  const isImage = contentType?.startsWith('image');
  const isVideo = contentType?.startsWith('video');
  const isAudio = contentType?.startsWith('audio');

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{name}</Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Tile>
          <NftImageContainer>
            {isImage && (
              <NftImage
                style={{ display: loading ? 'none' : 'inline-block' }}
                src={(cachedUrl || preview) as string}
                alt={name || ''}
                onLoad={onLoad}
                onError={onError}
              />
            )}
            {isVideo && (
              <CenteredFlexColumn>
                <VideoPlayer
                  style={{ display: loading ? 'none' : 'block' }}
                  src={(cachedUrl || preview) as string}
                  controls
                  ref={applyPreviewVolume}
                  onError={onError}
                  onCanPlay={onLoad}
                />
              </CenteredFlexColumn>
            )}
            {isAudio && (
              <AudioNftWrapper gap={SpacingSize.Small}>
                <AudioNftContainer>
                  <SvgIcon
                    src="assets/icons/audio-nft-placeholder.svg"
                    height={120}
                    width={120}
                  />
                </AudioNftContainer>
                <AudioPlayer
                  src={(cachedUrl || preview) as string}
                  controls
                  onCanPlay={onLoad}
                  onError={onError}
                  isDarkMode={isDarkMode}
                />
              </AudioNftWrapper>
            )}
            {((loading && !isAudio) || isLoadingMediaType) && !error && (
              <LoadingMediaPlaceholder />
            )}
            {(error || contentType === 'unknown') && <EmptyMediaPlaceholder />}
          </NftImageContainer>
        </Tile>
      </VerticalSpaceContainer>
      <List
        contentTop={SpacingSize.Medium}
        rows={tokenDetails}
        renderHeader={() => (
          <ButtonsContainer>
            <ButtonContainer
              gap={SpacingSize.Small}
              disabled={isButtonDisabled}
              onClick={() => {
                if (isButtonDisabled) return;

                navigate(
                  RouterPath.TransferNft.replace(
                    ':tokenId',
                    nftToken?.tokenId || ''
                  ).replace(
                    ':contractPackageHash',
                    nftToken?.contractPackageHash || ''
                  ),
                  {
                    state: {
                      nftData: { contentType, url: cachedUrl || preview }
                    }
                  }
                );
              }}
            >
              <Button circle disabled={isButtonDisabled}>
                <SvgIcon
                  src="assets/icons/transfer.svg"
                  color="contentOnFill"
                />
              </Button>
              <Typography
                type="captionMedium"
                color={isButtonDisabled ? 'contentDisabled' : 'contentAction'}
              >
                <Trans t={t}>Send</Trans>
              </Typography>
            </ButtonContainer>
          </ButtonsContainer>
        )}
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
                placement="bottomLeft"
              />
            ) : token.id === 3 && (token?.value?.length ?? 0) > 10 ? (
              <Hash
                value={token.value || ''}
                variant={HashVariant.CaptionHash}
                truncated
                color="contentPrimary"
                placement="bottomLeft"
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
                <NftTokenDetailIcon image={token.image} alt={token.value} />
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
