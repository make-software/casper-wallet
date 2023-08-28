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
  const [nftTokensPage, setNftTokensPage] = useState(1);
  const [nftTokensPageCount, setNftTokensPageCount] = useState(0);
  const [downloadedOnce, setDownloadedOnce] = useState(false);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const nftTokens = useSelector(selectAccountNftTokens);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const nftTokensCount = useSelector(selectAccountNftTokensCount);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    setLoading(true);
  }, [casperApiUrl, activeAccount?.publicKey]);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // set loading to true only for the first time
    if (nftTokens.length === 0 && !downloadedOnce) {
      setLoading(true);
    }

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      1
    )
      .then(({ payload }) => {
        if (payload) {
          const { data: nftTokensList, pageCount, itemCount } = payload;

          if (itemCount === nftTokens?.length || itemCount === nftTokensCount) {
            return;
          }

          dispatchToMainStore(accountNftTokensAdded(nftTokensList ?? []));
          dispatchToMainStore(accountNftTokensCountChanged(itemCount));

          setNftTokensPageCount(pageCount);
          setNftTokensPage(2);
        }
      })
      .catch(error => {
        console.error('Account NFT request failed:', error);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 300);
        setDownloadedOnce(true);
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
    downloadedOnce,
    forceUpdate,
    nftTokens?.length,
    nftTokensCount
  ]);

  const loadMoreNftTokens = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    if (nftTokensPage > nftTokensPageCount) return;

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      nftTokensPage
    )
      .then(({ payload }) => {
        if (payload) {
          const { data: nftTokensList, pageCount, itemCount } = payload;

          if (itemCount === nftTokens?.length) return;

          dispatchToMainStore(accountNftTokensUpdated(nftTokensList ?? []));

          setNftTokensPageCount(pageCount);
          setNftTokensPage(nftTokensPage + 1);

          if (nftTokensCount !== itemCount) {
            dispatchToMainStore(accountNftTokensCountChanged(itemCount));
          }
        }
      })
      .catch(error => {
        console.error('Account NFT request failed:', error);
      });
  }, [
    activeAccount?.publicKey,
    nftTokens?.length,
    nftTokensCount,
    nftTokensPage,
    nftTokensPageCount
  ]);

  return {
    loadMoreNftTokens,
    loading
  };
};
