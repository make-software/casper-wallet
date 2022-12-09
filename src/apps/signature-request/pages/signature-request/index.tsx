import { DeployUtil } from 'casper-js-sdk';
import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  LayoutWindow,
  PopupHeader
} from '@libs/layout';
import { closeActiveWindow } from '@src/background/close-window';
import { selectDeploysJsonById } from '@src/background/redux/deploys/selectors';
import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccounts
} from '@src/background/redux/vault/selectors';
import { emitSdkEventToAllActiveTabs } from '@src/content/sdk-event';
import { sdkMessage } from '@src/content/sdk-message';
import { Button } from '@src/libs/ui';

import { SignatureRequestContent } from './signature-request-content';
import { signDeploy } from '@src/libs/crypto';

export function SignatureRequestPage() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

  if (!requestId || !signingPublicKeyHex) {
    throw Error('Missing search param');
  }

  const accounts = useSelector(selectVaultAccounts);
  const signingAccount = accounts.find(
    a => a.publicKey === signingPublicKeyHex
  );
  // signing account should exist in wallet
  if (signingAccount == null) {
    throw Error('No signing account');
  }

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesWithOrigin
  );
  // signing account should be connected to site
  if (!connectedAccountNames.includes(signingAccount.name)) {
    throw Error('Account with signingPublicKeyHex is not connected to site');
  }

  const deployJsonById = useSelector(selectDeploysJsonById);
  const deployJson = deployJsonById[requestId];
  if (deployJson == null) {
    throw Error('Deploy not found in state');
  }

  const res = DeployUtil.deployFromJson(deployJson);
  if (!res.ok) {
    throw Error('Deploy from json parsing error');
  }

  const deploy = res.val;

  const handleSign = useCallback(() => {
    const signature = signDeploy(
      deploy.hash,
      signingAccount.publicKey,
      signingAccount.secretKey
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ signature }, { requestId })
    );
    closeActiveWindow();
  }, [
    signingAccount?.publicKey,
    signingAccount?.secretKey,
    deploy.hash,
    requestId
  ]);

  return (
    <LayoutWindow
      variant="default"
      renderHeader={() => <PopupHeader withConnectionStatus />}
      renderContent={() => <SignatureRequestContent deploy={deploy} />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button color="primaryRed" onClick={handleSign}>
            <Trans t={t}>Sign</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={() => closeActiveWindow()}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
