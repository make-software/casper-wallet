import { useEffect, useState } from 'react';

import {
  PrivateState,
  fetchPrivateState
} from '@background/handlers/private-state';

export function usePrivateState(): PrivateState | null {
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchPrivateState()
      .then(ps => {
        if (mounted) {
          setPrivateState(ps);
        }
      })
      .catch(error => console.error('fetch private state:', error));
    return () => {
      mounted = false;
    };
  }, []);

  return privateState;
}
