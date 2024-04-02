import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import {
  ResponseCountryPropsWithId,
  ResponseCurrencyProps
} from '@libs/services/buy-cspr-service/types';
import { Checkbox, Typography } from '@libs/ui/components';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;

  cursor: pointer;
`;

interface ListRowProps {
  country?: ResponseCountryPropsWithId;
  handleSelect: (e: React.MouseEvent<Element, MouseEvent>) => void;
  isSelected: boolean;
  currency?: ResponseCurrencyProps;
}

export const ListRow = ({
  country,
  handleSelect,
  isSelected,
  currency
}: ListRowProps) => {
  const [iconSrc, setIconSrc] = useState('');

  // We don't add a dependency array here because after the user filters the country list, country flags don't download
  //  eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (country?.code) {
      setIconSrc(
        `https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.code}.svg`
      );
    }
  });

  const handleError = () => {
    setIconSrc('/assets/icons/placeholder-image-gray.svg');
  };

  return (
    <Container onClick={handleSelect}>
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {country && (
          <>
            <img
              alt={`${country.name}`}
              src={iconSrc}
              width="24"
              height="18"
              onError={handleError}
            />
            <Typography type="body">{country.name}</Typography>
          </>
        )}
        {currency && (
          <Typography type="body" color="contentSecondary">
            {currency.code}
          </Typography>
        )}
      </AlignedFlexRow>
      <Checkbox checked={isSelected} />
    </Container>
  );
};
