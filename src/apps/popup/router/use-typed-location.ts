import { useLocation } from 'react-router-dom';
import { Location } from '@remix-run/router';

import { LocationState } from '@popup/router/types';

interface UseTypedLocation extends Location {
  state: LocationState;
}
export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
