import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { NFTTokenResult } from '@libs/services/nft-service';
import { RecipientPlate, Typography } from '@libs/ui/components';
import { TransactionFeePlate } from '@libs/ui/components/transaction-fee-plate/transaction-fee-plate';

import { NFTPlate } from './components/nft-plate';
import { NFTData } from './utils';

interface ConfirmStepProps {
  nftData?: NFTData;
  nftToken: NFTTokenResult | undefined;
  recipientPublicKey: string;
  recipientName: string;
  paymentAmount: string;
}

export const ConfirmStep = ({
  nftData,
  nftToken,
  recipientPublicKey,
  recipientName,
  paymentAmount
}: ConfirmStepProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Confirm sending</Trans>
        </Typography>
      </ParagraphContainer>

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <NFTPlate nftToken={nftToken} nftData={nftData} />
      </VerticalSpaceContainer>

      <VerticalSpaceContainer top={SpacingSize.XL}>
        <RecipientPlate
          recipientLabel={t('To recipient')}
          publicKey={recipientPublicKey}
          showFullPublicKey
          name={recipientName}
        />
      </VerticalSpaceContainer>

      <VerticalSpaceContainer top={SpacingSize.XL}>
        <TransactionFeePlate paymentAmount={paymentAmount} />
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
