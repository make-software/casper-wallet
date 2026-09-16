import { Location, useLocation } from 'react-router-dom';

import { LocationState } from '@onboarding/router/types';

interface UseTypedLocation extends Location {
  state: LocationState | null;
}

export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
