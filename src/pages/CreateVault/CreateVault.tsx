import React from 'react';
import Header, { TitleLevel } from '@src/ui-kit/Title';
import Typography, {
  TypographyAlign,
  TypographyColor
} from '@src/ui-kit/Typography';
import TextField from '@src/ui-kit/TextField';
import Button, { ButtonColor } from '@src/ui-kit/Button';

import { Container, ButtonContainer } from './styled';

export function CreateVault() {
  return (
    <Container>
      <Header level={TitleLevel.h1}>Create new vault</Header>
      <Typography align={TypographyAlign.left} color={TypographyColor.second}>
        Please set a password for your vault. You will need it later to unlock
        it, so keep it safe.
      </Typography>

      <TextField type="password" placeholder="Password" fullWidth />
      <TextField type="password" placeholder="Confirm password" fullWidth />

      <ButtonContainer>
        <Button
          onClick={() => console.log('clicked')}
          color={ButtonColor.second}
          fullWidth
        >
          Create Vault
        </Button>
      </ButtonContainer>
    </Container>
  );
}
