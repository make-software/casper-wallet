import React, { useEffect } from 'react';
import useInfiniteScroll from 'react-infinite-scroll-hook';

import { SpacingSize } from '@libs/layout';
import { useFetchCsprTransferDeploys } from '@libs/services/deploys';
import { List, LoadingActivityView, NoActivityView } from '@libs/ui/components';
import { DeployPlate } from '@libs/ui/components/deploy-plate/deploy-plate';

export const CasperTokenTransferDeploysList = () => {
  const {
    csprTransferDeploys,
    isCsprTransferDeploysLoading,
    hasCsprTransferDeploysNextPage,
    fetchCsprTransferDeploysNextPage
  } = useFetchCsprTransferDeploys();
  const [sentryRef] = useInfiniteScroll({
    loading: isCsprTransferDeploysLoading,
    hasNextPage: hasCsprTransferDeploysNextPage,
    onLoadMore: fetchCsprTransferDeploysNextPage,
    delayInMs: 0
  });

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('casperTokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('casperTokenYPosition');
    }
  }, []);

  const setCasperTokenYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'casperTokenYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  return (
    <>
      {csprTransferDeploys != null && csprTransferDeploys.length > 0 && (
        <List
          contentTop={SpacingSize.Small}
          rows={csprTransferDeploys!}
          renderRow={deploy => (
            <DeployPlate deploy={deploy} onClick={setCasperTokenYPosition} />
          )}
          marginLeftForItemSeparatorLine={54}
        />
      )}

      {(isCsprTransferDeploysLoading || hasCsprTransferDeploysNextPage) && (
        <LoadingActivityView ref={sentryRef} />
      )}

      {csprTransferDeploys == null ||
        (csprTransferDeploys.length === 0 && !isCsprTransferDeploysLoading && (
          <NoActivityView activityList={csprTransferDeploys} />
        ))}
    </>
  );
};
