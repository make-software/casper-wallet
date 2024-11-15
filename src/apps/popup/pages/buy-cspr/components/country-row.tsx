import { IOnRampCountry } from 'casper-wallet-core/src/domain';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { Spinner, Tile, Typography } from '@libs/ui/components';

const Container = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const RowContainer = styled(FlexColumn)`
  width: 100%;
`;

interface CountryRowProps {
  country: IOnRampCountry;
  onClick: () => void;
  isLoadingOnRampCountriesAndCurrencies: boolean;
}

export const CountryRow = ({
  country,
  onClick,
  isLoadingOnRampCountriesAndCurrencies
}: CountryRowProps) => {
  const { t } = useTranslation();

  return (
    <RowContainer
      gap={SpacingSize.Small}
      onClick={isLoadingOnRampCountriesAndCurrencies ? undefined : onClick}
    >
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>Country</Trans>
        </Typography>
      </ParagraphContainer>

      <Tile>
        <Container gap={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Large} flexGrow={1}>
            {isLoadingOnRampCountriesAndCurrencies ? (
              <Spinner style={{ margin: '10px 0' }} />
            ) : (
              <>
                <img
                  alt={`${country?.name}`}
                  src={country?.flagUri}
                  width="24"
                  height="18"
                />
                <Typography
                  type="body"
                  loading={!country?.name}
                  dataTestId="country-row"
                >
                  {country?.name}
                </Typography>
              </>
            )}
          </AlignedFlexRow>
          {isLoadingOnRampCountriesAndCurrencies ? null : (
            <Typography type="bodySemiBold" color="contentAction">
              <Trans t={t}>Change</Trans>
            </Typography>
          )}
        </Container>
      </Tile>
    </RowContainer>
  );
};
