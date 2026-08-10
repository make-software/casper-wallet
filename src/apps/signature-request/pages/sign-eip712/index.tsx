import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';
import {
  IEIP712SignTypedDataOptions,
  IEIP712TypedData
} from 'casper-wallet-core';
import React, { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getPrivateKeyHexFromSecretKey, getSigningAccount } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { SignEip712Content } from '@signature-request/pages/sign-eip712/sign-eip712-content';
import { SignatureRequestLoading } from '@signature-request/pages/sign-transaction/signature-request-loading';
import { SignatureRequestRawJson } from '@signature-request/pages/sign-transaction/signature-request-raw-json';

import { closeCurrentWindow } from '@background/close-current-window';
import { getPayload } from '@background/redux/vault/payload-map';
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
import { HardwareWalletType } from '@libs/types/account';
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

  const accounts = useSelector(selectVaultAccounts, shallowEqual);
  const eip712JsonById = useSelector(selectEip712JsonById, shallowEqual);

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesByOrigin(requestOrigin),
    shallowEqual
  );

  const { typedData, options, isInvalidPayload } = useMemo<{
    typedData?: IEIP712TypedData;
    options?: IEIP712SignTypedDataOptions;
    isInvalidPayload?: boolean;
  }>(() => {
    // `getPayload`, never a bare index — `requestId` is dapp-controlled and an
    // inherited Object.prototype member would parse as anything but typed data.
    const raw = getPayload(eip712JsonById, requestId);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { isInvalidPayload: true };
    }
  }, [eip712JsonById, requestId]);

  // Stored payload is present but not valid JSON — cannot proceed.
  if (isInvalidPayload) {
    const error = Error(
      ErrorMessages.signTypedData.INVALID_TYPED_DATA.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

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

  // Ledger hardware wallets do not support EIP-712 typed data signing.
  if (signingAccount.hardware === HardwareWalletType.Ledger) {
    const error = Error(
      ErrorMessages.signTypedData.LEDGER_NOT_SUPPORTED.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

  // Watch-only accounts have no secret key and cannot sign.
  if (!signingAccount.secretKey) {
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

    try {
      // EIP-712 supports software-key signing only; Ledger accounts are rejected earlier.
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
    } catch {
      sendSdkResponseToSpecificTab(
        sdkMethod.signTypedDataError(
          Error(ErrorMessages.signTypedData.SIGNING_FAILED.description),
          { requestId }
        ),
        requestTabId
      );
      closeCurrentWindow();
    }
  }, [
    typedData,
    options,
    signingAccount.publicKey,
    signingAccount.secretKey,
    requestId,
    requestTabId
  ]);

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
                accountsBalances?.[signingAccountHash]?.liquidBalance ?? '0'
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
