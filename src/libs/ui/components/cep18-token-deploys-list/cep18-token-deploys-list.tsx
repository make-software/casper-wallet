import React, { useEffect } from 'react';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { useParams } from 'react-router-dom';

import { SpacingSize } from '@libs/layout';
import { useFetchCep18TransferDeploys } from '@libs/services/deploys';
import { List, LoadingActivityView, NoActivityView } from '@libs/ui/components';
import { DeployPlate } from '@libs/ui/components/deploy-plate/deploy-plate';

export const Cep18TokenDeploysList = () => {
  const { tokenName } = useParams();

  const {
    cep18TransferDeploys,
    isCep18TransferDeploysLoading,
    hasCep18TransferDeploysNextPage,
    fetchCep18TransferDeploysNextPage
  } = useFetchCep18TransferDeploys(tokenName || '');

  const [sentryRef] = useInfiniteScroll({
    loading: isCep18TransferDeploysLoading,
    hasNextPage: hasCep18TransferDeploysNextPage,
    onLoadMore: fetchCep18TransferDeploysNextPage,
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

  const setCep18TokenYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'Erc20TokenYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  const noActivityForErc20 =
    cep18TransferDeploys == null || cep18TransferDeploys.length === 0;

  return (
    <>
      {cep18TransferDeploys.length > 0 && (
        <List
          contentTop={SpacingSize.Small}
          rows={cep18TransferDeploys}
          renderRow={deploy => (
            <DeployPlate deploy={deploy} onClick={setCep18TokenYPosition} />
          )}
          marginLeftForItemSeparatorLine={54}
        />
      )}

      {(isCep18TransferDeploysLoading || hasCep18TransferDeploysNextPage) && (
        <LoadingActivityView ref={sentryRef} />
      )}

      {noActivityForErc20 && !isCep18TransferDeploysLoading && (
        <NoActivityView activityList={cep18TransferDeploys} />
      )}
    </>
  );
};
