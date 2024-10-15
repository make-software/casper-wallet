import { useMutation } from '@tanstack/react-query';

import { onRampRepository } from '@background/wallet-repositories';

export const useGetOnRampProviders = () => {
  const { mutate: getOnRampProviders, isPending: isProvidersLoading } =
    useMutation({
      mutationFn: onRampRepository.getOnRampProviders
    });

  const {
    mutate: getOnRampProviderLocation,
    isPending: isProviderLocationLoading
  } = useMutation({
    mutationFn: onRampRepository.getProviderLocation
  });

  return {
    getOnRampProviders,
    isProvidersLoading,
    getOnRampProviderLocation,
    isProviderLocationLoading
  };
};
