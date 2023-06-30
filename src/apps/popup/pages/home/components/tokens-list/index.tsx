import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { List, Typography, TokenPlate } from '@libs/ui';
import { SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { TokenType, useCasperToken } from '@src/hooks';

const TotalValueContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;

  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const TokensList = () => {
  const [tokensList, setTokensList] = useState<TokenType[]>([]);
  const [totalAmountFiat, setTotalAmountFiat] = useState<string | null>(null);

  const casperToken = useCasperToken();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  useEffect(() => {
    // TODO: update token list and total amount for ERC20 tokens
    if (casperToken) {
      setTokensList([casperToken]);
      setTotalAmountFiat(casperToken.amountFiat);
    }
  }, [casperToken]);

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
            navigate(RouterPath.Token.replace(':tokenName', token.name))
          }
        />
      )}
      marginLeftForItemSeparatorLine={56}
      marginLeftForHeaderSeparatorLine={16}
    />
  );
};
