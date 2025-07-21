import Big from 'big.js';
import { formatNumber } from 'casper-wallet-core';
import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AuctionManagerEntryPoint } from '@src/constants';

import {
  AmountContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { getAuctionManagerDeployCost } from '@libs/services/deployer-service';
import { List, Typography, ValidatorPlate } from '@libs/ui/components';
import { formatFiatAmount, motesToCSPR } from '@libs/ui/utils';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

interface ConfirmStepProps {
  inputAmountCSPR: string;
  validator: ValidatorDto | null;
  newValidator: ValidatorDto | null;
  stakeType: AuctionManagerEntryPoint;
  confirmStepText: string;
}
export const ConfirmStep = ({
  inputAmountCSPR,
  validator,
  newValidator,
  stakeType,
  confirmStepText
}: ConfirmStepProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useFetchWalletBalance();

  const transferFeeMotes = getAuctionManagerDeployCost(stakeType);

  const transferCostInCSPR = formatNumber(motesToCSPR(transferFeeMotes), {
    precision: { max: 5 }
  });
  const totalCSPR: string = Big(inputAmountCSPR)
    .add(transferCostInCSPR)
    .toFixed();

  const transactionDataRows = [
    {
      id: 1,
      text: confirmStepText,
      amount: formatNumber(inputAmountCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiatAmount(inputAmountCSPR, currencyRate?.rate || null),
      symbol: 'CSPR'
    },
    {
      id: 2,
      text: t('Transaction payment'),
      amount: transferCostInCSPR,
      fiatPrice: formatFiatAmount(
        transferCostInCSPR,
        currencyRate?.rate || null,
        3
      ),
      symbol: 'CSPR'
    },
    {
      id: 3,
      text: t('Total'),
      amount: formatNumber(totalCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiatAmount(totalCSPR, currencyRate?.rate || null),
      symbol: 'CSPR',
      bold: true
    }
  ];

  if (!validator) {
    return null;
  }

  return (
    <>
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <ValidatorPlate
          minAmount={validator.minAmount}
          reservedSlots={validator.reservedSlots}
          publicKey={validator?.publicKey}
          fee={validator.fee}
          name={validator?.name}
          logo={validator?.svgLogo || validator?.imgLogo}
          delegatorsNumber={validator?.delegatorsNumber}
          validatorLabel={
            stakeType === AuctionManagerEntryPoint.delegate
              ? t('To validator')
              : t('From validator')
          }
          showFullPublicKey
        />

        {newValidator && (
          <VerticalSpaceContainer top={SpacingSize.XL}>
            <ValidatorPlate
              minAmount={newValidator.minAmount}
              reservedSlots={newValidator.reservedSlots}
              publicKey={newValidator?.publicKey}
              fee={newValidator.fee}
              name={newValidator?.name}
              logo={newValidator?.svgLogo || newValidator?.imgLogo}
              delegatorsNumber={newValidator?.delegatorsNumber}
              validatorLabel={t('To validator')}
              showFullPublicKey
            />
          </VerticalSpaceContainer>
        )}
      </VerticalSpaceContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="bodySemiBold">{t('Amount and fee')}</Typography>
      </ParagraphContainer>
      <List
        contentTop={SpacingSize.Small}
        rows={transactionDataRows}
        renderRow={listItems => (
          <ListItemContainer key={listItems.id}>
            <Typography type="body" color="contentSecondary">
              {listItems.text}
            </Typography>
            <AmountContainer>
              <Typography type="captionHash">{`${listItems.amount} ${listItems.symbol}`}</Typography>
              <Typography type={listItems.bold ? 'subtitle' : 'captionMedium'}>
                {listItems.fiatPrice == null
                  ? null
                  : listItems.fiatPrice || 'Not available'}
              </Typography>
            </AmountContainer>
          </ListItemContainer>
        )}
        marginLeftForItemSeparatorLine={8}
      />
    </>
  );
};
