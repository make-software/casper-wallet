import { Location, useLocation } from 'react-router-dom';

import { LocationState } from './types';

interface UseTypedLocation extends Location {
  state: LocationState;
}
export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
