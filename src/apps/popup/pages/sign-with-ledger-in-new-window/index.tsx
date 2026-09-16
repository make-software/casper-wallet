import { Deploy, Transaction } from 'casper-js-sdk';
import {
  ISwapFlowDeps,
  createLedgerSigner,
  createSwapFlowRunner,
  createWrapFlowRunner
} from 'casper-wallet-core';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import {
  SwapFlowOutcome,
  resolveSwapFlowOutcome,
  resolveWrapFlowOutcome
} from '@popup/pages/swap/flow-events';
import {
  ILedgerSwapPayload,
  parseLedgerSwapPayload,
  serializeLedgerSwapPayload
} from '@popup/pages/swap/ledger-trade';
import { toStartSwapFlowParams } from '@popup/pages/swap/swap-flow-params';
import { resolveParkedSwapPayload } from '@popup/pages/swap/swap-repark';

import { fetchAccountSecretKey } from '@background/handlers/vault-secrets';
import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import { ledgerSwapPayloadChanged } from '@background/redux/ledger/actions';
import {
  selectLedgerDeploy,
  selectLedgerRecipientToSaveOnSuccess,
  selectLedgerSwapPayload,
  selectLedgerTransaction
} from '@background/redux/ledger/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import {
  selectActiveNetworkSetting,
  selectCasperNetworkApiVersion,
  selectIsCasper2Network
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  casperTransactionsRepository,
  dexContractRepository,
  transactionStatusRepository
} from '@background/signing-repositories';

import { useLedger } from '@hooks/use-ledger';

import { CasperWalletSupports } from '@content/sdk-types';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import {
  getTransactionErrorCopy,
  isLedgerFailure
} from '@libs/services/core-errors';
import { sendSignedTx, signTx } from '@libs/services/deployer-service';
import { LedgerEventStatus, ledger } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { FailureView } from './failure-view';
import { SuccessView } from './success-view';

