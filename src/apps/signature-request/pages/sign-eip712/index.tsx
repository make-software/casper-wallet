import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';
import {
  IEIP712SignTypedDataOptions,
  IEIP712TypedData
} from 'casper-wallet-core';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getPrivateKeyHexFromSecretKey, getSigningAccount } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { SignEip712Content } from '@signature-request/pages/sign-eip712/sign-eip712-content';
import { SignatureRequestLoading } from '@signature-request/pages/sign-transaction/signature-request-loading';
import { SignatureRequestRawJson } from '@signature-request/pages/sign-transaction/signature-request-raw-json';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesByOrigin,
  selectEip712JsonById,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import {
  parseRequestTabId,
  sendSdkResponseToSpecificTab
} from '@background/send-sdk-response-to-specific-tab';
import { eip712Repository } from '@background/wallet-repositories';

import { sdkMethod } from '@content/sdk-method';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  LayoutWindow
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { useFetchAccountsBalances } from '@libs/services/balance-service';
import { useFetchDataForEip712Request } from '@libs/services/signature-request-service';
import {
  ApproveConnectionContent,
  Button,
  Typography
} from '@libs/ui/components';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

export function SignEip712Page() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const requestTabId = parseRequestTabId(searchParams);
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const requestOrigin = searchParams.get('origin');

  if (
    !requestId ||
    !signingPublicKeyHex ||
    !requestOrigin ||
    requestTabId == null
  ) {
    throw Error(ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description);
  }

  const [showRawJson, setShowRawJson] = useState(false);
  const responseSentRef = useRef(false);

  const accounts = useSelector(selectVaultAccounts, shallowEqual);
  const eip712JsonById = useSelector(selectEip712JsonById, shallowEqual);

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesByOrigin(requestOrigin),
    shallowEqual
  );

  const { typedData, options } = useMemo<{
    typedData?: IEIP712TypedData;
    options?: IEIP712SignTypedDataOptions;
  }>(() => {
    const raw = eip712JsonById[requestId];

    return raw ? JSON.parse(raw) : {};
  }, [eip712JsonById, requestId]);

  const signingAccount = useMemo(
    () => getSigningAccount(accounts, signingPublicKeyHex),
    [accounts, signingPublicKeyHex]
  );

  // signing account should exist in wallet
  if (!signingAccount) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

  const shouldTryToConnectAccount =
    connectedAccountNames &&
    !connectedAccountNames.includes(signingAccount.name);

  const signingAccountHash = getAccountHashFromPublicKey(
    signingAccount.publicKey
  );

  const { accountsBalances, isLoadingBalances } = useFetchAccountsBalances([
    signingAccountHash
  ]);

  const accountsInfo = useFetchAccountsInfo([signingAccount.publicKey]);

  const { connectAnotherAccountWithEvent: connectAnotherAccount } =
    useAccountManager();

  const { signatureRequest, isLoadingSignatureRequest } =
    useFetchDataForEip712Request({
      typedData,
      options,
      signingPublicKeyHex,
      requestId,
      requestTabId
    });

  const handleConnect = useCallback(async () => {
    await connectAnotherAccount(signingAccount.name, requestOrigin);
  }, [requestOrigin, connectAnotherAccount, signingAccount.name]);

  const handleCancel = useCallback(() => {
    if (responseSentRef.current) return;
    responseSentRef.current = true;
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: null
        },
        { requestId }
      ),
      requestTabId
    );
    closeCurrentWindow();
  }, [requestId, requestTabId]);

  const handleSign = useCallback(() => {
    if (!typedData) {
      return;
    }

    // TODO(WALLET-1251): only software-key signing is supported for EIP-712.
    // Add Ledger hardware-wallet support (for accounts with
    // `hardware === HardwareWalletType.Ledger`), mirroring the sign-message /
    // sign-transaction Ledger flow (`useLedger`, Ledger confirmation footer).
    const publicKey = PublicKey.fromHex(signingAccount.publicKey);
    const privateKey = PrivateKey.fromHex(
      getPrivateKeyHexFromSecretKey(
        Conversions.base64to16(signingAccount.secretKey)
      ),
      publicKey.cryptoAlg
    );

    const result = eip712Repository.signTypedData({
      typedData,
      privateKey,
      options
    });

    responseSentRef.current = true;
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataResponse(
        {
          cancelled: false,
          signature: result.signature,
          digest: result.digest,
          publicKey: result.publicKey,
          hashArtifacts: result.hashArtifacts,
          error: null
        },
        { requestId }
      ),
      requestTabId
    );
    closeCurrentWindow();
  }, [
    typedData,
    options,
    signingAccount.publicKey,
    signingAccount.secretKey,
    requestId,
    requestTabId
  ]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleCancel);

    return () => window.removeEventListener('beforeunload', handleCancel);
  }, [handleCancel]);

  const renderFooter = () => {
    if (shouldTryToConnectAccount) {
      return () => (
        <FooterButtonsContainer>
          <Typography type="captionRegular" textAlign={'center'}>
            <Trans t={t}>Only connect with sites you trust</Trans>
          </Typography>
          <Button color="primaryRed" onClick={handleConnect}>
            <Trans t={t}>Connect</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={handleCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      );
    }

    return () => (
      <FooterButtonsContainer>
        <Button
          color="primaryRed"
          disabled={isLoadingSignatureRequest || !signatureRequest}
          onClick={handleSign}
        >
          <Trans t={t}>Sign</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={handleCancel}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    );
  };

  return (
    <LayoutWindow
      renderHeader={() => (
        <HeaderPopup
          signingAccount={signingAccount}
          renderSubmenuBarItems={
            showRawJson
              ? () => (
                  <HeaderSubmenuBarNavLink
                    linkType="back"
                    onClick={() => setShowRawJson(false)}
                  />
                )
              : undefined
          }
        />
      )}
      renderContent={() => {
        if (shouldTryToConnectAccount) {
          return (
            <ApproveConnectionContent
              account={signingAccount}
              accountLiquidBalance={
                accountsBalances?.[signingAccountHash].liquidBalance ?? '0'
              }
              accountsInfo={accountsInfo}
              isLoadingBalance={isLoadingBalances}
              origin={requestOrigin}
              activeOriginFavicon={getFaviconUrlFromOrigin(requestOrigin)}
            />
          );
        }

        return isLoadingSignatureRequest || !signatureRequest ? (
          <SignatureRequestLoading />
        ) : showRawJson ? (
          <SignatureRequestRawJson json={signatureRequest.rawJson} />
        ) : (
          <SignEip712Content
            signatureRequest={signatureRequest}
            origin={requestOrigin}
            handlePressShowRawJson={() => setShowRawJson(true)}
          />
        );
      }}
      renderFooter={renderFooter()}
    />
  );
}
