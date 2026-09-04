import { Location, useLocation } from 'react-router-dom';

import { LocationState } from './types';

interface UseTypedLocation extends Location {
  /**
   * `null` whenever the entry carries no state — a direct URL, a reload, or a
   * `navigate()` called without one. Guard every read.
   */
  state: LocationState | null;
}
export function useTypedLocation(): UseTypedLocation {
  return useLocation();
}