export const SignWithLedgerInNewWindowPage = () => {
  const { t } = useTranslation();
  const deployJson = useSelector(selectLedgerDeploy);
  const txJson = useSelector(selectLedgerTransaction);
  const recipient = useSelector(selectLedgerRecipientToSaveOnSuccess);
  const swapPayloadJson = useSelector(selectLedgerSwapPayload);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);
  const network = getCasperNetwork(activeNetworkSetting);
  const [isSuccess, setIsSuccess] = useState(false);
  // Non-null once a submission has failed for a reason the device cannot show.
  const [failure, setFailure] = useState<{
    header: string;
    content: string;
  } | null>(null);
  const casperNetworkApiVersion = useSelector(selectCasperNetworkApiVersion);
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  // What is currently parked, kept in sync with the store so the approval leg's outcome can
  // re-park it — this window starts its own flow handle and has no other record of it.
  const parkedPayloadRef = useRef<ILedgerSwapPayload | null>(null);

  const reportFailure = (error: unknown) => {
    if (isLedgerFailure(error)) {
      return;
    }

    console.error(error, 'ledger permission window submission error');
    setFailure(getTransactionErrorCopy(error, key => t(key)));
  };

  // `isDeploy` is irrelevant off the swap arm: `resolveParkedSwapPayload` bails out before
  // reading it whenever what is parked is not a swap, which is always true for a wrap outcome.
  const applyOutcome = (outcome: SwapFlowOutcome, isDeploy = false) => {
    switch (outcome.kind) {
      case 'sent': {
        dispatchToMainStore(accountPendingDeployHashesChanged(outcome.hash));

        if (outcome.isSubmitted) {
          setIsSuccess(true);

          break;
        }

        // The approval leg re-parks, carrying its hash forward, mirroring `useSwapSubmit`'s
        // `applyOutcome` so a device interruption before the swap leg waits instead of retrying.
        const nextParked = resolveParkedSwapPayload(
          outcome,
          parkedPayloadRef.current,
          isDeploy
        );

        if (nextParked !== undefined) {
          parkedPayloadRef.current = nextParked;

          dispatchToMainStore(
            ledgerSwapPayloadChanged(
              nextParked == null ? null : serializeLedgerSwapPayload(nextParked)
            )
          );
        }

        break;
      }

      case 'failed':
        reportFailure(outcome.error);

        break;

      default:
        // `cancelled` reaches the user through the device status the Ledger view renders; the
        // remaining events are progress this window does not draw.
        break;
    }
  };

  const ledgerAction = async () => {
    const parkedPayload = parseLedgerSwapPayload(swapPayloadJson);
    parkedPayloadRef.current = parkedPayload;

    if (parkedPayload && activeAccount) {
      const signer = createLedgerSigner({
        service: ledger,
        publicKeyHex: activeAccount.publicKey,
        derivationIndex: activeAccount.derivationIndex,
        supportsTransactionV1Cb: changeActiveAccountSupportsWithEvent
      });

      const supportsTransactionV1 =
        isCasper2Network &&
        activeAccount.supports?.includes(
          CasperWalletSupports.signTransactionV1
        ) === true;

      const deps: ISwapFlowDeps = {
        network,
        publicKey: activeAccount.publicKey,
        signer,
        supportsTransactionV1,
        dexContractRepository,
        casperTransactionsRepository,
        transactionStatusRepository,
        ledgerEvents$: ledger.ledgerEvents$
      };

      if (parkedPayload.kind === 'wrap') {
        const handle = createWrapFlowRunner(deps).start({
          direction: parkedPayload.direction,
          rawAmount: parkedPayload.rawAmount,
          awaitSettlement: false
        });

        handle.events$.subscribe({
          next: event => applyOutcome(resolveWrapFlowOutcome(event)),
          error: reportFailure
        });
      } else {
        const handle = createSwapFlowRunner(deps).start(
          toStartSwapFlowParams(parkedPayload)
        );

        handle.events$.subscribe({
          next: event =>
            applyOutcome(resolveSwapFlowOutcome(event), !supportsTransactionV1),
          error: reportFailure
        });
      }

      return;
    }

    if (!(activeAccount && txJson && deployJson)) {
      return;
    }

    // This page only runs the hardware flow: the secret key is legitimately empty.
    const secretKey = await fetchAccountSecretKey(activeAccount.name);
    const KEYS = createAsymmetricKeys(activeAccount.publicKey, secretKey);

    const tx = Transaction.fromJSON(txJson);
    const deployFallback = Deploy.fromJSON(deployJson);

    const signedTx = await signTx(
      tx,
      KEYS,
      activeAccount,
      deployFallback,
      changeActiveAccountSupportsWithEvent
    );

    sendSignedTx(signedTx, network, casperNetworkApiVersion)
      .then(hash => {
        if (recipient) {
          dispatchToMainStore(recipientPublicKeyAdded(recipient));
        }

        dispatchToMainStore(accountPendingDeployHashesChanged(hash));

        setIsSuccess(true);
      })
      .catch(reportFailure);
  };

  const {
    ledgerEventStatusToRender,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState
  } = useLedger({
    ledgerAction,
    beforeLedgerActionCb: async () => {},
    initialEventToRender: { status: LedgerEventStatus.LedgerAskPermission },
    withWaitingEventOnDisconnect: false
  });

  if (failure) {
    return (
      <FailureView
        header={failure.header}
        content={failure.content}
        onClose={closeNewLedgerWindowsAndClearState}
      />
    );
  }

  return isSuccess ? (
    <SuccessView onClose={closeNewLedgerWindowsAndClearState} />
  ) : (
    <LedgerConnectionView
      event={ledgerEventStatusToRender}
      onConnect={makeSubmitLedgerAction}
      closeNewLedgerWindowsAndClearState={closeNewLedgerWindowsAndClearState}
    />
  );
};
