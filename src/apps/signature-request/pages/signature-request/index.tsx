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
import { selectVaultActiveAccount } from '@src/background/redux/vault/selectors';
import { emitSdkEventToAllActiveTabs } from '@src/content/sdk-event';
import { sdkMessage } from '@src/content/sdk-message';
import { Button } from '@src/libs/ui';

import { signDeploy } from './sign-deploy';
import { SignatureRequestContent } from './signature-request-content';

export function SignatureRequestPage() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw Error('Missing search param');
  }

  const activeAccount = useSelector(selectVaultActiveAccount);
  if (activeAccount?.publicKey == null) {
    throw Error('No active account');
  }

  const deployJsonById = useSelector(selectDeploysJsonById);
  const deployJson = deployJsonById[requestId];
  const res = DeployUtil.deployFromJson(deployJson);
  if (!res.ok) {
    throw Error('Deploy Error');
  }

  const deploy = res.val;

  const handleSign = useCallback(() => {
    const signature = signDeploy(
      deploy.hash,
      activeAccount.publicKey,
      activeAccount.secretKey
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ signature }, { requestId })
    );
    closeActiveWindow();
  }, [
    activeAccount?.publicKey,
    activeAccount?.secretKey,
    deploy.hash,
    requestId
  ]);

  return (
    <LayoutWindow
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
