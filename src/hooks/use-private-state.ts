import { useCallback, useEffect, useState } from 'react';
import { runtime } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import {
  PrivateState,
  fetchPrivateState
} from '@background/handlers/private-state';

import {
  RETRY_DELAYS_MS,
  requestWithRetry
} from '@libs/messaging/request-with-retry';

export const PRIVATE_STATE_RETRY_DELAYS_MS = RETRY_DELAYS_MS;

interface UsePrivateStateResult {
  privateState: PrivateState | null;
  error: boolean;
  retry: () => void;
}

export function loadPrivateStateWithRetry(): Promise<PrivateState> {
  return requestWithRetry(fetchPrivateState);
}

export function createPrivateStateUpdatedListener(onUpdate: () => void) {
  return function listener(message: unknown) {
    if (backgroundEvent.privateStateUpdated.match(message)) {
      onUpdate();
    }
    return undefined;
  };
}

export function usePrivateState(): UsePrivateStateResult {
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [error, setError] = useState(false);
  const [fetchAttemptId, setFetchAttemptId] = useState(0);

  useEffect(() => {
    let mounted = true;
    setError(false);

    loadPrivateStateWithRetry()
      .then(state => {
        if (mounted) {
          setPrivateState(state);
        }
      })
      .catch(error => {
        console.error('fetch private state:', error);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetchAttemptId]);

  useEffect(() => {
    const listener = createPrivateStateUpdatedListener(() =>
      setFetchAttemptId(id => id + 1)
    );

    runtime.onMessage.addListener(listener);

    return () => {
      runtime.onMessage.removeListener(listener);
    };
  }, []);

  const retry = useCallback(() => setFetchAttemptId(id => id + 1), []);

  return { privateState, error, retry };
}
