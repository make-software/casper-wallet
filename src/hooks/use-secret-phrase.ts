import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchSecretPhrase } from '@background/handlers/vault-secrets';
import { selectVaultIsLocked } from '@background/redux/session/selectors';

import { SecretPhrase } from '@libs/crypto';
import { requestWithRetry } from '@libs/messaging/request-with-retry';

interface UseSecretPhraseResult {
  secretPhrase: SecretPhrase | null;
  error: boolean;
  retry: () => void;
}

export function useSecretPhrase(enabled = true): UseSecretPhraseResult {
  const [secretPhrase, setSecretPhrase] = useState<SecretPhrase | null>(null);
  const [error, setError] = useState(false);
  const [fetchAttemptId, setFetchAttemptId] = useState(0);
  const isLocked = useSelector(selectVaultIsLocked);

  useEffect(() => {
    // A JS string can't be zeroized, so dwell time is the only lever: drop the
    // phrase on lock and don't fetch until the caller enables it.
    if (isLocked || !enabled) {
      setSecretPhrase(null);
      return;
    }

    let mounted = true;
    setError(false);

    requestWithRetry(fetchSecretPhrase)
      .then(phrase => {
        if (mounted) {
          if (phrase == null) {
            setError(true);
          } else {
            setSecretPhrase(phrase);
          }
        }
      })
      .catch(error => {
        console.error('fetch secret phrase:', error);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetchAttemptId, isLocked, enabled]);

  const retry = useCallback(() => setFetchAttemptId(id => id + 1), []);

  return { secretPhrase, error, retry };
}
