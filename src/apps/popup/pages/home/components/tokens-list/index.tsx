import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';
import { useFetchErc20Tokens } from '@hooks/use-fetch-erc20-tokens';

import { SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { List, TokenPlate, Typography } from '@libs/ui/components';

import { formatErc20TokenBalance } from './utils';

const TotalValueContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;

  border-top-left-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const TokensList = () => {
  const [tokensList, setTokensList] = useState<TokenType[]>([]);
  const [totalAmountFiat, setTotalAmountFiat] = useState<string | null>(null);

  const casperToken = useCasperToken();
  const erc20Tokens = useFetchErc20Tokens();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  useEffect(() => {
    const erc20TokensList = formatErc20TokenBalance(erc20Tokens);

    const tokensList: TokenType[] = [];

    if (casperToken) {
      tokensList.push(casperToken);
      setTotalAmountFiat(casperToken.amountFiat);
    }

    if (erc20TokensList) {
      tokensList.push(...erc20TokensList);
    }

    setTokensList(tokensList);
  }, [casperToken, erc20Tokens]);

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo(0, 0);
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
