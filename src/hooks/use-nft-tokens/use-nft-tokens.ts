import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { dispatchFetchNftTokensRequest } from '@libs/services/nft-service/nft-service';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountNftTokensAdded,
  accountNftTokensUpdated
} from '@background/redux/account-info/actions';
import { selectAccountNftTokens } from '@background/redux/account-info/selectors';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useNftTokens = () => {
  const [nftTokensPage, setNftTokensPage] = useState(1);
  const [nftTokensPageCount, setNftTokensPageCount] = useState(0);
  const [nftTokensCount, setNftTokensCount] = useState(0);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const nftTokens = useSelector(selectAccountNftTokens);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      1
    )
      .then(({ payload: { data: nftTokensList, pageCount, itemCount } }) => {
        console.log(nftTokensList);
        if (nftTokensList.length === nftTokens?.length) return;

        dispatchToMainStore(accountNftTokensAdded(nftTokensList));

        setNftTokensPageCount(pageCount);
        setNftTokensPage(2);
        setNftTokensCount(itemCount);
      })
      .catch(error => {
        console.error('Account NFT request failed:', error);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, forceUpdate]);

  const loadMoreNftTokens = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    if (nftTokensPage > nftTokensPageCount) return;

    dispatchFetchNftTokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey),
      nftTokensPage
    )
      .then(({ payload: { data: nftTokensList, pageCount, itemCount } }) => {
        console.log(nftTokensList);
        if (nftTokensList.length === nftTokens?.length) return;

        dispatchToMainStore(accountNftTokensUpdated(nftTokensList));

        setNftTokensPageCount(pageCount);
        setNftTokensPage(nftTokensPage + 1);

        if (nftTokensCount !== itemCount) {
          setNftTokensCount(itemCount);
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
    nftTokensCount
  };
};
