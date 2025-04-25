import { INft } from 'casper-wallet-core/src/domain';
import React, { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ReactPlayer from 'react-player';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountTrackingIdOfSentNftTokensRemoved } from '@background/redux/account-info/actions';
import { selectAccountTrackingIdOfSentNftTokens } from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

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

const Container = styled(AlignedSpaceBetweenFlexRow)<{ withIcon: boolean }>`
  padding: ${({ withIcon }) => (withIcon ? '14px 16px' : '18px 16px')};
`;

const ButtonsContainer = styled(CenteredFlexRow)`
  margin: 20px 0;
`;

const ButtonContainer = styled(CenteredFlexColumn)<{ disabled: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
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
            {(isAudio || isVideo) && (
              <CenteredFlexColumn>
                {isAudio && (
                  <AudioNftContainer>
                    <SvgIcon
                      src="assets/icons/audio-nft-placeholder.svg"
                      height={120}
                      width={120}
                    />
                  </AudioNftContainer>
                )}
                <Player
                  style={
                    isVideo
                      ? { display: loading ? 'none' : 'block' }
                      : undefined
                  }
                  url={cachedUrl || preview}
                  controls={true}
                  volume={0.5}
                  width={isVideo ? 'auto' : undefined}
                  height={isVideo ? 'auto' : 70}
                  onError={onError}
                  onReady={onLoad}
                  config={{ file: { forceAudio: isAudio } }}
                />
              </CenteredFlexColumn>
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
