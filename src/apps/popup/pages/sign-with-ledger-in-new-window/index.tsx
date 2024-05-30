import { DeployUtil } from 'casper-js-sdk';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchAndDispatchExtendedDeployInfo } from '@src/utils';

import {
  selectLedgerDeploy,
  selectLedgerRecipientToSaveOnSuccess
} from '@background/redux/ledger/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import { sendSignDeploy, signDeploy } from '@libs/services/deployer-service';
import { LedgerEventStatus } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { SuccessView } from './success-view';

export const SignWithLedgerInNewWindowPage = () => {
  const deploy = useSelector(selectLedgerDeploy);
  const recipient = useSelector(selectLedgerRecipientToSaveOnSuccess);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { nodeUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const [isSuccess, setIsSuccess] = useState(false);

  const ledgerAction = async () => {
    if (!(activeAccount && deploy)) {
      return;
    }

    const KEYS = createAsymmetricKey(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    const resp = DeployUtil.deployFromJson(JSON.parse(deploy));

    if (!resp.ok) {
      console.log('-------- json parse error', resp.val);
      return;
    }

    const signedDeploy = await signDeploy(resp.val, [KEYS], activeAccount);

    sendSignDeploy(signedDeploy, nodeUrl)
      .then(resp => {
        if (recipient) {
          dispatchToMainStore(recipientPublicKeyAdded(recipient));
        }

        if ('result' in resp) {
          fetchAndDispatchExtendedDeployInfo(resp.result.deploy_hash);
        }

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
