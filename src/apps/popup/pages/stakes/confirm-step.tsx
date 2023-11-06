import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Big from 'big.js';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { AmountContainer, List, Typography, ValidatorPlate } from '@libs/ui';
import {
  formatFiatAmount,
  formatNumber,
  motesToCSPR
} from '@libs/ui/utils/formatters';
import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';
import { ValidatorResult } from '@libs/services/validators-service/types';
import {
  AuctionManagerEntryPoint,
  getAuctionManagerDeployCost
} from '@libs/services/deployer-service';

export const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

interface ConfirmStepProps {
  inputAmountCSPR: string;
  validator: ValidatorResult | null;
  stakesType: AuctionManagerEntryPoint;
  headerText: string;
  confirmStepText: string;
}
export const ConfirmStep = ({
  inputAmountCSPR,
  validator,
  stakesType,
  headerText,
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
    .toString();

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

  const validatorLabel = t('To validator');

  if (!validator) {
    return null;
  }

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{headerText}</Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <ValidatorPlate
          publicKey={validator?.public_key}
          fee={validator.fee}
          name={validator?.account_info?.info?.owner?.name}
          logo={validator?.account_info?.info?.owner?.branding?.logo?.svg}
          delegatorsNumber={validator?.delegators_number}
          validatorLabel={validatorLabel}
          showFullPublicKey
        />
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
    </ContentContainer>
  );
};
