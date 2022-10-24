import { useLocation } from 'react-router-dom';
import { LocationState } from './types';

export function useTypedLocation() {
  const location = useLocation();

  return location as typeof location & {
    state?: LocationState;
  };
}
