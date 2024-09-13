import { QueryClient as NewQueryClient } from '@tanstack/react-query';
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient();

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
