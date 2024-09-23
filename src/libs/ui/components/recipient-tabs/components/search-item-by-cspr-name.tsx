import React from 'react';
import styled from 'styled-components';

import { useFetchAccountFromCsprName } from '@libs/services/account-info';
import { RecipientPlate, Spinner, Tile, Typography } from '@libs/ui/components';

interface SearchItemByCsprNameProps {
  inputValue: string;
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

const Container = styled.div`
  margin-top: 8px;
`;

const EmptyResultContainer = styled.div`
  padding: 16px;
`;

export const SearchItemByCsprName = ({
  inputValue,
  handleSelectRecipient
}: SearchItemByCsprNameProps) => {
  const { accountInfo, isLoading } = useFetchAccountFromCsprName(inputValue);

  const csprName = accountInfo?.csprName;
  const brandingLogo = accountInfo?.brandingLogo;
  const name = accountInfo?.name;
  const publicKey = accountInfo?.publicKey;

  return (
    <Container>
      {isLoading ? (
        <Spinner />
      ) : accountInfo ? (
        <RecipientPlate
          publicKey={publicKey!}
          brandingLogo={brandingLogo}
          name={name}
          csprName={csprName}
          handleClick={() => handleSelectRecipient(publicKey!, name || '')}
        />
      ) : (
        <Tile>
          <EmptyResultContainer>
            <Typography type="body" color="contentPrimary" textAlign="center">
              There is no account using this CSPR.name
            </Typography>
          </EmptyResultContainer>
        </Tile>
      )}
    </Container>
  );
};
