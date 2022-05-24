import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Button } from '@libs/ui';
import { createAccount as createAccountAction } from '@libs/redux/vault/actions';
import { RouterPath } from '@popup/router';

import {
  ButtonsContainer,
  HeaderTextContainer,
  TextContainer,
  ContentContainer
} from '@src/layout/containers';

export function NoAccountsPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function createAccount() {
    // TODO: Implement `create account with mnemonic phrase` feature
    dispatch(
      createAccountAction({
        name: 'First Account',
        keyPair: {
          publicKey: {
            isCLValue: true,
            data: {
              '0': 3,
              '1': 115,
              '2': 9,
              '3': 140,
              '4': 242,
              '5': 121,
              '6': 245,
              '7': 91,
              '8': 80,
              '9': 26,
              '10': 22,
              '11': 100,
              '12': 46,
              '13': 24,
              '14': 236,
              '15': 254,
              '16': 70,
              '17': 145,
              '18': 206,
              '19': 121,
              '20': 82,
              '21': 19,
              '22': 6,
              '23': 15,
              '24': 40,
              '25': 200,
              '26': 107,
              '27': 244,
              '28': 133,
              '29': 241,
              '30': 101,
              '31': 40,
              '32': 218
            },
            tag: 2
          },
          privateKey: {
            type: 'Buffer',
            data: [
              157, 102, 236, 10, 74, 39, 169, 229, 142, 121, 61, 82, 245, 201,
              97, 200, 89, 91, 228, 119, 205, 229, 185, 100, 181, 214, 91, 36,
              41, 138, 230, 161
            ]
          },
          signatureAlgorithm: 'secp256k1'
        } as any,
        isBackedUp: false
      })
    );
    navigate(RouterPath.Home);
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          <Trans t={t}>Your vault is ready, but no accounts yet</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            Please, create an account or import an account you already have.
          </Trans>
        </Typography>
      </TextContainer>
      <ButtonsContainer>
        <Button onClick={createAccount}>
          <Trans t={t}>Create account</Trans>
        </Button>
        <Button
          color="secondaryBlue"
          onClick={() => navigate(RouterPath.ImportAccount)}
        >
          <Trans t={t}>Import account</Trans>
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}
