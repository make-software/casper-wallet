import React from 'react';
import styled from 'styled-components';

import { Typography, Input, Button } from '@src/libs/ui';
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

export function CreateVaultPageContent() {
  return (
    <Container>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          Create new vault
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          Please set a password for your vault. You will need it later to unlock
          it, so keep it safe.
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input type="password" placeholder="Password" />
        <Input type="password" placeholder="Confirm password" />
      </InputsContainer>
    </Container>
  );
}

export function CreateVaultPageFooter() {
  return (
    <ButtonsContainer>
      <Button onClick={() => console.log('clicked')}>Create Vault</Button>
    </ButtonsContainer>
  );
}
