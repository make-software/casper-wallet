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
import { selectAccountActivity } from '@background/redux/account-info/selectors';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import {
  ACCOUNT_ACTIVITY_REFRESH_RATE,
  ActivityListTransactionsType
} from '@src/constants';
import { dispatchFetchErc20AccountActivity } from '@src/libs/services/account-activity-service/erc20-account-activity-service';
import { getAccountHashFromPublicKey } from '@src/libs/entities/Account';
import { DataWithPayload, PaginatedResponse } from '@src/libs/services/types';
import { dispatchFetchErc20TokenActivity } from '@src/libs/services/account-activity-service/erc20-token-activity-service';

export const useAccountTransactions = (
  transactionsType: ActivityListTransactionsType,
  contractPackageHash?: string
) => {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activityList = useSelector(selectAccountActivity);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activityListLength = activityList?.length || null;
  const activeAccountHash = getAccountHashFromPublicKey(
    activeAccount?.publicKey
  );

  const createHandlePayload = useCallback(
    (payloadAction: any, page = 1) =>
      <
        T extends DataWithPayload<
          PaginatedResponse<Erc20TokenActionResult | LedgerLiveDeploysResult>
        >
      >({
        payload: { data: accountTransactions, pageCount, itemCount }
      }: T) => {
        if (itemCount === activityListLength) return;

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
    [activityListLength]
  );

  const handleError = (error: Error) => {
    console.error('Account activity request failed:', error);
  };

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // fetch all
    if (transactionsType === ActivityListTransactionsType.All) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
        .then(createHandlePayload(accountActivityChanged, 1))
        .catch(handleError);
      dispatchFetchErc20AccountActivity(activeAccountHash, 1)
        .then(createHandlePayload(accountErc20ActivityChanged, 1))
        .catch(handleError);
    }

    // fetch casper
    if (transactionsType === ActivityListTransactionsType.Casper) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
        .then(createHandlePayload(accountActivityChanged))
        .catch(handleError);
    }
    // fetch erc20
    if (
      transactionsType === ActivityListTransactionsType.Erc20 &&
      contractPackageHash != null
    ) {
      dispatchFetchErc20TokenActivity(activeAccountHash, contractPackageHash, 1)
        .then(createHandlePayload(accountErc20ActivityChanged))
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
    // Prevent fetching more transactions if we already fetched all of them
    if (page > pageCount) return;

    // fetch all
    if (transactionsType === ActivityListTransactionsType.All) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, page)
        .then(createHandlePayload(accountActivityUpdated, page))
        .catch(handleError);
      dispatchFetchErc20AccountActivity(activeAccount?.publicKey, page)
        .then(createHandlePayload(accountErc20ActivityUpdated, page))
        .catch(handleError);
    }
    // fetch casper
    if (transactionsType === ActivityListTransactionsType.Casper) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, page)
        .then(createHandlePayload(accountActivityUpdated, page))
        .catch(handleError);
    }
    // fetch erc20
    if (
      transactionsType === ActivityListTransactionsType.Erc20 &&
      contractPackageHash != null
    ) {
      dispatchFetchErc20TokenActivity(
        activeAccountHash,
        contractPackageHash,
        page
      )
        .then(createHandlePayload(accountErc20ActivityUpdated, page))
        .catch(handleError);
    }
  }, [
    activeAccount?.publicKey,
    activeAccountHash,
    page,
    pageCount,
    transactionsType,
    createHandlePayload,
    contractPackageHash
  ]);
  return {
    fetchMoreTransactions
  };
};
