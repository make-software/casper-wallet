import Big from 'big.js';
import { formatFiatAmount, formatNumber } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { TRANSFER_COST_MOTES } from '@src/constants';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AmountContainer,
  ContentContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import {
  ActiveAccountPlate,
  List,
  RecipientPlate,
  Typography
} from '@libs/ui/components';
import { motesToCSPR } from '@libs/ui/utils';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

interface ConfirmStepProps {
  recipientPublicKey: string;
  amount: string;
  balance: string | undefined;
  symbol: string | null;
  isErc20Transfer: boolean;
  paymentAmount: string;
  recipientName?: string;
  tokenPrice?: string | null;
}
export const ConfirmStep = ({
  recipientPublicKey,
  amount,
  balance,
  symbol,
  isErc20Transfer,
  paymentAmount,
  recipientName,
  tokenPrice
}: ConfirmStepProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useFetchWalletBalance();
  const accountsInfo = useFetchAccountsInfo([recipientPublicKey]);

  const accountHash = getAccountHashFromPublicKey(recipientPublicKey);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  let transactionDataRows;

  if (!isErc20Transfer) {
    const transferCostInCSPR = formatNumber(motesToCSPR(TRANSFER_COST_MOTES), {
      precision: { max: 5 }
    });
    const totalCSPR: string = Big(amount).add(transferCostInCSPR).toFixed();

    transactionDataRows = [
      {
        id: 1,
        text: t('Amount'),
        amount: formatNumber(amount, {
          precision: { max: 5 }
        }),
        fiatPrice: currencyRate?.rate
          ? formatFiatAmount(currencyRate.rate, amount)
          : null,
        symbol
      },
      {
        id: 2,
        text: t('Transaction payment'),
        amount: transferCostInCSPR,
        fiatPrice: currencyRate?.rate
          ? formatFiatAmount(currencyRate.rate, transferCostInCSPR, 3)
          : null,
        symbol
      },
      {
        id: 3,
        text: t('Total'),
        amount: formatNumber(totalCSPR, {
          precision: { max: 5 }
        }),
        fiatPrice: currencyRate?.rate
          ? formatFiatAmount(currencyRate.rate, totalCSPR)
          : null,
        symbol,
        bold: true
      }
    ];
  } else {
    transactionDataRows = [
      {
        id: 1,
        text: t('Amount'),
        amount: formatNumber(amount, {
          precision: { max: 5 }
        }),
        fiatPrice: tokenPrice
          ? formatFiatAmount(Number(tokenPrice), amount)
          : null,
        symbol
      },
      {
        id: 2,
        text: t('Transaction payment'),
        amount: formatNumber(paymentAmount, {
          precision: { max: 5 }
        }),
        fiatPrice: currencyRate?.rate
          ? formatFiatAmount(currencyRate.rate, paymentAmount, 3)
          : null,
        symbol: 'CSPR'
      }
    ];
  }

  const recipientLabel = t('To recipient');

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Confirm sending</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate label="From" symbol={symbol} balance={balance} />
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <RecipientPlate
          recipientLabel={recipientLabel}
          publicKey={recipientPublicKey}
          showFullPublicKey
          name={recipientName}
          csprName={csprName}
          brandingLogo={brandingLogo}
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
              <Typography type="captionHash">{`${listItems.amount} ${listItems?.symbol}`}</Typography>
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
