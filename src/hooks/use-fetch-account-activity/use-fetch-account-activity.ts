import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  Erc20TokenActionResult,
  LedgerLiveDeploysResult,
  dispatchFetchAccountActivity
} from '@libs/services/account-activity-service';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountActivityChanged,
  accountActivityUpdated,
  accountErc20ActivityChanged,
  accountErc20ActivityUpdated
} from '@background/redux/account-info/actions';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import {
  ACCOUNT_ACTIVITY_REFRESH_RATE,
  ActivityListTransactionsType
} from '@src/constants';
import { dispatchFetchErc20AccountActivity } from '@src/libs/services/account-activity-service/erc20-account-activity-service';
import { getAccountHashFromPublicKey } from '@src/libs/entities/Account';
import { DataWithPayload, PaginatedResponse } from '@src/libs/services/types';
import { dispatchFetchErc20TokenActivity } from '@src/libs/services/account-activity-service/erc20-token-activity-service';

export const useFetchAccountActivity = (
  transactionsType: ActivityListTransactionsType,
  contractPackageHash?: string
) => {
  const [accountActivityPage, setAccountActivityPage] = useState(1);
  const [accountErc20ActivityPage, setAccountErc20ActivityPage] = useState(1);
  const [accountActivityPageCount, setAccountActivityPageCount] = useState(0);
  const [accountErc20ActivityPageCount, setAccountErc20ActivityPageCount] =
    useState(0);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activeAccountHash = getAccountHashFromPublicKey(
    activeAccount?.publicKey
  );

  const createHandlePayload = useCallback(
    (payloadAction: any, page = 1, setPage, setPageCount) =>
      <
        T extends DataWithPayload<
          PaginatedResponse<Erc20TokenActionResult | LedgerLiveDeploysResult>
        >
      >({
        payload: { data: accountTransactions, pageCount }
      }: T) => {
        const transactions =
          accountTransactions?.map(transaction => ({
            ...transaction,
            id: transaction.deploy_hash
          })) || [];

        dispatchToMainStore(payloadAction(transactions));

        // Set page to 2, so we can fetch more transactions when the user scrolls down
        setPage(page + 1);
        setPageCount(pageCount);
      },
    []
  );

  const handleError = (error: Error) => {
    console.error('Account activity request failed:', error);
  };

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // fetch all
    if (transactionsType === ActivityListTransactionsType.All) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
        .then(
          createHandlePayload(
            accountActivityChanged,
            1,
            setAccountActivityPage,
            setAccountActivityPageCount
          )
        )
        .catch(handleError);
      dispatchFetchErc20AccountActivity(activeAccountHash, 1)
        .then(
          createHandlePayload(
            accountErc20ActivityChanged,
            1,
            setAccountErc20ActivityPage,
            setAccountErc20ActivityPageCount
          )
        )
        .catch(handleError);
    }

    // fetch casper
    if (transactionsType === ActivityListTransactionsType.Casper) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
        .then(
          createHandlePayload(
            accountActivityChanged,
            1,
            setAccountActivityPage,
            setAccountActivityPageCount
          )
        )
        .catch(handleError);
    }
    // fetch erc20
    if (
      transactionsType === ActivityListTransactionsType.Erc20 &&
      contractPackageHash != null
    ) {
      dispatchFetchErc20TokenActivity(activeAccountHash, contractPackageHash, 1)
        .then(
          createHandlePayload(
            accountErc20ActivityChanged,
            1,
            setAccountErc20ActivityPage,
            setAccountErc20ActivityPageCount
          )
        )
        .catch(handleError);
    }

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, forceUpdate]);

  const fetchMoreTransactions = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    // fetch casper
    if (transactionsType === ActivityListTransactionsType.Casper) {
      // Prevent fetching more transactions if we already fetched all of them
      if (accountActivityPage > accountActivityPageCount) return;

      dispatchFetchAccountActivity(
        activeAccount?.publicKey,
        accountActivityPage
      )
        .then(
          createHandlePayload(
            accountActivityUpdated,
            accountActivityPage,
            setAccountActivityPage,
            setAccountActivityPageCount
          )
        )
        .catch(handleError);
    }
    // fetch erc20
    if (
      transactionsType === ActivityListTransactionsType.Erc20 &&
      contractPackageHash != null
    ) {
      // Prevent fetching more transactions if we already fetched all of them
      if (accountErc20ActivityPage > accountErc20ActivityPageCount) return;

      dispatchFetchErc20TokenActivity(
        activeAccountHash,
        contractPackageHash,
        accountErc20ActivityPage
      )
        .then(
          createHandlePayload(
            accountErc20ActivityUpdated,
            accountErc20ActivityPage,
            setAccountErc20ActivityPage,
            setAccountErc20ActivityPageCount
          )
        )
        .catch(handleError);
    }
  }, [
    transactionsType,
    activeAccount?.publicKey,
    contractPackageHash,
    accountActivityPage,
    accountActivityPageCount,
    createHandlePayload,
    accountErc20ActivityPage,
    accountErc20ActivityPageCount,
    activeAccountHash
  ]);
  return {
    fetchMoreTransactions
  };
};
