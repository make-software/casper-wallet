import React from 'react';
import styled from 'styled-components';

import { HeaderText, Text, Input, Button } from '@src/libs/ui';
import { ButtonsContainer } from '@src/layout/buttons-container';

const Container = styled.div`
  height: 454px;
`;

const HeaderTextContainer = styled.div`
  margin-top: 144px;
`;

const TextContainer = styled.div`
  margin-top: 16px;
`;

const InputsContainer = styled.div`
  margin-top: 24px;
  & > div:nth-child(2) {
    margin-top: 16px;
  }
`;

function CreateVaultPageContent() {
  return (
    <Container>
      <HeaderTextContainer>
        <HeaderText size={2}>Create new vault</HeaderText>
      </HeaderTextContainer>

      <TextContainer>
        <Text variation="darkGray">
          Please set a password for your vault. You will need it later to unlock
          it, so keep it safe.
        </Text>
      </TextContainer>
      <InputsContainer>
        <Input type="password" placeholder="Password" />
        <Input type="password" placeholder="Confirm password" />
      </InputsContainer>
    </Container>
  );
}

function CreateVaultPageFooter() {
  return (
    <ButtonsContainer>
      <Button onClick={() => console.log('clicked')}>Create Vault</Button>
    </ButtonsContainer>
  );
}

export function useCreateVaultComponents() {
  return {
    CreateVaultPageContent,
    CreateVaultPageFooter
  };
}
