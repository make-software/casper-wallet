import { useEffect } from 'react';
import { Routes as RoutePath } from '@src/app/routes';
import { NavigateFunction } from 'react-router-dom';

interface UseAppRedirectsProps {
  navigate: NavigateFunction;
  isVaultLocked: boolean;
  isVaultExists: boolean;
  isAccountExists: boolean;
}

export function useAppRedirects({
  navigate,
  isVaultLocked,
  isVaultExists,
  isAccountExists
}: UseAppRedirectsProps) {
  useEffect(() => {
    if (isVaultLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!isVaultExists) {
      navigate(RoutePath.CreateVault);
    } else if (!isAccountExists) {
      navigate(RoutePath.NoAccounts);
    }
  }, [isVaultLocked, isVaultExists, isAccountExists]);
}
