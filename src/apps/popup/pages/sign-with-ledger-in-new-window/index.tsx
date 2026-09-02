import { Deploy, Transaction } from 'casper-js-sdk';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { fetchAccountSecretKey } from '@background/handlers/vault-secrets';
import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import {
  selectLedgerDeploy,
  selectLedgerRecipientToSaveOnSuccess,
  selectLedgerTransaction
} from '@background/redux/ledger/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import {
  selectActiveNetworkSetting,
  selectCasperNetworkApiVersion
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { sendSignedTx, signTx } from '@libs/services/deployer-service';
import { LedgerEventStatus } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { SuccessView } from './success-view';

export const SignWithLedgerInNewWindowPage = () => {
  const deployJson = useSelector(selectLedgerDeploy);
  const txJson = useSelector(selectLedgerTransaction);
  const recipient = useSelector(selectLedgerRecipientToSaveOnSuccess);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);
  const network = getCasperNetwork(activeNetworkSetting);
  const [isSuccess, setIsSuccess] = useState(false);
  const casperNetworkApiVersion = useSelector(selectCasperNetworkApiVersion);
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const ledgerAction = async () => {
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
      .catch(error => {
        console.error(error, 'transfer request error');
      });
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
