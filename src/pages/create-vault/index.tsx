import React from 'react';
import styled from 'styled-components';

import { HeaderText } from '@src/libs/ui/components/header-text';
import { Text } from '@src/libs/ui/components/text';
import { Input } from '@src/libs/ui/components/input';
import { Button } from '@src/libs/ui/components/button';

import { ButtonContainer } from '@src/shared/components/buttons-container';

const BaseContainer = styled.div`
  padding: 0 ${props => props.theme.padding[1.333]};
`;

const Container = styled.div`
  height: 100%;
  min-height: 488px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const HeaderTextContainer = styled(BaseContainer)`
  margin-top: 144px;
  margin-bottom: 16px;
`;

const TextContainer = styled(BaseContainer)`
  margin-bottom: 24px;
`;

const InputContainer = styled(BaseContainer)`
  margin-bottom: 16px;
`;

export function CreateVault() {
  return (
    <Container>
      <div>
        <HeaderTextContainer>
          <HeaderText size={2}>Create new vault</HeaderText>
        </HeaderTextContainer>

        <TextContainer>
          <Text variation="darkGray">
            Please set a password for your vault. You will need it later to
            unlock it, so keep it safe.
          </Text>
        </TextContainer>
        <InputContainer>
          <Input type="password" placeholder="Password" />
        </InputContainer>

        <InputContainer>
          <Input type="password" placeholder="Confirm password" />
        </InputContainer>
      </div>

      <ButtonContainer>
        <Button onClick={() => console.log('clicked')}>Create Vault</Button>
      </ButtonContainer>
    </Container>
  );
}
