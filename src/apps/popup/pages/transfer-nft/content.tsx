import React, { useMemo, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getMetadataKeyValue, getNftTokenMetadataWithLinks } from '@src/utils';

import { useTypedLocation } from '@popup/router';

import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

import {
  AlignedFlexRow,
  ContentContainer,
  LeftAlignedFlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { NFTTokenResult } from '@libs/services/nft-service';
import {
  Input,
  RecipientDropdownInput,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui';
import {
  TransferNftAmountFormValues,
  TransferNftRecipientFormValues
} from '@libs/ui/forms/transfer-nft';
import { formatFiatAmount } from '@libs/ui/utils/formatters';

const Container = styled.div`
  padding: 16px;
`;

const NftImage = styled.img`
  height: 60px;
  width: 60px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

interface TransferNftContentProps {
  nftToken: NFTTokenResult | undefined;
  recipientForm: UseFormReturn<TransferNftRecipientFormValues>;
  amountForm: UseFormReturn<TransferNftAmountFormValues>;
  haveReverseOwnerLookUp: boolean;
}

export const TransferNftContent = ({
  nftToken,
  recipientForm,
  amountForm,
  haveReverseOwnerLookUp
}: TransferNftContentProps) => {
  const [recipientName, setRecipientName] = useState('');

  const { t } = useTranslation();
  const location = useTypedLocation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const { nftData } = location.state;

  const nftTokenMetadataWithLinks = useMemo(
    () => getNftTokenMetadataWithLinks(nftToken),
    [nftToken]
  );

  const metadataKeyValue = useMemo(
    () => getMetadataKeyValue(nftTokenMetadataWithLinks),
    [nftTokenMetadataWithLinks]
  );

  const {
    register,
    formState: { errors },
    control
  } = amountForm;

  const paymentAmount = useWatch({
    control,
    name: 'paymentAmount'
  });

  const paymentFiatAmount = formatFiatAmount(
    paymentAmount || '0',
    currencyRate
  );

  const isImage = nftData?.contentType?.startsWith('image');
  const isVideo = nftData?.contentType?.startsWith('video');
  const isAudio = nftData?.contentType?.startsWith('audio');

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Send NFT</Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.XXL}>
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
                <Typography type="subtitle">
                  {metadataKeyValue?.name}
                </Typography>
                <Typography type="captionRegular" color="contentSecondary">
                  {nftToken?.contract_package?.contract_name}
                </Typography>
              </LeftAlignedFlexColumn>
            </AlignedFlexRow>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
      {haveReverseOwnerLookUp && (
        <ParagraphContainer top={SpacingSize.Tiny}>
          <Typography type="listSubtext" color="contentActionCritical">
            <Trans t={t}>
              Sorry, but we don’t support the reverse look-up modality
            </Trans>
          </Typography>
        </ParagraphContainer>
      )}
      <RecipientDropdownInput
        recipientForm={recipientForm}
        recipientName={recipientName}
        setRecipientName={setRecipientName}
      />
      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={t('Transaction fee')}
          rightLabel={paymentFiatAmount}
          monotype
          placeholder={t('Enter transaction fee')}
          suffixText={'CSPR'}
          {...register('paymentAmount')}
          error={!!errors?.paymentAmount}
          validationText={
            errors?.paymentAmount?.message ||
            "You'll be charged this amount in CSPR as a transaction fee. You can change it at your discretion."
          }
        />
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
