import Big from 'big.js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { AuctionManagerEntryPoint } from '@src/constants';

import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

import {
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { getAuctionManagerDeployCost } from '@libs/services/deployer-service';
import { ValidatorResult } from '@libs/services/validators-service/types';
import {
  AmountContainer,
  List,
  Typography,
  ValidatorPlate
} from '@libs/ui/components';
import { formatFiatAmount, formatNumber, motesToCSPR } from '@libs/ui/utils';

export const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

interface ConfirmStepProps {
  inputAmountCSPR: string;
  validator: ValidatorResult | null;
  newValidator: ValidatorResult | null;
  stakesType: AuctionManagerEntryPoint;
  confirmStepText: string;
}
export const ConfirmStep = ({
  inputAmountCSPR,
  validator,
  newValidator,
  stakesType,
  confirmStepText
}: ConfirmStepProps) => {
  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const transferFeeMotes = getAuctionManagerDeployCost(stakesType);

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
      fiatPrice: formatFiatAmount(inputAmountCSPR, currencyRate),
      symbol: 'CSPR'
    },
    {
      id: 2,
      text: t('Transaction fee'),
      amount: transferCostInCSPR,
      fiatPrice: formatFiatAmount(transferCostInCSPR, currencyRate, 3),
      symbol: 'CSPR'
    },
    {
      id: 3,
      text: t('Total'),
      amount: formatNumber(totalCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiatAmount(totalCSPR, currencyRate),
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
          publicKey={validator?.public_key}
          fee={validator.fee}
          name={validator?.account_info?.info?.owner?.name}
          logo={
            validator?.account_info?.info?.owner?.branding?.logo?.svg ||
            validator?.account_info?.info?.owner?.branding?.logo?.png_256 ||
            validator?.account_info?.info?.owner?.branding?.logo?.png_1024
          }
          delegatorsNumber={validator?.delegators_number}
          validatorLabel={
            stakesType === AuctionManagerEntryPoint.redelegate
              ? t('From validator')
              : t('To validator')
          }
          showFullPublicKey
        />

        {newValidator && (
          <VerticalSpaceContainer top={SpacingSize.XL}>
            <ValidatorPlate
              publicKey={newValidator?.public_key}
              fee={newValidator.fee}
              name={newValidator?.account_info?.info?.owner?.name}
              logo={
                newValidator?.account_info?.info?.owner?.branding?.logo?.svg ||
                newValidator?.account_info?.info?.owner?.branding?.logo
                  ?.png_256 ||
                newValidator?.account_info?.info?.owner?.branding?.logo
                  ?.png_1024
              }
              delegatorsNumber={newValidator?.delegators_number}
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
