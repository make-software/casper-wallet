import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { ResponseCountryPropsWithId } from '@libs/services/buy-cspr-service/types';
import { Tile, Typography } from '@libs/ui/components';

const Container = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const RowContainer = styled(FlexColumn)`
  width: 100%;
`;

interface CountryRowProps {
  country: ResponseCountryPropsWithId;
  onClick: () => void;
}

export const CountryRow = ({ country, onClick }: CountryRowProps) => {
  const [iconSrc, setIconSrc] = useState('');

  const { t } = useTranslation();

  useEffect(() => {
    if (country.code) {
      setIconSrc(
        `https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.code}.svg`
      );
    }
  }, [country.code]);

  const handleError = () => {
    setIconSrc('/assets/icons/placeholder-image-gray.svg');
  };

  return (
    <RowContainer gap={SpacingSize.Small} onClick={onClick}>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>Country</Trans>
        </Typography>
      </ParagraphContainer>

      <Tile>
        <Container gap={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Large} flexGrow={1}>
            <img
              alt={`${country.name}`}
              src={iconSrc}
              width="24"
              height="18"
              onError={handleError}
            />
            <Typography
              type="body"
              loading={!country.name}
              dataTestId="country-row"
            >
              {country.name}
            </Typography>
          </AlignedFlexRow>
          <Typography type="bodySemiBold" color="contentAction">
            <Trans t={t}>Change</Trans>
          </Typography>
        </Container>
      </Tile>
    </RowContainer>
  );
};
