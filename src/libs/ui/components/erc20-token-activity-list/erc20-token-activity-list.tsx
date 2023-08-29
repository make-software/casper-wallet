import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { SpacingSize } from '@libs/layout';
import { AccountActivityPlate, List, NoActivityView } from '@libs/ui';
import {
  useFetchErc20TokenAccountActivity,
  useInfinityScroll
} from '@src/hooks';
import { selectAccountErc20TokensActivity } from '@background/redux/account-info/selectors';
import { Erc20TransferWithId } from '@src/libs/services/account-activity-service';

export const Erc20TokenActivityList = () => {
  const erc20TokensActivityRecord =
    useSelector(selectAccountErc20TokensActivity) || {};

  const { tokenName } = useParams();

  const tokenActivity = erc20TokensActivityRecord[tokenName || ''] || {};

  const { loading, loadMoreAccountErc20Activity } =
    useFetchErc20TokenAccountActivity(tokenName || '');

  const { observerElement } = useInfinityScroll(loadMoreAccountErc20Activity);

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
    tokenActivity?.tokenActivityList?.map(transaction => {
      return {
        id: transaction.deploy_hash,
        deployHash: transaction.deploy_hash,
        callerPublicKey: transaction.deploy?.caller_public_key || '-',
        timestamp: transaction.deploy?.timestamp || '-',
        args: transaction.deploy?.args || '-',
        status: transaction.deploy?.status || '-',
        errorMessage: transaction.deploy?.error_message || null,
        decimals: transaction.contract_package?.metadata.decimals,
        symbol: transaction.contract_package?.metadata.symbol,
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

  if (noActivityForErc20) {
    return (
      <NoActivityView
        activityList={tokenActivity?.tokenActivityList}
        loading={loading}
      />
    );
  }

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={erc20Transactions}
      renderRow={(transaction, index) => (
        <AccountActivityPlate
          ref={index === erc20Transactions?.length - 1 ? observerElement : null}
          transactionInfo={transaction}
          onClick={setErc20TokenYPosition}
        />
      )}
      marginLeftForItemSeparatorLine={54}
    />
  );
};