import React, { useEffect } from 'react';
import useInfiniteScroll from 'react-infinite-scroll-hook';

import { SpacingSize } from '@libs/layout';
import { useFetchDeploys } from '@libs/services/deploys';
import { List, LoadingActivityView, NoActivityView } from '@libs/ui/components';
import { DeployPlate } from '@libs/ui/components/deploy-plate/deploy-plate';

export const DeploysList = () => {
  const {
    deploys,
    isDeploysLoading,
    fetchDeploysNextPage,
    hasDeploysNextPage
  } = useFetchDeploys();
  const [sentryRef] = useInfiniteScroll({
    loading: isDeploysLoading,
    hasNextPage: hasDeploysNextPage,
    onLoadMore: fetchDeploysNextPage,
    delayInMs: 0
  });

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('activityPlateYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('activityPlateYPosition');
    } else {
      container?.scrollTo(0, 0);
    }
  }, []);

  const setActivityPlateYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'activityPlateYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  return (
    <>
      {deploys != null && deploys?.length > 0 && (
        <List
          contentTop={SpacingSize.None}
          rows={deploys}
          renderRow={deploy => (
            <DeployPlate
              deploy={deploy}
              navigateHome={true}
              onClick={setActivityPlateYPosition}
            />
          )}
          marginLeftForItemSeparatorLine={54}
        />
      )}

      {(isDeploysLoading || hasDeploysNextPage) && (
        <LoadingActivityView ref={sentryRef} />
      )}

      {(deploys == null || deploys.length === 0) && !isDeploysLoading && (
        <NoActivityView activityList={deploys} top={SpacingSize.None} />
      )}
    </>
  );
};
