import { DeployUtil } from 'casper-js-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CasperDeploy } from './types';
import { convertBytesToHex } from '@src/libs/crypto/utils';

export function SignatureRequestPage() {
  const { t } = useTranslation();

  const [deploy, setDeploy] = useState<undefined | CasperDeploy>(undefined);

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

  if (!requestId || !signingPublicKeyHex) {
    const error = Error('Missing search param');
    throw error;
  }

  const renderDeps = [requestId, signingPublicKeyHex];

  const vaultAccounts = useSelector(selectVaultAccounts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => vaultAccounts, renderDeps);

  const connectedAccountNamesWithOrigin = useSelector(
    selectConnectedAccountNamesWithOrigin
  );
  const connectedAccountNames = useMemo(
    () => connectedAccountNamesWithOrigin,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    renderDeps
  );

  const deployJsonById = useSelector(selectDeploysJsonById);
  useEffect(() => {
    const deployJson = deployJsonById[requestId];
    if (deployJson == null) {
      return;
    }

    const res = DeployUtil.deployFromJson(deployJson);
    if (!res.ok) {
      const error = Error('Parsing deploy from json error');
      emitSdkEventToAllActiveTabs(sdkMessage.signError(error, { requestId }));
      throw error;
    }

    setDeploy(res.val);

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, renderDeps);

  const signingAccount = accounts.find(
    a => a.publicKey === signingPublicKeyHex
  );
  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error('No signing account');
    emitSdkEventToAllActiveTabs(sdkMessage.signError(error, { requestId }));
    throw error;
  }

  // signing account should be connected to site
  if (!connectedAccountNames.includes(signingAccount.name)) {
    const error = Error(
      'Account with signingPublicKeyHex is not connected to site'
    );
    emitSdkEventToAllActiveTabs(sdkMessage.signError(error, { requestId }));
    throw error;
  }

  const handleSign = useCallback(() => {
    if (deploy?.hash == null) {
      return;
    }

    const signature = signDeploy(
      deploy.hash,
      signingAccount.publicKey,
      signingAccount.secretKey
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      )
    );
    closeActiveWindow();
  }, [
    signingAccount?.publicKey,
    signingAccount?.secretKey,
    deploy?.hash,
    requestId
  ]);

  const handleCancel = useCallback(() => {
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ cancelled: true }, { requestId })
    );
    closeActiveWindow();
  }, [requestId]);

  return (
    <LayoutWindow
      variant="default"
      renderHeader={() => <PopupHeader withConnectionStatus />}
      renderContent={() => <SignatureRequestContent deploy={deploy} />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryRed"
            disabled={deploy == null}
            onClick={handleSign}
          >
            <Trans t={t}>Sign</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={handleCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
