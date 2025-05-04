import { useQuery } from '@tanstack/react-query';

import { APP_MARKETING_EVENTS_REFRESH_RATE } from '@src/constants';

import { appEventsRepository } from '@background/wallet-repositories';

export const useGetActiveAppMarketingEvent = (ignoreEventIds: number[]) => {
  const idsKey = JSON.stringify(ignoreEventIds);

  const {
    data: activeMarketingEvent = null,
    isFetching: isActiveMarketingEventLoading
  } = useQuery({
    queryKey: ['APP_MARKETING_EVENTS', idsKey],
    queryFn: () =>
      appEventsRepository.getActiveMarketingEvent({
        withProxyHeader: false,
        env: 'PRODUCTION',
        ignoreEventIds
      }),
    refetchInterval: APP_MARKETING_EVENTS_REFRESH_RATE,
    staleTime: APP_MARKETING_EVENTS_REFRESH_RATE
  });

  return {
    activeMarketingEvent,
    isActiveMarketingEventLoading
  };
};
