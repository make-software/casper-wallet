import React, { useEffect } from 'react';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { selectAccountErc20TokensActivity } from '@background/redux/account-info/selectors';

import { useFetchErc20TokenAccountActivity } from '@hooks/use-fetch-erc20-token-account-activity';

import { SpacingSize } from '@libs/layout';
import { Erc20TransferWithId } from '@libs/services/account-activity-service';
import {
  AccountActivityPlate,
  List,
  LoadingActivityView,
  NoActivityView
} from '@libs/ui/components';

export const Erc20TokenActivityList = () => {
  const erc20TokensActivityRecord =
    useSelector(selectAccountErc20TokensActivity) || {};

  const { tokenName } = useParams();

  const tokenActivity = erc20TokensActivityRecord[tokenName || ''] || {};

  const { loading, loadMoreAccountErc20Activity, hasNextPage } =
    useFetchErc20TokenAccountActivity(tokenName || '');
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMoreAccountErc20Activity,
    delayInMs: 0
  });

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('Erc20TokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('Erc20TokenYPosition');
    }
  }, []);

  const setErc20TokenYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'Erc20TokenYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  const erc20Transactions: Erc20TransferWithId[] =
    tokenActivity?.tokenActivityList?.map((transaction, index) => {
      return {
        id: String(index),
        amount: transaction.amount,
        deployHash: transaction.deploy_hash,
        callerPublicKey: transaction.deploy?.caller_public_key || '-',
        timestamp: transaction.deploy?.timestamp || '-',
        args: transaction.deploy?.args || '-',
        status: transaction.deploy?.status || '-',
        errorMessage: transaction.deploy?.error_message || null,
        decimals: transaction.contract_package?.metadata?.decimals,
        symbol: transaction.contract_package?.metadata?.symbol,
        toPublicKey: transaction?.to_public_key,
        fromPublicKey: transaction?.from_public_key || null,
        contractPackage: transaction?.contract_package,
        toHash: transaction?.to_hash,
        toType: transaction?.to_type
      };
    }) || [];

  const noActivityForErc20 =
    tokenActivity?.tokenActivityList == null ||
    tokenActivity?.tokenActivityList?.length === 0;

  return (
    <>
      {erc20Transactions.length > 0 && true && (
        <List
          contentTop={SpacingSize.Small}
          rows={erc20Transactions}
          renderRow={transaction => (
            <AccountActivityPlate
              transactionInfo={transaction}
              onClick={setErc20TokenYPosition}
            />
          )}
          marginLeftForItemSeparatorLine={54}
        />
      )}

      {(loading || hasNextPage) && <LoadingActivityView ref={sentryRef} />}

      {noActivityForErc20 && !loading && (
        <NoActivityView activityList={tokenActivity?.tokenActivityList} />
      )}
    </>
  );
};
