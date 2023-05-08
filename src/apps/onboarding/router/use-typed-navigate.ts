import { To, useNavigate } from 'react-router-dom';
import { LocationState } from './types';

export function useTypedNavigate() {
  const navigate = useNavigate();

  return navigate as {
    (
      to: To,
      options?: {
        replace?: boolean;
        state?: LocationState;
      }
    ): void;
    (delta: number): void;
  };
}
