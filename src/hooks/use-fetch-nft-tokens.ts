import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { useForceUpdate } from '@popup/hooks/use-force-update';

import {
  accountNftTokensAdded,
  accountNftTokensCountChanged,
  accountNftTokensUpdated
} from '@background/redux/account-info/actions';
import {
  selectAccountNftTokens,
  selectAccountNftTokensCount
} from '@background/redux/account-info/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchNftTokensRequest } from '@libs/services/nft-service';

export const useFetchNftTokens = () => {
  const [loading, setLoading] = useState(false);
  const [nftTokensPage, setNftTokensPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFirstPageLoad, setIsFirstPageLoad] = useState(false);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const nftTokens = useSelector(selectAccountNftTokens);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const nftTokensCount = useSelector(selectAccountNftTokensCount);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (nftTokens && nftTokensCount > nftTokens.length) {
      setHasNextPage(true);
    }

    if (nftTokensCount === 0 && (nftTokens == null || nftTokens.length === 0)) {
      setNftTokensPage(2);
    }
  }, [nftTokens, nftTokens?.length, nftTokensCount, nftTokensPage]);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // set loading to true only for the first time
    if ((nftTokens == null || nftTokens.length === 0) && !isFirstPageLoad) {
      setLoading(true);
    }

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      1
    )
      .then(({ payload }) => {
        if ('data' in payload) {
          const { data: nftTokensList, pageCount, itemCount } = payload;
          if (itemCount === nftTokens?.length || itemCount === nftTokensCount) {
            return;
          }

          dispatchToMainStore(accountNftTokensAdded(nftTokensList ?? []));
          dispatchToMainStore(accountNftTokensCountChanged(itemCount));

          if (pageCount > 1) {
            setHasNextPage(true);
          }
        } else {
          dispatchToMainStore(accountNftTokensAdded(null));
          setHasNextPage(false);
        }
      })
      .catch(error => {
        console.error('Account NFT request failed:', error);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 300);
        setIsFirstPageLoad(true);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
  }, [
    activeAccount?.publicKey,
    casperApiUrl,
    forceUpdate,
    isFirstPageLoad,
    nftTokens,
    nftTokens?.length,
    nftTokensCount
  ]);

  const loadMoreNftTokens = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    setLoading(true);

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      nftTokensPage
    )
      .then(({ payload }) => {
        if ('data' in payload) {
          const { data: nftTokensList, pageCount, itemCount } = payload;

          if (itemCount === nftTokens?.length) {
            setHasNextPage(false);
            return;
          }

          dispatchToMainStore(accountNftTokensUpdated(nftTokensList ?? []));

          if (nftTokensPage + 1 <= pageCount) {
            setNftTokensPage(nftTokensPage + 1);
          }

          if (nftTokensCount !== itemCount) {
            dispatchToMainStore(accountNftTokensCountChanged(itemCount));
          }

          if (nftTokensPage >= pageCount) {
            setHasNextPage(false);
          }
        } else {
          dispatchToMainStore(accountNftTokensAdded(null));
          setHasNextPage(false);
        }
      })
      .catch(error => {
        console.error('Account NFT request failed:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    activeAccount?.publicKey,
    nftTokens?.length,
    nftTokensCount,
    nftTokensPage
  ]);

  return {
    loadMoreNftTokens,
    loading,
    hasNextPage
  };
};
