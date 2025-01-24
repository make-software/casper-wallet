import { QueryClient as NewQueryClient } from '@tanstack/react-query';

export const newQueryClient = new NewQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,
      refetchInterval: 3 * 60 * 1000,
      gcTime: 3 * 60 * 1000,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
});
