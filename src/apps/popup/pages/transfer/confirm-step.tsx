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
import {
  ActiveAccountPlate,
  AmountContainer,
  List,
  RecipientPlate,
  Typography
} from '@libs/ui';
import {
  formatFiatAmount,
  formatNumber,
  motesToCSPR
} from '@libs/ui/utils/formatters';
import { TRANSFER_COST_MOTES } from '@src/constants';
import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

export const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

interface ConfirmStepProps {
  recipientPublicKey: string;
  amountInCSPR: string;
}
export const ConfirmStep = ({
  recipientPublicKey,
  amountInCSPR
}: ConfirmStepProps) => {
  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const transferCostInCSPR = formatNumber(motesToCSPR(TRANSFER_COST_MOTES), {
    precision: { max: 5 }
  });
  const totalCSPR: string = Big(amountInCSPR)
    .add(transferCostInCSPR)
    .toString();

  const transactionDataRows = [
    {
      id: 1,
      text: t('Amount'),
      amount: formatNumber(amountInCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiatAmount(amountInCSPR, currencyRate)
    },
    {
      id: 2,
      text: t('Transaction fee'),
      amount: transferCostInCSPR,
      fiatPrice: formatFiatAmount(transferCostInCSPR, currencyRate, 3)
    },
    {
      id: 3,
      text: t('Total'),
      amount: formatNumber(totalCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiatAmount(totalCSPR, currencyRate),
      bold: true
    }
  ];

  const recipientLabel = t('To recipient');

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Confirm send</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate label="From" />
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <RecipientPlate
          recipientLabel={recipientLabel}
          publicKey={recipientPublicKey}
          showFullPublicKey
        />
      </VerticalSpaceContainer>
      <List
        contentTop={SpacingSize.XL}
        rows={transactionDataRows}
        renderRow={listItems => (
          <ListItemContainer key={listItems.id}>
            <Typography type="body" color="contentSecondary">
              {listItems.text}
            </Typography>
            <AmountContainer>
              <Typography type="captionHash">{`${listItems.amount} CSPR`}</Typography>
              <Typography type={listItems.bold ? 'subtitle' : 'captionMedium'}>
                {listItems.fiatPrice || 'API not available'}
              </Typography>
            </AmountContainer>
          </ListItemContainer>
        )}
        marginLeftForItemSeparatorLine={8}
      />
    </ContentContainer>
  );
};
