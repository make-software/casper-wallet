import React from 'react';
import styled from 'styled-components';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { RecipientPlate } from '@libs/ui/components';

interface SearchItemProps {
  inputValue: string;
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

const Container = styled.div`
  margin-top: 8px;

  cursor: pointer;
`;

export const SearchItemByPublicKey = ({
  inputValue,
  handleSelectRecipient
}: SearchItemProps) => {
  const accountsInfo = useFetchAccountsInfo([inputValue]);

  const accountHash = getAccountHashFromPublicKey(inputValue);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;
  const name = accountsInfo && accountsInfo[accountHash]?.name;

  return (
    <Container>
      <RecipientPlate
        publicKey={inputValue}
        brandingLogo={brandingLogo}
        name={name}
        csprName={csprName}
        handleClick={() => handleSelectRecipient(inputValue, name || '')}
      />
    </Container>
  );
};
