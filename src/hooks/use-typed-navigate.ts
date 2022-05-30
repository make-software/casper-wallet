import { To, useNavigate } from 'react-router-dom';
import { LocationState as PopupLocationState } from '@popup/router/types';
import { LocationState as ImportAccountWithFileLocationState } from '@import-account-with-file/router/types';

export function useTypedNavigate() {
  const navigate = useNavigate();

  return navigate as {
    (
      to: To,
      options?: {
        replace?: boolean;
        state?: PopupLocationState | ImportAccountWithFileLocationState;
      }
    ): void;
    (delta: number): void;
  };
}
