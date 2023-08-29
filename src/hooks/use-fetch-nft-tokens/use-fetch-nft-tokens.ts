import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { dispatchFetchNftTokensRequest } from '@libs/services/nft-service';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountNftTokensAdded,
  accountNftTokensCountChanged,
  accountNftTokensUpdated
} from '@background/redux/account-info/actions';
import {
  selectAccountNftTokens,
  selectAccountNftTokensCount
} from '@background/redux/account-info/selectors';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

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
    if (nftTokensCount > nftTokens.length) {
      setHasNextPage(true);
    }

    const activePage = Math.ceil(nftTokens.length / 10);

    setNftTokensPage(activePage + 1);
  }, [nftTokens.length, nftTokensCount]);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // set loading to true only for the first time
    if (nftTokens.length === 0 && !isFirstPageLoad) {
      setLoading(true);
    }

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      1
    )
      .then(({ payload }) => {
        if (payload) {
          const { data: nftTokensList, itemCount, pageCount } = payload;

          if (itemCount === nftTokens?.length || itemCount === nftTokensCount) {
            return;
          }

          dispatchToMainStore(accountNftTokensAdded(nftTokensList ?? []));
          dispatchToMainStore(accountNftTokensCountChanged(itemCount));

          if (pageCount > 1) {
            setHasNextPage(true);
          }
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
    nftTokens.length,
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
        if (payload) {
          const { data: nftTokensList, pageCount, itemCount } = payload;

          if (itemCount === nftTokens?.length) {
            setHasNextPage(false);
            return;
          }

          dispatchToMainStore(accountNftTokensUpdated(nftTokensList ?? []));

          setNftTokensPage(nftTokensPage + 1);

          if (nftTokensCount !== itemCount) {
            dispatchToMainStore(accountNftTokensCountChanged(itemCount));
          }
          if (nftTokensPage >= pageCount) {
            setHasNextPage(false);
          }
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
