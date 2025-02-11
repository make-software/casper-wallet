import { Deploy, Transaction } from 'casper-js-sdk';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import {
  selectLedgerDeploy,
  selectLedgerRecipientToSaveOnSuccess
} from '@background/redux/ledger/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import {
  selectApiConfigBasedOnActiveNetwork,
  selectIsCasper2Network
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { sendSignedTx, signDeploy } from '@libs/services/deployer-service';
import { LedgerEventStatus } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { SuccessView } from './success-view';

export const SignWithLedgerInNewWindowPage = () => {
  const deploy = useSelector(selectLedgerDeploy);
  const recipient = useSelector(selectLedgerRecipientToSaveOnSuccess);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { nodeUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const [isSuccess, setIsSuccess] = useState(false);
  const isCasper2Network = useSelector(selectIsCasper2Network);

  const ledgerAction = async () => {
    if (!(activeAccount && deploy)) {
      return;
    }

    const KEYS = createAsymmetricKeys(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    const resp = Deploy.fromJSON(deploy);

    const signedDeploy = await signDeploy(resp, KEYS, activeAccount);

    sendSignedTx(
      Transaction.fromDeploy(signedDeploy),
      nodeUrl,
      isCasper2Network
    )
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
