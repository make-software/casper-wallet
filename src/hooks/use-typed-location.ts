import { useLocation } from 'react-router-dom';
import { LocationState as PopupLocationState } from '@popup/router/types';
import { LocationState as ImportAccountWithFileLocationState } from '@import-account-with-file/router/types';

export function useTypedLocation() {
  const location = useLocation();

  return location as typeof location & {
    state: PopupLocationState | ImportAccountWithFileLocationState;
  };
}
