import React from 'react';
import { HeaderText } from '@src/libs/ui/components/header-text';
import { Text } from '@src/libs/ui/components/text';
import { Input } from '@src/libs/ui/components/input';
import { Button } from '@src/libs/ui/components/button';

import { Container, ButtonContainer } from './styled';

export function CreateVault() {
  return (
    <Container>
      <HeaderText size={2}>Create new vault</HeaderText>
      <div>
        <Text variation="darkGray">
          Please set a password for your vault. You will need it later to unlock
          it, so keep it safe.
        </Text>
      </div>

      {/* @ts-ignore */}
      <Input type="password" placeholder="Password" fullWidth />
      {/* @ts-ignore */}
      <Input type="password" placeholder="Confirm password" fullWidth />

      <ButtonContainer>
        <Button onClick={() => console.log('clicked')}>Create Vault</Button>
      </ButtonContainer>
    </Container>
  );
}
