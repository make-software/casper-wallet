import { Location } from '@remix-run/router';
import { useLocation } from 'react-router-dom';

import { LocationState } from './types';

interface UseTypedLocation extends Location {
  state: LocationState;
}
export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
