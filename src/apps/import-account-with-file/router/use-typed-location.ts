import { useLocation } from 'react-router-dom';
import { LocationState } from '~src/apps/import-account-with-file/router/types';

export function useTypedLocation() {
  const location = useLocation();

  return location as typeof location & {
    state?: LocationState;
  };
}
