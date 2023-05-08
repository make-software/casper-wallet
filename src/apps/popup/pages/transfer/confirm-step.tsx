import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Big from 'big.js';

import {
  ContentContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  TransferInputContainer
} from '@libs/layout';
import { Input, List, Typography } from '@libs/ui';
import {
  AmountContainer,
  SenderDetails
} from '@popup/pages/transfer/sender-details';
import { truncateKey } from '@libs/ui/components/hash/utils';
import {
  formatFiat,
  formatNumber,
  motesToCSPR
} from '@libs/ui/utils/formatters';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { TRANSFER_COST_MOTES } from '@src/constants';

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

  const { currencyRate } = useActiveAccountBalance();

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
      fiatPrice: formatFiat(amountInCSPR, currencyRate)
    },
    {
      id: 2,
      text: t('Transaction fee'),
      amount: transferCostInCSPR,
      fiatPrice: formatFiat(transferCostInCSPR, currencyRate)
    },
    {
      id: 3,
      text: t('Total'),
      amount: formatNumber(totalCSPR, {
        precision: { max: 5 }
      }),
      fiatPrice: formatFiat(totalCSPR, currencyRate),
      bold: true
    }
  ];

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Confirm send</Trans>
        </Typography>
      </ParagraphContainer>
      <SenderDetails />
      <ParagraphContainer top={SpacingSize.XXXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>To recipient</Trans>
        </Typography>
      </ParagraphContainer>
      <TransferInputContainer>
        <Input
          monotype
          readOnly
          value={truncateKey(recipientPublicKey, { size: 'max' })}
        />
      </TransferInputContainer>
      <List
        contentTop={SpacingSize.XXXL}
        rows={transactionDataRows}
        renderRow={listItems => (
          <ListItemContainer key={listItems.id}>
            <Typography type="body" color="contentSecondary">
              {listItems.text}
            </Typography>
            <AmountContainer>
              <Typography type="captionHash">{`${listItems.amount} CSPR`}</Typography>
              <Typography
                type={listItems.bold ? 'bodySemiBold' : 'captionMedium'}
              >
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