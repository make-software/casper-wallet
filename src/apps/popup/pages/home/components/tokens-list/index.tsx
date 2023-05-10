import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { List, SvgIcon, Typography } from '@libs/ui';
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  RightAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';

const TotalValueContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

const ListItemContainer = styled(AlignedSpaceBetweenFlexRow)`
  cursor: pointer;
  padding: 10px 12px 10px 16px;
`;

const NameContainer = styled(AlignedFlexRow)`
  flex-grow: 1;
`;

type Token = {
  id: number;
  name: string;
  amountMotes: string | null;
  amountFiat: string | null;
  symbol: string;
  icon: string;
};

export const TokensList = () => {
  const [casperToken, setCasperToken] = useState<Token | null>(null);
  const [tokensList, setTokensList] = useState<Token[]>([]);
  const [totalAmountFiat, setTotalAmountFiat] = useState<string | null>(null);

  const { t } = useTranslation();
  const { balance } = useActiveAccountBalance();

  useEffect(() => {
    setCasperToken({
      id: 1,
      name: 'Casper',
      amountMotes: balance.amountMotes,
      amountFiat: balance.amountFiat,
      symbol: 'CSPR',
      icon: '/assets/illustrations/casper.svg'
    });
  }, [balance]);

  useEffect(() => {
    if (casperToken) {
      setTokensList([casperToken]);
      setTotalAmountFiat(casperToken.amountFiat);
    }
  }, [casperToken]);

  return (
    <List
      contentTop={SpacingSize.Medium}
      rows={tokensList}
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
      renderRow={({ name, icon, id, amountFiat, symbol, amountMotes }) => (
        <ListItemContainer key={id} gap={SpacingSize.Small}>
          <NameContainer gap={SpacingSize.Medium}>
            <SvgIcon src={icon} size={32} />
            <Typography type="body">{name}</Typography>
          </NameContainer>
          <RightAlignedFlexColumn>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="bodyHash">
                {amountMotes == null
                  ? '-'
                  : formatNumber(motesToCSPR(amountMotes))}
              </Typography>
              <Typography type="bodyHash" color="contentSecondary">
                {symbol}
              </Typography>
            </AlignedFlexRow>
            <Typography type="listSubtext" color="contentSecondary">
              {amountFiat}
            </Typography>
          </RightAlignedFlexColumn>
          <SvgIcon src="assets/icons/chevron.svg" size={16} />
        </ListItemContainer>
      )}
      marginLeftForItemSeparatorLine={56}
      marginLeftForHeaderSeparatorLine={16}
    />
  );
};
