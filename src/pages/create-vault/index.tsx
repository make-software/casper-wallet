import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Container>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          <Trans t={t}>Create new vault</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          <Trans t={t}>
            Please set a password for your vault. You will need it later to
            unlock it, so keep it safe.
          </Trans>
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input type="password" placeholder={t('Password')} />
        <Input type="password" placeholder={t('Confirm password')} />
      </InputsContainer>
    </Container>
  );
}

export function CreateVaultPageFooter() {
  const { t } = useTranslation();
  return (
    <ButtonsContainer>
      <Button onClick={() => console.log('clicked')}>
        <Trans t={t}>Create Vault</Trans>
      </Button>
    </ButtonsContainer>
  );
}
