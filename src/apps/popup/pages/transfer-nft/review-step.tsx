import { INft } from 'casper-wallet-core/src/domain';
import React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { Input, Typography } from '@libs/ui/components';
import { TransferNftAmountFormValues } from '@libs/ui/forms/transfer-nft';
import { formatFiatAmount, handleNumericInput } from '@libs/ui/utils';

import { NFTPlate } from './components/nft-plate';
import { NFTData } from './utils';

interface ReviewStepProps {
  nftToken: INft | undefined;
  haveReverseOwnerLookUp: boolean;
  amountForm: UseFormReturn<TransferNftAmountFormValues>;
  nftData?: NFTData;
}

export const ReviewStep = ({
  nftToken,
  haveReverseOwnerLookUp,
  amountForm,
  nftData
}: ReviewStepProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useFetchWalletBalance();

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
    currencyRate?.rate || null
  );

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Review details</Trans>
        </Typography>
      </ParagraphContainer>

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <NFTPlate nftToken={nftToken} nftData={nftData} />
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

      <VerticalSpaceContainer top={SpacingSize.XL}>
        <Input
          label={t('Transaction fee')}
          rightLabel={paymentFiatAmount}
          monotype
          type="number"
          placeholder={t('Enter transaction fee')}
          suffixText={'CSPR'}
          {...register('paymentAmount')}
          error={!!errors?.paymentAmount}
          onKeyDown={handleNumericInput}
          validationText={
            errors?.paymentAmount?.message ||
            "You'll be charged this amount in CSPR as a transaction fee. You can change it at your discretion."
          }
        />
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
