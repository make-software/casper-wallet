import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CenteredFlexColumn, SpacingSize } from '@libs/layout';
import { ResponseCurrencyProps } from '@libs/services/buy-cspr-service/types';
import { Tile, Typography } from '@libs/ui/components';

const Container = styled.div`
  padding: 8px 16px;
`;

interface CurrencyRowProps {
  selectedCurrency: ResponseCurrencyProps;
  onClick: () => void;
}

export const CurrencyRow = ({
  selectedCurrency,
  onClick
}: CurrencyRowProps) => {
  const { t } = useTranslation();

  return (
    <CenteredFlexColumn gap={SpacingSize.Small} onClick={onClick}>
      <Typography type="bodySemiBold">
        <Trans t={t}>Currency</Trans>
      </Typography>
      <Tile borderRadius="base">
        <Container>
          <Typography
            type="bodySemiBold"
            color="contentAction"
            dataTestId="currency-row"
          >
            {selectedCurrency.code}
          </Typography>
        </Container>
      </Tile>
    </CenteredFlexColumn>
  );
};
