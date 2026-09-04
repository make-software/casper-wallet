import { Location, useLocation } from 'react-router-dom';

import { LocationState } from '@import-account-with-file/router/types';

interface UseTypedLocation extends Location {
  /** `null` when the entry carries no state: a direct URL, or a reload. Guard every read. */
  state: LocationState | null;
}

export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
