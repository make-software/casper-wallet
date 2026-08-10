import { useCallback, useEffect, useState } from 'react';
import { runtime } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import {
  PrivateState,
  fetchPrivateState
} from '@background/handlers/private-state';

const PRIVATE_STATE_FETCH_TIMEOUT_MS = 5000;
/** Targets the MV3 SW-restart race: a rejected sendMessage usually succeeds on re-send */
export const PRIVATE_STATE_RETRY_DELAYS_MS = [250, 500];

interface UsePrivateStateResult {
  privateState: PrivateState | null;
  error: boolean;
  retry: () => void;
}

function fetchWithTimeout(): Promise<PrivateState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Private state request timed out')),
      PRIVATE_STATE_FETCH_TIMEOUT_MS
    );

    fetchPrivateState().then(
      state => {
        clearTimeout(timer);
        resolve(state);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function loadPrivateStateWithRetry(): Promise<PrivateState> {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= PRIVATE_STATE_RETRY_DELAYS_MS.length;
    attempt++
  ) {
    if (attempt > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, PRIVATE_STATE_RETRY_DELAYS_MS[attempt - 1])
      );
    }

    try {
      return await fetchWithTimeout();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
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
    function listener(message: unknown) {
      if (backgroundEvent.privateStateUpdated.match(message)) {
        setFetchAttemptId(id => id + 1);
      }
      return undefined;
    }

    runtime.onMessage.addListener(listener);

    return () => {
      runtime.onMessage.removeListener(listener);
    };
  }, []);

  const retry = useCallback(() => setFetchAttemptId(id => id + 1), []);

  return { privateState, error, retry };
}
