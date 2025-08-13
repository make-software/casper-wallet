import Big from 'big.js';
import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import { SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';
import { List, TokenPlate, Typography } from '@libs/ui/components';
import { formatCurrency } from '@libs/ui/utils';

import { formatCep18Tokens } from './utils';

const TotalValueContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;

  border-top-left-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const TokensList = () => {
  const casperToken = useCasperToken();
  const { cep18Tokens } = useFetchCep18Tokens();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const tokensList: TokenType[] = [
    ...(casperToken ? [casperToken] : []),
    ...(formatCep18Tokens(cep18Tokens) ?? [])
  ];

  const totalAmountFiat = formatCurrency(
    tokensList
      .reduce((acc, cur) => acc.add(cur.amountFiatDecimal || 0), Big(0))
      .toFixed(),
    'USD',
    {
      precision: 2
    }
  );

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  return (
    <List
      contentTop={SpacingSize.None}
      rows={tokensList}
      stickyHeader
      renderHeader={() => (
        <TotalValueContainer>
          <SpaceBetweenFlexRow>
            <Typography type="body">
              <Trans t={t}>Total value</Trans>
            </Typography>
            <Typography type="bodySemiBold">{totalAmountFiat}</Typography>
          </SpaceBetweenFlexRow>
        </TotalValueContainer>
      )}
      renderRow={token => (
        <TokenPlate
          key={token.id}
          token={token}
          chevron
          handleOnClick={() =>
            navigate(RouterPath.Token.replace(':tokenName', token.id), {
              state: { tokenData: token }
            })
          }
        />
      )}
      marginLeftForItemSeparatorLine={56}
      marginLeftForHeaderSeparatorLine={0}
    />
  );
};
